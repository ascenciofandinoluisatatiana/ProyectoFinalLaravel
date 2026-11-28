<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Movimiento;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class MovimientoController extends BaseInmobiliariaController
{
    private const ZONA = 'America/Bogota';

    public function agentes(Request $request): JsonResponse
    {
        $yo = $this->inmobiliaria($request);
        $f = $this->filtros($request);

        $base = Movimiento::where('inmobiliaria_id', $yo->id)->where('rol', 'agente');

        if (! empty($f['agente_id'])) {
            $agente = $this->agentePropio($request, $f['agente_id']);
            $base->where('user_id', $agente->id);
        }

        $total = (clone $base)->count();
        $errores = (clone $base)->where('resultado', 'error')->count();

        return response()->json($this->responder($this->aplicar(clone $base, $f), $f) + [
            'resumen' => ['total' => $total, 'errores' => $errores],
        ]);
    }

    public function contacto(Request $request, $id): JsonResponse
    {
        $yo = $this->inmobiliaria($request);
        $lead = $this->leadPropio($request, $id);
        $f = $this->filtros($request);

        $base = Movimiento::where('inmobiliaria_id', $yo->id)->where('entidad', 'contacto')->where('entidad_id', $lead->id);

        return response()->json($this->responder($this->aplicar($base, $f), $f));
    }

    public function filtros(Request $request): array
    {
        return $request->validate([
            'agente_id' => ['nullable', 'integer'],
            'resultado' => ['nullable', Rule::in(['correcto', 'error'])],
            'entidad' => ['nullable', Rule::in(['propiedad', 'visita', 'contacto', 'venta', 'comision', 'agente', 'pago', 'membresia'])],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
            'q' => ['nullable', 'string', 'max:100'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
    }

    public function aplicar(Builder $consulta, array $f): Builder
    {
        if (! empty($f['resultado'])) {
            $consulta->where('resultado', $f['resultado']);
        }
        if (! empty($f['entidad'])) {
            $consulta->where('entidad', $f['entidad']);
        }
        if (! empty($f['desde'])) {
            $consulta->where('fecha', '>=', Carbon::parse($f['desde'], self::ZONA)->startOfDay()->utc());
        }
        if (! empty($f['hasta'])) {
            $consulta->where('fecha', '<=', Carbon::parse($f['hasta'], self::ZONA)->endOfDay()->utc());
        }
        if (! empty($f['q'])) {
            $texto = '%' . addcslashes((string) $f['q'], '%_\\') . '%';
            $consulta->where(fn ($w) => $w->where('titulo', 'ilike', $texto)->orWhere('detalle', 'ilike', $texto));
        }

        return $consulta;
    }

    public function responder(Builder $consulta, array $f): array
    {
        $porPagina = min(max((int) ($f['por_pagina'] ?? 15), 1), 100);
        $pagina = max((int) ($f['pagina'] ?? 1), 1);
        $r = $consulta->with('usuario:id,name')->orderByDesc('fecha')->orderByDesc('id')->paginate($porPagina, ['*'], 'pagina', $pagina);

        return [
            'data' => collect($r->items())->map(fn (Movimiento $m) => self::formato($m))->values()->all(),
            'meta' => [
                'pagina' => $r->currentPage(),
                'por_pagina' => $r->perPage(),
                'total' => $r->total(),
                'paginas' => max($r->lastPage(), 1),
            ],
        ];
    }

    public static function formato(Movimiento $m): array
    {
        return [
            'id' => $m->id,
            'fecha' => $m->fecha?->toIso8601String(),
            'quien' => $m->usuario ? ['id' => $m->usuario->id, 'nombre' => $m->usuario->name, 'rol' => $m->rol] : null,
            'titulo' => $m->titulo ?: $m->accion,
            'accion' => $m->accion,
            'entidad' => $m->entidad,
            'entidad_id' => $m->entidad_id,
            'valor' => $m->valor,
            'resultado' => $m->resultado,
            'codigo' => $m->codigo,
        ];
    }
}
