<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Comision;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Comisiones de los agentes de la inmobiliaria (RF-081, RF-091).
 * Se generan solas al marcar un inmueble como vendido o arrendado (4 % del precio).
 * La inmobiliaria las ve por agente y las marca como pagadas.
 */
class ComisionController extends BaseInmobiliariaController
{
    /** GET /comisiones?estado=&agente_id= */
    public function index(Request $request): JsonResponse
    {
        $inmobiliaria = $this->inmobiliaria($request);
        $consulta = Comision::with('agente:id,name')->where('inmobiliaria_id', $inmobiliaria->id);

        if (in_array($request->query('estado'), Comision::ESTADOS, true)) {
            $consulta->where('estado', $request->query('estado'));
        }
        if ($request->filled('agente_id')) {
            $consulta->where('agente_id', (int) $request->query('agente_id'));
        }

        $todas = Comision::where('inmobiliaria_id', $inmobiliaria->id)->where('estado', '!=', 'anulada');

        return response()->json([
            'data' => $consulta->latest('cerrada_en')->latest('id')->get()->map(fn (Comision $c) => self::formato($c))->all(),
            'porcentaje' => Comision::PORCENTAJE,
            'totales' => [
                'pendiente' => (int) (clone $todas)->where('estado', 'pendiente')->sum('valor'),
                'pagada' => (int) (clone $todas)->where('estado', 'pagada')->sum('valor'),
                'cierres' => (clone $todas)->count(),
            ],
        ]);
    }

    /** PATCH /comisiones/{id}  { estado: pagada | pendiente } */
    public function update(Request $request, $id): JsonResponse
    {
        $comision = Comision::where('inmobiliaria_id', $this->inmobiliaria($request)->id)
            ->where('estado', '!=', 'anulada')
            ->findOrFail($id);
        $datos = $request->validate(['estado' => ['required', Rule::in(['pagada', 'pendiente'])]]);

        $comision->update([
            'estado' => $datos['estado'],
            'pagada_en' => $datos['estado'] === 'pagada' ? now() : null,
        ]);

        return response()->json([
            'message' => $datos['estado'] === 'pagada' ? 'Comisión marcada como pagada.' : 'Comisión marcada como pendiente.',
            'data' => self::formato($comision->load('agente:id,name')),
        ]);
    }

    public static function formato(Comision $c): array
    {
        return [
            'id' => $c->id,
            'inmueble' => $c->inmueble,
            'propiedad_id' => $c->propiedad_id,
            'operacion' => $c->operacion,
            'base' => $c->base,
            'porcentaje' => $c->porcentaje,
            'valor' => $c->valor,
            'estado' => $c->estado,
            'origen' => $c->origen,
            'cerrada_en' => $c->cerrada_en?->toIso8601String(),
            'pagada_en' => $c->pagada_en?->toIso8601String(),
            'agente' => $c->agente ? ['id' => $c->agente->id, 'nombre' => $c->agente->name] : null,
        ];
    }

    /** Totales por agente para la tabla de Agentes: [agente_id => [...]] */
    public static function resumenPorAgente(User $inmobiliaria): array
    {
        return Comision::where('inmobiliaria_id', $inmobiliaria->id)
            ->where('estado', '!=', 'anulada')
            ->get(['agente_id', 'estado', 'valor'])
            ->groupBy('agente_id')
            ->map(fn ($g) => [
                'cierres' => $g->count(),
                'comision_pendiente' => (int) $g->where('estado', 'pendiente')->sum('valor'),
                'comision_pagada' => (int) $g->where('estado', 'pagada')->sum('valor'),
            ])
            ->all();
    }
}
