<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\PlanPublicacion;
use App\Models\Propiedad;
use App\Services\Pagos\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Planes nuevos de publicación, para inmobiliarias y vendedores (cada uno solo con sus propiedades):
 *   GET  /planes-publicacion                      → planes activos con su precio
 *   POST /propiedades/{id}/publicar-normal {plan_id} → publica una normal por 7/15/30 días (vuelve a borrador al vencer)
 *   POST /propiedades/{id}/posicionar      {plan_id} → posiciona una normal ya publicada por 7/15/30 días
 * Con Wompi responde con "checkout_url"; en modo simulado el pago se aprueba de una vez (201).
 */
class PlanesPublicacionController extends Controller
{
    private const ZONA = 'America/Bogota';

    public function planes(): JsonResponse
    {
        $planes = PlanPublicacion::where('activo', true)->orderBy('tipo')->orderBy('dias')->get()
            ->map(fn ($p) => ['id' => $p->id, 'tipo' => $p->tipo, 'dias' => $p->dias, 'precio' => (int) $p->precio])
            ->groupBy('tipo')->map(fn ($g) => $g->values());

        return response()->json([
            'normal' => $planes->get('normal', []),
            'posicionamiento' => $planes->get('posicionamiento', []),
        ]);
    }

    public function publicarNormal(Request $request, PagoService $pagos, $id): JsonResponse
    {
        $plan = $this->plan($request, 'normal');
        $propiedad = Propiedad::where('user_id', $request->user()->id)->findOrFail($id);

        // Se puede comprar en un borrador, o renovar una normal por tiempo que sigue publicada
        $renueva = $propiedad->estado === 'publicada' && $propiedad->publicada_hasta;
        if ($propiedad->estado !== 'borrador' && ! $renueva) {
            throw ValidationException::withMessages(['plan_id' => 'Solo se puede publicar una propiedad que esté en borrador.']);
        }

        $resultado = $pagos->iniciarPlanPublicacion($request->user(), $plan, $propiedad);
        if (! $pagos->simulado()) {
            return $this->haciaWompi($resultado);
        }

        $propiedad->refresh();

        return response()->json([
            'message' => ($renueva ? 'Publicación renovada' : 'Propiedad publicada') . ' hasta el '
                . Carbon::parse($propiedad->publicada_hasta)->timezone(self::ZONA)->format('d/m/Y') . ' (pago simulado).',
            'publicada_hasta' => $propiedad->publicada_hasta,
            'checkout_url' => null,
        ], 201);
    }

    public function posicionar(Request $request, PagoService $pagos, $id): JsonResponse
    {
        $plan = $this->plan($request, 'posicionamiento');
        $propiedad = Propiedad::where('user_id', $request->user()->id)->findOrFail($id);

        if ($propiedad->estado !== 'publicada') {
            throw ValidationException::withMessages(['plan_id' => 'Solo se puede posicionar una propiedad publicada.']);
        }
        $hoy = Carbon::now(self::ZONA)->toDateString();
        $conMembresia = Membresia::where('propiedad_id', $propiedad->id)->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)->exists();
        if ($conMembresia) {
            throw ValidationException::withMessages(['plan_id' => 'Esta propiedad ya está posicionada con Oro, Plata o Bronce.']);
        }

        $renueva = $propiedad->posicionada_hasta && Carbon::parse($propiedad->posicionada_hasta)->isFuture();
        $resultado = $pagos->iniciarPlanPublicacion($request->user(), $plan, $propiedad);
        if (! $pagos->simulado()) {
            return $this->haciaWompi($resultado);
        }

        $propiedad->refresh();

        return response()->json([
            'message' => ($renueva ? 'Posicionamiento renovado' : 'Propiedad posicionada') . ' hasta el '
                . Carbon::parse($propiedad->posicionada_hasta)->timezone(self::ZONA)->format('d/m/Y') . ' (pago simulado).',
            'posicionada_hasta' => $propiedad->posicionada_hasta,
            'checkout_url' => null,
        ], 201);
    }

    /** Plan activo del tipo pedido (si el administrador lo desactivó, ya no se puede comprar). */
    private function plan(Request $request, string $tipo): PlanPublicacion
    {
        $datos = $request->validate(['plan_id' => ['required', 'integer']], [
            'plan_id.required' => 'Elige un plan.',
        ]);
        $plan = PlanPublicacion::where('tipo', $tipo)->where('activo', true)->find($datos['plan_id']);
        if (! $plan) {
            throw ValidationException::withMessages(['plan_id' => 'Ese plan ya no está disponible.']);
        }

        return $plan;
    }

    private function haciaWompi(array $resultado): JsonResponse
    {
        return response()->json([
            'message' => 'Te llevamos a ' . app(\App\Services\Pagos\PagoService::class)->nombrePasarela() . ' para hacer el pago.',
            'checkout_url' => $resultado['url'],
            'referencia' => $resultado['pago']->referencia,
        ]);
    }
}
