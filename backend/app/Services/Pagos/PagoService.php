<?php

namespace App\Services\Pagos;

use App\Models\Lead;
use App\Models\Membresia;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Pagos del portal con la pasarela Wompi (RF-050 a RF-056).
 *
 * Flujo:
 *   1. iniciar...()        → se guarda el pago "pendiente" y se arma la URL del checkout de Wompi
 *                            (con la firma de integridad para que nadie cambie el valor).
 *   2. La persona paga en Wompi (PSE, tarjeta, Nequi...) y Wompi la devuelve a /pago/resultado.html?id=...
 *   3. confirmarTransaccion() le pregunta a Wompi (servidor a servidor) cómo quedó esa transacción.
 *      El webhook (procesarEvento) hace lo mismo cuando Wompi avisa por su cuenta.
 *   4. Si quedó APROBADA y el valor coincide, se aplica lo comprado una sola vez:
 *      la membresía se activa o el inmueble pasa a vendido / arrendado.
 *
 * Sin llaves de Wompi en el .env el portal trabaja en modo SIMULADO: el pago se aprueba al instante
 * (así el proyecto sigue funcionando en los equipos que no tienen cuenta de Wompi).
 */
class PagoService
{
    private const ZONA = 'America/Bogota';

    /** Estados de Wompi → estados del portal. */
    private const ESTADOS_WOMPI = [
        'APPROVED' => 'aprobado',
        'DECLINED' => 'rechazado',
        'VOIDED' => 'anulado',
        'ERROR' => 'error',
        'PENDING' => 'pendiente',
    ];

    public function modo(): string
    {
        return config('services.wompi.public_key') && config('services.wompi.integrity_secret') ? 'wompi' : 'simulado';
    }

    public function simulado(): bool
    {
        return $this->modo() === 'simulado';
    }

    /* =================== Iniciar pagos =================== */

    /** Membresía de una inmobiliaria o un vendedor. */
    public function iniciarMembresia(User $usuario, string $plan): array
    {
        $pago = Pago::create([
            'referencia' => $this->nuevaReferencia('MEM'),
            'concepto' => 'membresia',
            'user_id' => $usuario->id,
            'plan' => $plan,
            'monto_centavos' => (int) round(Membresia::PRECIOS_PLAN[$plan] * 100),
            'moneda' => 'COP',
            'proveedor' => $this->modo(),
            'pagador_nombre' => $usuario->name,
            'pagador_correo' => $usuario->email,
        ]);

        return $this->siguientePaso($pago);
    }

    /** Compra o arriendo de un inmueble publicado (pagador sin cuenta). */
    public function iniciarPropiedad(Propiedad $propiedad, array $pagador): array
    {
        $pago = Pago::create([
            'referencia' => $this->nuevaReferencia($propiedad->operacion === 'venta' ? 'VEN' : 'ARR'),
            'concepto' => 'propiedad',
            'propiedad_id' => $propiedad->id,
            'monto_centavos' => (int) $propiedad->precio * 100,
            'moneda' => 'COP',
            'proveedor' => $this->modo(),
            'pagador_nombre' => $pagador['nombre'],
            'pagador_correo' => $pagador['correo'],
            'pagador_documento' => $pagador['documento'],
        ]);

        return $this->siguientePaso($pago);
    }

    /**
     * Wompi: devuelve la URL del checkout.
     * Simulado: aprueba de una vez y devuelve la página de resultado.
     */
    private function siguientePaso(Pago $pago): array
    {
        if ($this->simulado()) {
            $this->actualizar($pago, 'aprobado', 'SIM-' . strtoupper(Str::random(10)), 'SIMULADO', $pago->monto_centavos);

            return ['pago' => $pago->fresh(), 'url' => $this->urlResultado() . '?ref=' . urlencode($pago->referencia)];
        }

        return ['pago' => $pago, 'url' => $this->urlCheckout($pago)];
    }

    /** URL del Web Checkout de Wompi con la firma de integridad. */
    public function urlCheckout(Pago $pago): string
    {
        $parametros = [
            'public-key' => config('services.wompi.public_key'),
            'currency' => $pago->moneda,
            'amount-in-cents' => $pago->monto_centavos,
            'reference' => $pago->referencia,
            'signature:integrity' => $this->firmaIntegridad($pago),
            'redirect-url' => $this->urlResultado(),
        ];
        if ($pago->pagador_correo) {
            $parametros['customer-data:email'] = $pago->pagador_correo;
        }
        if ($pago->pagador_nombre) {
            $parametros['customer-data:full-name'] = $pago->pagador_nombre;
        }

        return config('services.wompi.checkout_url') . '?' . http_build_query($parametros);
    }

    /** SHA256("<referencia><monto en centavos><moneda><secreto de integridad>") — así lo pide Wompi. */
    public function firmaIntegridad(Pago $pago): string
    {
        return hash('sha256', $pago->referencia . $pago->monto_centavos . $pago->moneda . config('services.wompi.integrity_secret'));
    }

    public function urlResultado(): string
    {
        return rtrim(config('portal.frontend_url'), '/') . '/pago/resultado.html';
    }

    /* =================== Confirmar pagos =================== */

    /** Consulta a Wompi el estado real de una transacción (lo que llega en ?id= al volver del checkout). */
    public function confirmarTransaccion(string $transaccionId): ?Pago
    {
        $respuesta = Http::timeout(10)->acceptJson()
            ->get(rtrim(config('services.wompi.api_url'), '/') . '/transactions/' . rawurlencode($transaccionId));

        if (! $respuesta->successful()) {
            return null;
        }

        $tx = $respuesta->json('data');
        $pago = $tx ? Pago::where('referencia', $tx['reference'] ?? '')->first() : null;
        if (! $pago) {
            return null;
        }

        return $this->actualizar(
            $pago,
            self::ESTADOS_WOMPI[$tx['status'] ?? ''] ?? 'pendiente',
            $tx['id'] ?? $transaccionId,
            $tx['payment_method_type'] ?? null,
            (int) ($tx['amount_in_cents'] ?? 0)
        );
    }

    /**
     * Webhook de Wompi (evento transaction.updated).
     * Se valida el checksum: SHA256(valores de signature.properties + timestamp + secreto de eventos).
     */
    public function procesarEvento(array $evento, ?string $checksumCabecera): bool
    {
        $secreto = config('services.wompi.events_secret');
        $firma = $evento['signature'] ?? [];
        if (! $secreto || empty($firma['properties']) || ! isset($evento['timestamp'])) {
            return false;
        }

        $cadena = '';
        foreach ($firma['properties'] as $propiedad) {
            $cadena .= (string) data_get($evento['data'] ?? [], $propiedad);
        }
        $calculado = hash('sha256', $cadena . $evento['timestamp'] . $secreto);
        $recibido = strtolower((string) ($checksumCabecera ?: ($firma['checksum'] ?? '')));

        if (! hash_equals($calculado, $recibido)) {
            return false;
        }

        $tx = data_get($evento, 'data.transaction');
        if (($evento['event'] ?? '') !== 'transaction.updated' || ! $tx) {
            return true; // evento válido que no nos interesa
        }

        $pago = Pago::where('referencia', $tx['reference'] ?? '')->first();
        if ($pago) {
            $this->actualizar(
                $pago,
                self::ESTADOS_WOMPI[$tx['status'] ?? ''] ?? 'pendiente',
                $tx['id'] ?? null,
                $tx['payment_method_type'] ?? null,
                (int) ($tx['amount_in_cents'] ?? 0)
            );
        }

        return true;
    }

    /**
     * Guarda el nuevo estado. Si queda aprobado (y antes no lo estaba) se aplica lo comprado.
     * Todo dentro de una transacción con bloqueo, para que el webhook y la página de
     * resultado no apliquen el mismo pago dos veces.
     */
    public function actualizar(Pago $pago, string $estado, ?string $transaccionId, ?string $metodo, int $montoCentavos): Pago
    {
        return DB::transaction(function () use ($pago, $estado, $transaccionId, $metodo, $montoCentavos) {
            $pago = Pago::whereKey($pago->id)->lockForUpdate()->first();

            // Un pago aprobado ya no cambia
            if ($pago->estado === 'aprobado') {
                return $pago;
            }
            // El valor cobrado debe ser exactamente el que se pidió
            if ($estado === 'aprobado' && $montoCentavos !== $pago->monto_centavos) {
                Log::warning('Pago con valor distinto al esperado', ['referencia' => $pago->referencia, 'recibido' => $montoCentavos]);
                $estado = 'error';
            }

            $pago->fill([
                'estado' => $estado,
                'transaccion_id' => $transaccionId ?? $pago->transaccion_id,
                'metodo' => $metodo ?? $pago->metodo,
            ]);

            if ($estado === 'aprobado') {
                $pago->pagado_en = now();
                $this->aplicar($pago);
            }
            $pago->save();

            return $pago;
        });
    }

    /* =================== Lo que se compró =================== */

    private function aplicar(Pago $pago): void
    {
        if ($pago->concepto === 'membresia') {
            $pago->membresia_id = $this->activarMembresia($pago)->id;

            return;
        }

        $propiedad = $pago->propiedad_id ? Propiedad::whereKey($pago->propiedad_id)->lockForUpdate()->first() : null;
        if (! $propiedad) {
            return;
        }

        // El inmueble sale del portal (RF-063): vendido o arrendado
        if ($propiedad->estado === 'publicada') {
            $propiedad->update(['estado' => $propiedad->operacion === 'venta' ? 'vendida' : 'arrendada']);
        }

        // Quien publicó (y su agente) recibe los datos del comprador como un contacto
        Lead::create([
            'propiedad_id' => $propiedad->id,
            'agente_id' => $propiedad->agente_id,
            'nombre' => $pago->pagador_nombre,
            'contacto' => $pago->pagador_correo,
            'mensaje' => 'Pago aprobado por ' . ($propiedad->operacion === 'venta' ? 'la compra' : 'el arriendo')
                . ' del inmueble. Referencia ' . $pago->referencia . ' · documento ' . $pago->pagador_documento . '.',
            'consentimiento' => true,
            'estado' => 'nuevo',
        ]);
    }

    /** Activa o renueva la membresía. Renovar antes de vencer no hace perder días (RF-055). */
    private function activarMembresia(Pago $pago): Membresia
    {
        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $ultimaVigente = Membresia::where('user_id', $pago->user_id)
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy->toDateString())
            ->orderByDesc('fecha_fin')
            ->first();
        $inicio = $ultimaVigente ? Carbon::parse($ultimaVigente->fecha_fin->toDateString()) : $hoy;

        return Membresia::create([
            'user_id' => $pago->user_id,
            'plan' => $pago->plan,
            'precio' => $pago->monto,                       // el precio que se cobró (RF-058)
            'estado' => 'activa',
            'fecha_inicio' => $inicio->toDateString(),
            'fecha_fin' => Membresia::calcularFin($pago->plan, $inicio)->toDateString(),
            'referencia_pago' => $pago->referencia,
        ]);
    }

    private function nuevaReferencia(string $prefijo): string
    {
        return 'UMB-' . $prefijo . '-' . now()->format('ymdHis') . '-' . strtoupper(Str::random(6));
    }
}
