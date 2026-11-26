<?php

namespace App\Services\Pagos;

use App\Models\Membresia;
use App\Models\Movimiento;
use App\Models\Pago;
use App\Models\OfertaPaquete;
use App\Models\OfertaVendedor;
use App\Models\PaqueteMembresia;
use App\Models\PlanMembresia;
use App\Models\PlanPublicacion;
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

    /** Estados de PayU (transactionState / state_pol) → estados del portal. */
    private const ESTADOS_PAYU = [
        '4' => 'aprobado',
        '6' => 'rechazado',
        '5' => 'anulado',
        '104' => 'error',
        '7' => 'pendiente',
    ];

    public function modo(): string
    {
        if (config('services.payu.merchant_id') && config('services.payu.account_id') && config('services.payu.api_key')) {
            return 'payu';
        }

        return config('services.wompi.public_key') && config('services.wompi.integrity_secret') ? 'wompi' : 'simulado';
    }

    /** Nombre de la pasarela para mostrarlo en pantalla. */
    public function nombrePasarela(): string
    {
        return ['payu' => 'PayU', 'wompi' => 'Wompi'][$this->modo()] ?? 'simulado';
    }

    public function simulado(): bool
    {
        return $this->modo() === 'simulado';
    }

    /* =================== Iniciar pagos =================== */

    /**
     * Membresía. Con $propiedad se destaca SOLO esa publicación (inmobiliaria);
     * sin ella aplica a toda la cuenta (así la usa el vendedor).
     * El precio es el vigente que define el administrador (planes_membresia).
     */
    public function iniciarMembresia(User $usuario, string $plan, ?Propiedad $propiedad = null): array
    {
        $pago = Pago::create([
            'referencia' => $this->nuevaReferencia($propiedad ? 'DES' : 'MEM'),
            'concepto' => 'membresia',
            'user_id' => $usuario->id,
            'propiedad_id' => $propiedad?->id,
            'plan' => $plan,
            'monto_centavos' => (int) round($this->precioPlan($plan) * 100),
            'moneda' => 'COP',
            'proveedor' => $this->modo(),
            'pagador_nombre' => $usuario->name,
            'pagador_correo' => $usuario->email,
        ]);

        return $this->siguientePaso($pago);
    }

    /**
     * Paquete de publicaciones de inmobiliaria: se paga el precio vigente de la oferta del
     * administrador y se guarda una copia de lo cotizado, para activar exactamente eso.
     */
    public function iniciarPaquete(User $usuario, OfertaPaquete $oferta): array
    {
        $pago = Pago::create([
            'referencia' => $this->nuevaReferencia('PAQ'),
            'concepto' => 'membresia',
            'user_id' => $usuario->id,
            'plan' => PaqueteMembresia::PLAN,
            'oferta_id' => $oferta->id,
            'oferta_datos' => json_encode([
                'nombre' => $oferta->nombre,
                'plan' => $oferta->plan,
                'publicaciones' => $oferta->publicaciones,
                'dias' => $oferta->dias(),
                'descuento' => $oferta->descuento,
            ], JSON_UNESCAPED_UNICODE),
            'monto_centavos' => $oferta->precio() * 100,
            'moneda' => 'COP',
            'proveedor' => $this->modo(),
            'pagador_nombre' => $usuario->name,
            'pagador_correo' => $usuario->email,
        ]);

        return $this->siguientePaso($pago);
    }

    /**
     * Paquete de un vendedor: se paga el precio vigente de la oferta y se guarda una copia de lo
     * cotizado. La propiedad elegida entra al paquete apenas el pago queda aprobado.
     */
    public function iniciarPaqueteVendedor(User $usuario, OfertaVendedor $oferta, Propiedad $propiedad): array
    {
        $pago = Pago::create([
            'referencia' => $this->nuevaReferencia('PAV'),
            'concepto' => 'membresia',
            'user_id' => $usuario->id,
            'propiedad_id' => $propiedad->id,
            'plan' => PaqueteMembresia::PLAN,
            'oferta_datos' => json_encode([
                'rol' => 'vendedor',
                'oferta_vendedor_id' => $oferta->id,
                'nombre' => $oferta->nombre,
                'plan' => $oferta->zona,
                'publicaciones' => $oferta->propiedades,
                'dias' => $oferta->dias,
                'descuento' => null,
            ], JSON_UNESCAPED_UNICODE),
            'monto_centavos' => (int) $oferta->precio * 100,
            'moneda' => 'COP',
            'proveedor' => $this->modo(),
            'pagador_nombre' => $usuario->name,
            'pagador_correo' => $usuario->email,
        ]);

        return $this->siguientePaso($pago);
    }

    /**
     * Plan nuevo de publicación: normal por tiempo o posicionamiento de una normal (7/15/30 días).
     * Se guarda una copia de lo cotizado; al aprobarse se activa en la propiedad.
     */
    public function iniciarPlanPublicacion(User $usuario, PlanPublicacion $plan, Propiedad $propiedad): array
    {
        $pago = Pago::create([
            'referencia' => $this->nuevaReferencia($plan->tipo === 'normal' ? 'PUB' : 'POS'),
            'concepto' => 'membresia',
            'user_id' => $usuario->id,
            'propiedad_id' => $propiedad->id,
            'plan' => ($plan->tipo === 'normal' ? 'Normal ' : 'Posic. ') . $plan->dias . ' días',
            'oferta_datos' => json_encode([
                'rol' => 'plan_publicacion',
                'tipo' => $plan->tipo,
                'plan_publicacion_id' => $plan->id,
                'dias' => $plan->dias,
            ], JSON_UNESCAPED_UNICODE),
            'monto_centavos' => (int) $plan->precio * 100,
            'moneda' => 'COP',
            'proveedor' => $this->modo(),
            'pagador_nombre' => $usuario->name,
            'pagador_correo' => $usuario->email,
        ]);

        return $this->siguientePaso($pago);
    }

    /** Precio vigente: los planes los define el administrador (planes_membresia). */
    public function precioPlan(string $plan): float
    {
        return (float) PlanMembresia::precios()[$plan];
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

        if ($pago->proveedor === 'payu') {
            return ['pago' => $pago, 'url' => rtrim(config('portal.frontend_url'), '/') . '/pago/payu.html?ref=' . urlencode($pago->referencia)];
        }

        return ['pago' => $pago, 'url' => $this->urlCheckout($pago)];
    }

    /* =================== PayU =================== */

    /**
     * Datos del formulario que el navegador envía por POST al Web Checkout de PayU.
     * Firma: MD5("apiKey~merchantId~referencia~valor~moneda").
     */
    public function formularioPayu(Pago $pago): array
    {
        $valor = $this->valorPayu($pago->monto_centavos);
        $campos = [
            'merchantId' => (string) config('services.payu.merchant_id'),
            'accountId' => (string) config('services.payu.account_id'),
            'description' => mb_substr($this->descripcionPayu($pago), 0, 255),
            'referenceCode' => $pago->referencia,
            'amount' => $valor,
            'tax' => '0',
            'taxReturnBase' => '0',
            'currency' => $pago->moneda,
            'signature' => $this->firmaPayu($pago->referencia, $valor, $pago->moneda),
            'algorithmSignature' => 'MD5',
            'test' => config('services.payu.test') ? '1' : '0',
            'buyerFullName' => (string) $pago->pagador_nombre,
            'buyerEmail' => (string) $pago->pagador_correo,
            'telephone' => (string) ($pago->usuario?->telefono ?? ''),
            'lng' => 'es',
            'responseUrl' => $this->urlResultado(),
            'confirmationUrl' => $this->urlConfirmacionPayu(),
        ];

        return ['accion' => (string) config('services.payu.checkout_url'), 'campos' => $campos];
    }

    public function firmaPayu(string $referencia, string $valor, string $moneda): string
    {
        return md5(implode('~', [config('services.payu.api_key'), config('services.payu.merchant_id'), $referencia, $valor, $moneda]));
    }

    public function urlConfirmacionPayu(): string
    {
        return config('services.payu.confirmation_url')
            ?: rtrim(config('portal.frontend_url'), '/') . '/api/v1/pagos/payu/confirmacion';
    }

    /** COP sin decimales cuando el valor es entero (así lo firma y lo cobra PayU). */
    private function valorPayu(int $centavos): string
    {
        return $centavos % 100 === 0 ? (string) intdiv($centavos, 100) : number_format($centavos / 100, 2, '.', '');
    }

    private function descripcionPayu(Pago $pago): string
    {
        $datos = $pago->oferta_datos ? (json_decode($pago->oferta_datos, true) ?: []) : [];
        if (($datos['rol'] ?? null) === 'plan_publicacion') {
            return 'UMBRAL ' . (($datos['tipo'] ?? '') === 'normal' ? 'publicacion' : 'posicionamiento') . ' ' . ($datos['dias'] ?? '') . ' dias';
        }
        if ($pago->plan === PaqueteMembresia::PLAN) {
            return 'UMBRAL paquete ' . ($datos['nombre'] ?? 'de publicaciones');
        }

        return 'UMBRAL membresia ' . $pago->plan;
    }

    /**
     * Vuelta del navegador desde PayU (responseUrl, por GET).
     * Firma: MD5("apiKey~merchantId~referencia~valor con 1 decimal~moneda~transactionState").
     */
    public function confirmarRespuestaPayu(array $datos): ?Pago
    {
        $pago = Pago::where('referencia', (string) ($datos['referenceCode'] ?? ''))->where('proveedor', 'payu')->first();
        if (! $pago || ! isset($datos['TX_VALUE'], $datos['transactionState'], $datos['signature'])) {
            return $pago;
        }

        $esperada = md5(implode('~', [
            config('services.payu.api_key'),
            config('services.payu.merchant_id'),
            $pago->referencia,
            $this->redondeoPar((float) $datos['TX_VALUE']),
            (string) ($datos['currency'] ?? $pago->moneda),
            (string) $datos['transactionState'],
        ]));
        if (! hash_equals($esperada, strtolower((string) $datos['signature']))) {
            Log::warning('PayU: firma de respuesta no coincide', ['referencia' => $pago->referencia]);

            return $pago;
        }

        return $this->actualizar(
            $pago,
            self::ESTADOS_PAYU[(string) $datos['transactionState']] ?? 'pendiente',
            isset($datos['transactionId']) ? (string) $datos['transactionId'] : null,
            isset($datos['lapPaymentMethod']) ? (string) $datos['lapPaymentMethod'] : null,
            (int) round(((float) $datos['TX_VALUE']) * 100)
        );
    }

    /**
     * Confirmación servidor a servidor de PayU (confirmationUrl, por POST).
     * Firma: MD5("apiKey~merchant_id~reference_sale~valor~moneda~state_pol"), donde el valor lleva
     * 1 decimal si el segundo decimal es cero (150.00 → 150.0) y 2 si no (150.26).
     */
    public function procesarConfirmacionPayu(array $datos): bool
    {
        $valor = (float) ($datos['value'] ?? 0);
        $centavos = (int) round($valor * 100);
        $nuevoValor = $centavos % 10 === 0 ? number_format($valor, 1, '.', '') : number_format($valor, 2, '.', '');
        $esperada = md5(implode('~', [
            config('services.payu.api_key'),
            (string) ($datos['merchant_id'] ?? ''),
            (string) ($datos['reference_sale'] ?? ''),
            $nuevoValor,
            (string) ($datos['currency'] ?? ''),
            (string) ($datos['state_pol'] ?? ''),
        ]));
        $firmaValida = (string) ($datos['merchant_id'] ?? '') === (string) config('services.payu.merchant_id')
            && hash_equals($esperada, strtolower((string) ($datos['sign'] ?? '')));

        $idEvento = $firmaValida
            ? mb_substr('PAYU-' . ($datos['transaction_id'] ?? 'sin-id') . '-' . ($datos['state_pol'] ?? ''), 0, 80)
            : 'INV-' . sha1(json_encode($datos));
        $pago = $firmaValida ? Pago::where('referencia', (string) ($datos['reference_sale'] ?? ''))->where('proveedor', 'payu')->first() : null;

        DB::table('eventos_webhook_pago')->insertOrIgnore([
            'id_evento_proveedor' => $idEvento,
            'pago_id' => $pago?->id,
            'payload' => json_encode($datos),
            'firma_valida' => $firmaValida,
        ]);
        $registro = DB::table('eventos_webhook_pago')->where('id_evento_proveedor', $idEvento)->first();

        if (! $firmaValida) {
            return false;
        }
        if ($registro->procesado) {
            return true;
        }
        if ($pago) {
            $this->actualizar(
                $pago,
                self::ESTADOS_PAYU[(string) ($datos['state_pol'] ?? '')] ?? 'pendiente',
                isset($datos['transaction_id']) ? (string) $datos['transaction_id'] : null,
                isset($datos['payment_method_name']) ? (string) $datos['payment_method_name'] : null,
                $centavos
            );
        }
        DB::table('eventos_webhook_pago')->where('id', $registro->id)->update(['procesado' => true]);

        return true;
    }

    /** Redondeo a 1 decimal "mitad al par", como lo pide PayU para la firma de respuesta. */
    private function redondeoPar(float $valor): string
    {
        return number_format(round($valor, 1, PHP_ROUND_HALF_EVEN), 1, '.', '');
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
        $firmaValida = hash_equals($calculado, $recibido);

        $tx = data_get($evento, 'data.transaction');

        // Wompi no manda un identificador del aviso: se arma con la transacción, su estado y la hora.
        // Un aviso con firma falsa se guarda aparte, con un identificador propio.
        $idEvento = $firmaValida
            ? mb_substr(($tx['id'] ?? 'sin-id') . '-' . ($tx['status'] ?? 'sin-estado') . '-' . $evento['timestamp'], 0, 80)
            : 'INV-' . sha1(json_encode($evento));

        $pago = ($firmaValida && $tx) ? Pago::where('referencia', $tx['reference'] ?? '')->first() : null;

        // Se guarda el aviso completo. Si ya existía (Wompi lo reenvió), no se duplica.
        DB::table('eventos_webhook_pago')->insertOrIgnore([
            'id_evento_proveedor' => $idEvento,
            'pago_id' => $pago?->id,
            'payload' => json_encode($evento),
            'firma_valida' => $firmaValida,
        ]);
        $registro = DB::table('eventos_webhook_pago')->where('id_evento_proveedor', $idEvento)->first();

        if (! $firmaValida) {
            return false;
        }
        if ($registro->procesado) {
            return true; // este aviso ya se procesó antes
        }

        if (($evento['event'] ?? '') === 'transaction.updated' && $tx && $pago) {
            $this->actualizar(
                $pago,
                self::ESTADOS_WOMPI[$tx['status'] ?? ''] ?? 'pendiente',
                $tx['id'] ?? null,
                $tx['payment_method_type'] ?? null,
                (int) ($tx['amount_in_cents'] ?? 0)
            );
        }

        DB::table('eventos_webhook_pago')->where('id', $registro->id)->update(['procesado' => true]);

        return true;
    }

    /**
     * Guarda el nuevo estado. Si queda aprobado (y antes no lo estaba) se aplica lo comprado.
     * Todo dentro de una transacción con bloqueo, para que el webhook y la página de
     * resultado no apliquen el mismo pago dos veces.
     */
    public function actualizar(Pago $pago, string $estado, ?string $transaccionId, ?string $metodo, int $montoCentavos): Pago
    {
        $recienAprobado = false;
        $estadoAntes = $pago->estado;

        $pago = DB::transaction(function () use ($pago, $estado, $transaccionId, $metodo, $montoCentavos, &$recienAprobado) {
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
                $recienAprobado = true;
                $pago->pagado_en = now();
                $pago->numero_comprobante = 'COMP-' . now()->format('Ymd') . '-' . str_pad((string) $pago->id, 6, '0', STR_PAD_LEFT);
                $this->aplicar($pago);
            }
            $pago->save();

            return $pago;
        });

        // Movimiento del pago aprobado (fuera de la transacción: anotarlo nunca debe afectar al pago)
        if ($recienAprobado) {
            Movimiento::registrar($pago->user_id, 'pago_aprobado', $pago->referencia . ' · ' . $pago->plan, [
                'entidad' => 'pago',
                'entidad_id' => $pago->id,
                'titulo' => 'Pago aprobado: ' . $pago->plan,
                'valor' => $pago->monto,
            ]);
        }

        // Aviso guardado para la inmobiliaria (aprobado, rechazado, no completado); no repite si el estado no cambió
        if ($recienAprobado || ($pago->estado !== $estadoAntes && in_array($pago->estado, ['rechazado', 'error', 'anulado'], true))) {
            \App\Services\Paneles\AvisosGuardados::pagoResultado($pago);
        }

        return $pago;
    }

    /* =================== Lo que se compró =================== */

    private function aplicar(Pago $pago): void
    {
        $copia = $pago->oferta_datos ? (json_decode($pago->oferta_datos, true) ?: []) : [];
        if (($copia['rol'] ?? null) === 'plan_publicacion') {
            $this->activarPlanPublicacion($pago, $copia);

            return;
        }
        if ($pago->concepto === 'membresia' && $pago->plan === PaqueteMembresia::PLAN) {
            $this->activarPaquete($pago);

            return;
        }
        if ($pago->concepto === 'membresia') {
            $pago->membresia_id = $this->activarMembresia($pago)->id;

            return;
        }
    }

    /**
     * Normal por tiempo: publica la propiedad hasta hoy + días. Posicionamiento: marca hasta cuándo sale primero.
     * Si todavía le quedaban días, los nuevos se suman al final (no pierde los que ya pagó).
     */
    private function activarPlanPublicacion(Pago $pago, array $copia): void
    {
        $propiedad = Propiedad::where('user_id', $pago->user_id)->find($pago->propiedad_id);
        if (! $propiedad) {
            return;
        }
        $ahora = Carbon::now();   // hora del servidor, igual que la base de datos y el comando de vencimiento
        $dias = (int) ($copia['dias'] ?? 7);

        if (($copia['tipo'] ?? 'normal') === 'normal') {
            $actual = $propiedad->publicada_hasta ? Carbon::parse($propiedad->publicada_hasta) : null;
            $base = ($actual && $actual->isFuture() && $propiedad->estado === 'publicada') ? $actual : $ahora;
            $propiedad->estado = 'publicada';
            $propiedad->en_espera_pago = false;
            $propiedad->publicada_hasta = $base->copy()->addDays($dias);
        } else {
            $actual = $propiedad->posicionada_hasta ? Carbon::parse($propiedad->posicionada_hasta) : null;
            $base = ($actual && $actual->isFuture()) ? $actual : $ahora;
            $propiedad->posicionada_hasta = $base->copy()->addDays($dias);
        }
        $propiedad->save();

        // Aviso guardado: el plan quedó activo hasta tal fecha (se avisa fuera de la transacción de la propiedad)
        $tipo = ($copia['tipo'] ?? 'normal') === 'normal' ? 'normal' : 'posicionamiento';
        \App\Services\Paneles\AvisosGuardados::planActivado($propiedad, $tipo, $tipo === 'normal' ? $propiedad->publicada_hasta : $propiedad->posicionada_hasta);
    }

    /** Paquete comprado: usa la copia guardada al iniciar el pago; las publicaciones se eligen después en el panel. */
    private function activarPaquete(Pago $pago): PaqueteMembresia
    {
        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $copia = $pago->oferta_datos ? (json_decode($pago->oferta_datos, true) ?: []) : [];
        $dias = (int) ($copia['dias'] ?? PaqueteMembresia::DIAS);

        $paquete = PaqueteMembresia::create([
            'user_id' => $pago->user_id,
            'pago_id' => $pago->id,
            'oferta_id' => $pago->oferta_id,
            'oferta_vendedor_id' => $copia['oferta_vendedor_id'] ?? null,
            'nombre' => $copia['nombre'] ?? null,
            'plan' => $copia['plan'] ?? null,
            'dias' => $dias,
            'descuento' => $copia['descuento'] ?? null,
            'cupos' => (int) ($copia['publicaciones'] ?? PaqueteMembresia::PUBLICACIONES),
            'precio' => $pago->monto,
            'fecha_inicio' => $hoy->toDateString(),
            'fecha_fin' => $hoy->copy()->addDays($dias)->toDateString(),
            'referencia_pago' => $pago->referencia,
        ]);

        // Paquete de vendedor: la propiedad que eligió al pagar entra de una vez (si sigue disponible)
        if (($copia['rol'] ?? null) === 'vendedor' && $pago->propiedad_id) {
            $propiedad = Propiedad::where('user_id', $pago->user_id)->find($pago->propiedad_id);
            if ($propiedad && ! in_array($propiedad->estado, ['vendida', 'arrendada'], true)) {
                $paquete->asignarPropiedad($propiedad->id);
            }
        }

        return $paquete;
    }

    /**
     * Activa o renueva la membresía. Renovar antes de vencer no hace perder días (RF-055).
     * La renovación se cuenta por publicación (o por cuenta si no es de una publicación).
     */
    private function activarMembresia(Pago $pago): Membresia
    {
        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $ultimaVigente = Membresia::where('user_id', $pago->user_id)
            ->when($pago->propiedad_id,
                fn ($q) => $q->where('propiedad_id', $pago->propiedad_id),
                fn ($q) => $q->whereNull('propiedad_id'))
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy->toDateString())
            ->orderByDesc('fecha_fin')
            ->first();
        $inicio = $ultimaVigente ? Carbon::parse($ultimaVigente->fecha_fin->toDateString()) : $hoy;

        // forceCreate: propiedad_id no está en el $fillable del modelo (que es de otro módulo)
        return Membresia::forceCreate([
            'user_id' => $pago->user_id,
            'propiedad_id' => $pago->propiedad_id,
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
