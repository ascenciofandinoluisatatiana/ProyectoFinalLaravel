<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\Pago;
use App\Services\Pagos\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Pagos públicos del portal (PayU o Wompi).
 *   GET  /api/v1/public/pagos/estado          → resultado de un pago (página /pago/resultado.html)
 *   GET  /api/v1/public/pagos/payu/formulario → campos firmados para enviar el pago a PayU
 *   POST /api/v1/pagos/payu/confirmacion      → PayU avisa el resultado del pago
 *   POST /api/v1/pagos/wompi/eventos          → webhook: Wompi avisa los cambios de estado
 */
class PagoController extends Controller
{
    public function __construct(private PagoService $pagos)
    {
    }

    /**
     * GET /public/pagos/estado?id=TRANSACCION   (vuelta desde Wompi)
     * GET /public/pagos/estado?ref=REFERENCIA   (modo simulado o para volver a consultar)
     * Solo devuelve el resultado del pago, nunca datos personales.
     */
    public function estado(Request $request): JsonResponse
    {
        $pago = null;
        if ($request->filled('referenceCode')) {
            $pago = $this->pagos->confirmarRespuestaPayu($request->query());
        }
        if (! $pago && $request->filled('id') && $this->pagos->modo() === 'wompi') {
            $pago = $this->pagos->confirmarTransaccion((string) $request->query('id'));
        }
        if (! $pago && $request->filled('ref')) {
            $pago = Pago::where('referencia', (string) $request->query('ref'))->first();
            // Si sigue pendiente y ya tiene transacción, se vuelve a preguntar a Wompi
            if ($pago && $pago->estado === 'pendiente' && $pago->transaccion_id && $pago->proveedor === 'wompi' && $this->pagos->modo() === 'wompi') {
                $pago = $this->pagos->confirmarTransaccion($pago->transaccion_id) ?? $pago;
            }
        }
        if (! $pago) {
            return response()->json(['message' => 'No encontramos ese pago.'], 404);
        }

        $pago->loadMissing(['propiedad', 'usuario.role']);

        return response()->json(['data' => [
            'referencia' => $pago->referencia,
            'estado' => $pago->estado,
            'concepto' => $pago->concepto,
            'detalle' => $this->detalle($pago),
            'monto' => $pago->monto,
            'metodo' => $pago->metodo,
            'simulado' => $pago->proveedor === 'simulado',
            'volver' => $this->volver($pago),
        ]]);
    }

    /**
     * GET /public/pagos/payu/formulario?ref=REFERENCIA
     * Campos firmados para enviar el pago a PayU. Solo pagos de PayU que siguen pendientes.
     */
    public function formularioPayu(Request $request): JsonResponse
    {
        $pago = Pago::where('referencia', (string) $request->query('ref'))->where('proveedor', 'payu')->first();
        if (! $pago) {
            return response()->json(['message' => 'No encontramos ese pago.'], 404);
        }
        if ($pago->estado !== 'pendiente') {
            return response()->json(['message' => 'Este pago ya no está pendiente.', 'estado' => $pago->estado], 409);
        }

        return response()->json(['data' => $this->pagos->formularioPayu($pago)]);
    }

    /** POST /pagos/payu/confirmacion — PayU avisa el resultado (servidor a servidor). */
    public function confirmacionPayu(Request $request): JsonResponse
    {
        $valido = $this->pagos->procesarConfirmacionPayu($request->all());

        return response()->json(['ok' => $valido], $valido ? 200 : 400);
    }

    /** POST /pagos/wompi/eventos — Wompi solo necesita un 200; si la firma no cuadra se ignora. */
    public function eventos(Request $request): JsonResponse
    {
        $valido = $this->pagos->procesarEvento($request->all(), $request->header('X-Event-Checksum'));

        return response()->json(['ok' => $valido], $valido ? 200 : 400);
    }

    private function detalle(Pago $pago): string
    {
        $p = $pago->propiedad;
        $datosPlan = $pago->oferta_datos ? (json_decode($pago->oferta_datos, true) ?: []) : [];
        if (($datosPlan['rol'] ?? null) === 'plan_publicacion') {
            return (($datosPlan['tipo'] ?? '') === 'normal' ? 'Publicación normal por ' : 'Posicionamiento por ')
                . ($datosPlan['dias'] ?? '') . ' días'
                . ($p ? ' · ' . ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : '');
        }
        if ($pago->plan === \App\Models\PaqueteMembresia::PLAN) {
            $copia = $pago->oferta_datos ? (json_decode($pago->oferta_datos, true) ?: []) : [];

            return 'Paquete ' . ($copia['nombre'] ?? 'mensual') . ' de '
                . ($copia['publicaciones'] ?? \App\Models\PaqueteMembresia::PUBLICACIONES) . ' publicaciones destacadas';
        }
        if ($pago->concepto === 'membresia') {
            return 'Membresía ' . mb_strtolower(Membresia::NOMBRES_PLAN[$pago->plan] ?? $pago->plan)
                . ($p ? ' · ' . ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : '');
        }

        return $p ? (ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad . ' · ' . ($p->operacion === 'venta' ? 'compra' : 'arriendo')) : 'Inmueble';
    }

    /** A dónde vuelve la persona después de ver el resultado. */
    private function volver(Pago $pago): string
    {
        if ($pago->concepto === 'membresia') {
            if ($pago->usuario?->role?->nombre === 'vendedor') {
                return $pago->propiedad?->operacion === 'arriendo' ? '/vendedor/arrendar.html' : '/vendedor/vender.html';            }

            // Membresía de una publicación → vuelve a Propiedades, donde se ve destacada
            return $pago->propiedad_id ? '/inmobiliaria/propiedades.html' : '/inmobiliaria/membresia.html';
        }

        return '/invitado/dashboard.html';
    }
}
