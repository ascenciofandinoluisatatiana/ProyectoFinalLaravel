<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Services\Pagos\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Pagos públicos del portal (Wompi).
 *   POST /api/v1/public/pagos/propiedad   → el invitado compra o arrienda un inmueble
 *   GET  /api/v1/public/pagos/estado      → resultado de un pago (página /pago/resultado.html)
 *   POST /api/v1/pagos/wompi/eventos      → webhook: Wompi avisa los cambios de estado
 */
class PagoController extends Controller
{
    public function __construct(private PagoService $pagos)
    {
    }

    /** POST /public/pagos/propiedad  { propiedad_id, nombre, correo, documento, consentimiento } */
    public function propiedad(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'propiedad_id' => ['required', 'integer'],
            'nombre' => ['required', 'string', 'max:120'],
            'correo' => ['required', 'email', 'max:120'],
            'documento' => ['required', 'string', 'max:30', 'regex:/^[0-9A-Za-z.\-]{4,30}$/'],
            'consentimiento' => ['accepted'],
        ], [
            'nombre.required' => 'Escribe tu nombre.',
            'correo.required' => 'Escribe tu correo.',
            'correo.email' => 'Escribe un correo válido.',
            'documento.required' => 'Escribe tu número de documento.',
            'documento.regex' => 'Escribe un número de documento válido.',
            'consentimiento.accepted' => 'Debes aceptar el tratamiento de datos (Ley 1581).',
        ]);

        $propiedad = Propiedad::where('estado', 'publicada')->find($datos['propiedad_id']);
        if (! $propiedad) {
            throw ValidationException::withMessages(['propiedad_id' => 'Este inmueble ya no está disponible.']);
        }

        $resultado = $this->pagos->iniciarPropiedad($propiedad, $datos);

        return response()->json([
            'message' => $this->pagos->simulado() ? 'Pago simulado aprobado.' : 'Te llevamos a Wompi para hacer el pago.',
            'url' => $resultado['url'],
            'referencia' => $resultado['pago']->referencia,
            'simulado' => $this->pagos->simulado(),
        ]);
    }

    /**
     * GET /public/pagos/estado?id=TRANSACCION   (vuelta desde Wompi)
     * GET /public/pagos/estado?ref=REFERENCIA   (modo simulado o para volver a consultar)
     * Solo devuelve el resultado del pago, nunca datos personales.
     */
    public function estado(Request $request): JsonResponse
    {
        $pago = null;
        if ($request->filled('id') && ! $this->pagos->simulado()) {
            $pago = $this->pagos->confirmarTransaccion((string) $request->query('id'));
        }
        if (! $pago && $request->filled('ref')) {
            $pago = Pago::where('referencia', (string) $request->query('ref'))->first();
            // Si sigue pendiente y ya tiene transacción, se vuelve a preguntar a Wompi
            if ($pago && $pago->estado === 'pendiente' && $pago->transaccion_id && ! $this->pagos->simulado()) {
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

    /** POST /pagos/wompi/eventos — Wompi solo necesita un 200; si la firma no cuadra se ignora. */
    public function eventos(Request $request): JsonResponse
    {
        $valido = $this->pagos->procesarEvento($request->all(), $request->header('X-Event-Checksum'));

        return response()->json(['ok' => $valido], $valido ? 200 : 400);
    }
        private function detalle(Pago $pago): string
    {
        $p = $pago->propiedad;
        if ($pago->concepto === 'membresia') {
            $texto = 'Membresía ' . mb_strtolower(Membresia::NOMBRES_PLAN[$pago->plan] ?? $pago->plan);

            // Membresía por publicación: se dice de cuál inmueble es
            return $p ? $texto . ' · ' . ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : $texto;
        }

        return $p ? (ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad . ' · ' . ($p->operacion === 'venta' ? 'compra' : 'arriendo')) : 'Inmueble';
    }

    /** A dónde vuelve la persona después de ver el resultado. */
    private function volver(Pago $pago): string
    {
        if ($pago->concepto === 'membresia') {
            if ($pago->usuario?->role?->nombre !== 'vendedor') {
                return '/inmobiliaria/membresia.html';
            }

            // El vendedor vuelve a la pantalla donde está ese inmueble (vender o arrendar)
            return $pago->propiedad?->operacion === 'arriendo' ? '/vendedor/arrendar.html' : '/vendedor/vender.html';
        }

        return '/invitado/dashboard.html';
    }
}