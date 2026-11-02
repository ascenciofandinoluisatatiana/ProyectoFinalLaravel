<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Inmobiliaria\ComisionController as ComisionInmobiliaria;
use App\Http\Controllers\Controller;
use App\Models\Comision;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** El agente ve sus propias comisiones (solo lectura). */
class ComisionController extends Controller
{
    /** GET /api/v1/agente/comisiones */
    public function index(Request $request): JsonResponse
    {
        $mias = Comision::where('agente_id', $request->user()->id)
            ->where('inmobiliaria_id', $request->user()->inmobiliaria_id)
            ->where('estado', '!=', 'anulada');

        return response()->json([
            'data' => (clone $mias)->latest('cerrada_en')->latest('id')->get()
                ->map(fn (Comision $c) => ComisionInmobiliaria::formato($c))->all(),
            'porcentaje' => Comision::PORCENTAJE,
            'totales' => [
                'pendiente' => (int) (clone $mias)->where('estado', 'pendiente')->sum('valor'),
                'pagada' => (int) (clone $mias)->where('estado', 'pagada')->sum('valor'),
                'cierres' => (clone $mias)->count(),
            ],
        ]);
    }
}
