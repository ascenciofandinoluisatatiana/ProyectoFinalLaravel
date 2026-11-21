<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Movimiento;
use App\Models\PlanPublicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Planes de publicación nuevos (el administrador solo cambia precio y activa/desactiva):
 *   GET /membresias/planes-publicacion        → los 6 planes (normal y posicionamiento × 7/15/30 días)
 *   PUT /membresias/planes-publicacion/{id}   → cambiar el precio y/o activarlo o desactivarlo
 */
class PlanPublicacionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['planes' => $this->lista()]);
    }

    public function actualizar(Request $request, int $id): JsonResponse
    {
        $datos = $request->validate([
            'precio' => ['required', 'numeric', 'min:1000', 'max:100000000'],
            'activo' => ['required', 'boolean'],
        ], [
            'precio.required' => 'Escribe el precio del plan.',
            'precio.numeric' => 'El precio debe ser un número.',
            'precio.min' => 'El precio mínimo es $1.000 COP.',
            'precio.max' => 'El precio es demasiado alto.',
            'activo.required' => 'Indica si el plan está activo.',
        ]);

        $plan = PlanPublicacion::findOrFail($id);
        $precioAntes = (int) $plan->precio;
        $activoAntes = (bool) $plan->activo;

        $plan->precio = (int) round((float) $datos['precio']);
        $plan->activo = (bool) $datos['activo'];
        $plan->save();

        $nombre = (PlanPublicacion::TIPOS[$plan->tipo] ?? $plan->tipo) . ' · ' . $plan->dias . ' días';
        if ($precioAntes !== (int) $plan->precio) {
            Movimiento::registrar($request->user(), 'precio_plan_publicacion',
                $nombre . ': precio de $' . $precioAntes . ' a $' . $plan->precio);
        }
        if ($activoAntes !== (bool) $plan->activo) {
            Movimiento::registrar($request->user(), 'estado_plan_publicacion',
                $nombre . ': ' . ($plan->activo ? 'activado' : 'desactivado'));
        }

        return response()->json([
            'mensaje' => 'Plan actualizado: ' . $nombre . '.',
            'planes' => $this->lista(),
        ]);
    }

    private function lista(): array
    {
        return PlanPublicacion::orderBy('tipo')->orderBy('dias')->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'tipo' => $p->tipo,
                'dias' => $p->dias,
                'precio' => (int) $p->precio,
                'activo' => (bool) $p->activo,
            ])->all();
    }
}
