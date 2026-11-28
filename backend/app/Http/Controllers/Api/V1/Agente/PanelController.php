<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Concerns\ManejaVisitas;
use App\Http\Controllers\Api\V1\Concerns\FiltrosListado;
use App\Http\Controllers\Api\V1\Concerns\Paginacion;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Visita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PanelController extends Controller
{
    use ManejaVisitas;
    use Paginacion;
    use FiltrosListado;

    private function misPropiedades(Request $request)
    {
        return Propiedad::where('agente_id', $request->user()->id)
            ->where('user_id', $request->user()->inmobiliaria_id);
    }

    public function resumen(Request $request): JsonResponse
    {
        $yo = $request->user();
        $ahora = now();

        $visitasProximas = Visita::with(['propiedad:id,tipo,barrio,ciudad,direccion', 'agente:id,name'])
            ->where('agente_id', $yo->id)
            ->where('fecha', '>=', $ahora)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->orderBy('fecha');

        $leads = Lead::where('agente_id', $yo->id);

        return response()->json([
            'kpis' => [
                'propiedades' => (clone $this->misPropiedades($request))->count(),
                'publicadas' => (clone $this->misPropiedades($request))->where('estado', 'publicada')->count(),
                'contactos' => (clone $leads)->count(),
                'contactos_nuevos' => (clone $leads)->where('estado', 'nuevo')->count(),
                'visitas_proximas' => (clone $visitasProximas)->count(),
                'comision_pendiente' => (int) \App\Models\Comision::where('agente_id', $yo->id)
                    ->where('inmobiliaria_id', $yo->inmobiliaria_id)->where('estado', 'pendiente')->sum('valor'),
                'visitas_hoy' => (clone $visitasProximas)
                    ->where('fecha', '<', $ahora->copy()->setTimezone(self::$zonaColombia)->endOfDay()->utc())->count(),
            ],
            'proximas_visitas' => $visitasProximas->limit(5)->get()->map(fn (Visita $v) => $this->formatoVisita($v))->all(),
            'contactos_nuevos' => Lead::with('propiedad:id,tipo,barrio,ciudad')
                ->where('agente_id', $yo->id)->where('estado', 'nuevo')->latest()->limit(5)->get()
                ->map(fn (Lead $l) => [
                    'id' => $l->id, 'nombre' => $l->nombre, 'contacto' => $l->contacto, 'mensaje' => $l->mensaje,
                    'fecha' => $l->created_at?->toIso8601String(), 'propiedad' => $this->tituloInmueble($l->propiedad),
                ])->all(),
        ]);
    }

    public function propiedades(Request $request): JsonResponse
    {
        $formato = fn (Propiedad $p) => [
                'id' => $p->id,
                'tipo' => $p->tipo,
                'operacion' => $p->operacion,
                'precio' => (int) $p->precio,
                'departamento' => $p->departamento,
                'ciudad' => $p->ciudad,
                'barrio' => $p->barrio,
                'direccion' => $p->direccion,
                'lat' => $p->lat,
                'lng' => $p->lng,
                'habitaciones' => $p->habitaciones,
                'banos' => $p->banos,
                'area' => $p->area,
                'estrato' => $p->estrato,
                'estado' => $p->estado,
                'verificada' => (bool) $p->verificada,
                'imagen' => $p->imagen ? (str_starts_with($p->imagen, '/') || str_starts_with($p->imagen, 'http') ? $p->imagen : '/storage/' . $p->imagen) : null,
                'contactos' => (int) $p->leads_count,
                'visitas' => (int) $p->visitas_count,
            ];

        $consulta = $this->misPropiedades($request)->withCount(['leads', 'visitas']);
        if (in_array($request->query('operacion'), ['venta', 'arriendo'], true)) {
            $consulta->where('operacion', $request->query('operacion'));
        }
        if (in_array($request->query('estado'), ['publicada', 'borrador', 'pausada', 'vendida', 'arrendada'], true)) {
            $consulta->where('estado', $request->query('estado'));
        }
        $this->filtrarTexto($consulta, $request, ['barrio', 'ciudad', 'direccion']);

        return response()->json($this->listado($consulta->latest()->latest('id'), $request, $formato));
    }
}
