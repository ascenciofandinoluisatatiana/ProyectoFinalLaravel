<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Comision;
use App\Models\Propiedad;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Reporte de ventas y arriendos de la inmobiliaria (RF-081, RF-101, RF-102).
 * GET /ventas?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&agente_id=&operacion=&pagina=
 *   - Sin "pagina" devuelve todos los cierres del filtro (es lo que usa el PDF).
 *   - Las fechas del filtro son de Colombia y se comparan en UTC.
 */
class VentaController extends BaseInmobiliariaController
{
    private const ZONA = 'America/Bogota';

    public function index(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'operacion' => ['nullable', 'in:venta,arriendo'],
            'agente_id' => ['nullable'],
        ], [
            'hasta.after_or_equal' => 'La fecha final debe ser igual o posterior a la inicial.',
        ]);
        $inmobiliaria = $this->inmobiliaria($request);

        $filtrada = fn () => $this->filtro(Propiedad::query()->where('user_id', $inmobiliaria->id), $datos);

        // Comisión (no anulada) de cada cierre de la página
        $comisiones = [];
        $listado = $this->listado(
            $filtrada()->with('agente:id,name')->orderByDesc('cerrada_en')->orderByDesc('id'),
            $request,
            // closure con referencia: $comisiones se llena después, en "preparar"
            function (Propiedad $p) use (&$comisiones) { return $this->formato($p, $comisiones[$p->id] ?? null); },
            function ($pagina) use (&$comisiones) {
                $comisiones = Comision::whereIn('propiedad_id', $pagina->pluck('id'))
                    ->where('estado', '!=', 'anulada')->get()->keyBy('propiedad_id')->all();
            }
        );

        $ids = $filtrada()->pluck('id');
        $porOperacion = $filtrada()->selectRaw('operacion, COUNT(*) AS cantidad, COALESCE(SUM(precio), 0) AS total')
            ->groupBy('operacion')->get()->keyBy('operacion');

        return response()->json($listado + [
            'totales' => [
                'cierres' => $ids->count(),
                'ventas' => (int) ($porOperacion['venta']->cantidad ?? 0),
                'total_ventas' => (int) ($porOperacion['venta']->total ?? 0),
                'arriendos' => (int) ($porOperacion['arriendo']->cantidad ?? 0),
                'total_arriendos' => (int) ($porOperacion['arriendo']->total ?? 0),
                'comisiones' => (int) Comision::whereIn('propiedad_id', $ids)->where('estado', '!=', 'anulada')->sum('valor'),
            ],
            'empresa' => [
                'nombre' => $inmobiliaria->name,
                'nit' => $inmobiliaria->numero_documento,
                'telefono' => $inmobiliaria->telefono,
                'logo' => $inmobiliaria->avatar ? '/storage/' . $inmobiliaria->avatar : null,
            ],
            'agentes' => User::where('inmobiliaria_id', $inmobiliaria->id)
                ->whereHas('role', fn ($q) => $q->where('nombre', 'agente'))
                ->orderBy('name')->get(['id', 'name'])
                ->map(fn ($a) => ['id' => $a->id, 'nombre' => $a->name])->all(),
        ]);
    }

    /** Solo cierres (vendida / arrendada con fecha) y los filtros pedidos. */
    private function filtro(Builder $consulta, array $datos): Builder
    {
        $consulta->whereIn('estado', ['vendida', 'arrendada'])->whereNotNull('cerrada_en');

        if (! empty($datos['desde'])) {
            $consulta->where('cerrada_en', '>=', Carbon::parse($datos['desde'], self::ZONA)->startOfDay()->utc());
        }
        if (! empty($datos['hasta'])) {
            $consulta->where('cerrada_en', '<=', Carbon::parse($datos['hasta'], self::ZONA)->endOfDay()->utc());
        }
        if (! empty($datos['operacion'])) {
            $consulta->where('operacion', $datos['operacion']);
        }
        if (($datos['agente_id'] ?? null) === 'sin') {
            $consulta->whereNull('agente_id');
        } elseif (! empty($datos['agente_id'])) {
            $consulta->where('agente_id', (int) $datos['agente_id']);
        }

        return $consulta;
    }

    private function formato(Propiedad $p, ?Comision $comision): array
    {
        return [
            'id' => $p->id,
            'inmueble' => $this->tituloPropiedad($p),
            'direccion' => $p->direccion,
            'operacion' => $p->operacion,
            'precio' => (int) $p->precio,
            'cerrada_en' => $p->cerrada_en ? Carbon::parse($p->cerrada_en)->toIso8601String() : null,
            'agente' => $p->agente ? ['id' => $p->agente->id, 'nombre' => $p->agente->name] : null,
            'comision' => $comision ? ['valor' => $comision->valor, 'estado' => $comision->estado] : null,
            'origen' => $comision?->origen === 'portal' ? 'portal' : 'panel',
        ];
    }
}
