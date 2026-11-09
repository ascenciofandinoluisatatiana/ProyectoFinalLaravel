<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Concerns\Paginacion;
use App\Http\Controllers\Controller;
use App\Models\Comision;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Ventas y arriendos que cerró el agente, con su comisión (para la tabla y el PDF).
 * GET /api/v1/agente/ventas?desde=&hasta=&operacion=&pagina=
 * Salen de sus comisiones: cada cierre con agente asignado genera una.
 */
class VentaController extends Controller
{
    use Paginacion;

    private const ZONA = 'America/Bogota';

    public function index(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'operacion' => ['nullable', 'in:venta,arriendo'],
        ], [
            'hasta.after_or_equal' => 'La fecha final debe ser igual o posterior a la inicial.',
        ]);
        $yo = $request->user();

        $filtrada = function () use ($yo, $datos) {
            $q = Comision::where('agente_id', $yo->id)
                ->where('inmobiliaria_id', $yo->inmobiliaria_id)
                ->where('estado', '!=', 'anulada');
            if (! empty($datos['desde'])) {
                $q->where('cerrada_en', '>=', Carbon::parse($datos['desde'], self::ZONA)->startOfDay()->utc());
            }
            if (! empty($datos['hasta'])) {
                $q->where('cerrada_en', '<=', Carbon::parse($datos['hasta'], self::ZONA)->endOfDay()->utc());
            }
            if (! empty($datos['operacion'])) {
                $q->where('operacion', $datos['operacion']);
            }

            return $q;
        };

        $listado = $this->listado($filtrada()->orderByDesc('cerrada_en')->orderByDesc('id'), $request, fn (Comision $c) => [
            'id' => $c->id,
            'inmueble' => $c->inmueble,
            'operacion' => $c->operacion,
            'precio' => $c->base,
            'cerrada_en' => $c->cerrada_en?->toIso8601String(),
            'comision' => ['valor' => $c->valor, 'estado' => $c->estado],
            'origen' => $c->origen,
        ]);

        $porOperacion = $filtrada()->selectRaw('operacion, COUNT(*) AS cantidad, COALESCE(SUM(base), 0) AS total')
            ->groupBy('operacion')->get()->keyBy('operacion');
        $inmobiliaria = User::find($yo->inmobiliaria_id);

        return response()->json($listado + [
            'totales' => [
                'cierres' => (int) $porOperacion->sum('cantidad'),
                'ventas' => (int) ($porOperacion['venta']->cantidad ?? 0),
                'total_ventas' => (int) ($porOperacion['venta']->total ?? 0),
                'arriendos' => (int) ($porOperacion['arriendo']->cantidad ?? 0),
                'total_arriendos' => (int) ($porOperacion['arriendo']->total ?? 0),
                'comisiones' => (int) $filtrada()->sum('valor'),
                'comisiones_pagadas' => (int) $filtrada()->where('estado', 'pagada')->sum('valor'),
            ],
            'agente' => ['nombre' => $yo->name, 'email' => $yo->email],
            'empresa' => $inmobiliaria ? [
                'nombre' => $inmobiliaria->name,
                'nit' => $inmobiliaria->numero_documento,
                'telefono' => $inmobiliaria->telefono,
                'logo' => $inmobiliaria->avatar ? '/storage/' . $inmobiliaria->avatar : null,
            ] : null,
        ]);
    }
}
