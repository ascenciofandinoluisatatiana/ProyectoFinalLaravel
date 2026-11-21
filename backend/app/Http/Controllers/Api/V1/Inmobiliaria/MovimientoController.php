<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Movimiento;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Movimientos que ve la inmobiliaria (solo los suyos y los de SUS agentes):
 *  - GET /agentes/movimientos          lo que hacen sus agentes (sección "Movimientos de agentes")
 *  - GET /contactos/{id}/movimientos   historial de un contacto: qué se le hizo y quién
 *
 * A diferencia del administrador, aquí NO se muestran la IP ni el dispositivo de las personas.
 */
class MovimientoController extends BaseInmobiliariaController
{
    private const ZONA = 'America/Bogota';

    /**
     * GET /agentes/movimientos
     *   ?agente_id= &resultado=correcto|error &entidad=propiedad|visita|contacto|venta|comision|agente
     *   &desde=2026-11-01 &hasta=2026-11-30 &q=texto &pagina=1 &por_pagina=15
     */
    public function agentes(Request $request): JsonResponse
    {
        $yo = $this->inmobiliaria($request);
        $f = $this->filtros($request);

        $base = Movimiento::where('inmobiliaria_id', $yo->id)->where('rol', 'agente');

        if (! empty($f['agente_id'])) {
            $agente = $this->agentePropio($request, $f['agente_id']);   // 404 si no es de esta inmobiliaria
            $base->where('user_id', $agente->id);
        }

        $total = (clone $base)->count();
        $errores = (clone $base)->where('resultado', 'error')->count();

        return response()->json($this->responder($this->aplicar(clone $base, $f), $f) + [
            'resumen' => ['total' => $total, 'errores' => $errores],
        ]);
    }

    /** GET /contactos/{id}/movimientos (mismos filtros de fecha, resultado, texto y página) */
    public function contacto(Request $request, $id): JsonResponse
    {
        $yo = $this->inmobiliaria($request);
        $lead = $this->leadPropio($request, $id);   // 404 si el contacto no es de esta inmobiliaria
        $f = $this->filtros($request);

        $base = Movimiento::where('inmobiliaria_id', $yo->id)->where('entidad', 'contacto')->where('entidad_id', $lead->id);

        return response()->json($this->responder($this->aplicar($base, $f), $f));
    }

    /* ----------------------------- Piezas comunes ----------------------------- */

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
        // Las fechas se guardan en UTC; el día que elige la persona es el de Colombia
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

    /** Lo que se muestra de cada movimiento (sin IP ni dispositivo). */
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
