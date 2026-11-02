<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Concerns\ManejaVisitas;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Visita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Panel del agente (RF-080, RF-083 a RF-085): solo ve lo que su inmobiliaria le asignó.
 *  - propiedades con agente_id = el agente (y de su inmobiliaria)
 *  - contactos y visitas asignados a él
 */
class PanelController extends Controller
{
    use ManejaVisitas;

    /** Propiedades asignadas al agente dentro de SU inmobiliaria. */
    private function misPropiedades(Request $request)
    {
        return Propiedad::where('agente_id', $request->user()->id)
            ->where('user_id', $request->user()->inmobiliaria_id);
    }

    /** GET /api/v1/agente/resumen */
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

    /** GET /api/v1/agente/propiedades — solo lectura */
    public function propiedades(Request $request): JsonResponse
    {
        $lista = $this->misPropiedades($request)->withCount(['leads', 'visitas'])->latest()->get()
            ->map(fn (Propiedad $p) => [
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
            ]);

        return response()->json(['data' => $lista->all()]);
    }
}
