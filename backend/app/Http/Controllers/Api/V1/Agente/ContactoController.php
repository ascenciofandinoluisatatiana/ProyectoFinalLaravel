<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Concerns\ManejaVisitas;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Contactos asignados al agente (RF-083, RF-084): ver y cambiar su estado. */
class ContactoController extends Controller
{
    use ManejaVisitas;

    private function mios(Request $request)
    {
        $yo = $request->user();

        return Lead::where('agente_id', $yo->id)
            ->whereHas('propiedad', fn ($q) => $q->where('user_id', $yo->inmobiliaria_id));
    }

    /** GET /api/v1/agente/contactos?estado= */
    public function index(Request $request): JsonResponse
    {
        $consulta = $this->mios($request)->with('propiedad:id,tipo,barrio,ciudad,operacion')->withCount('visitas');
        if (in_array($request->query('estado'), Lead::ESTADOS, true)) {
            $consulta->where('estado', $request->query('estado'));
        }

        $totales = $this->mios($request)->selectRaw('estado, COUNT(*) as total')->groupBy('estado')->pluck('total', 'estado');

        return response()->json([
            'data' => $consulta->latest()->get()->map(fn (Lead $l) => $this->formato($l))->all(),
            'totales' => $totales,
        ]);
    }

    /** PATCH /api/v1/agente/contactos/{id}  { estado } */
    public function update(Request $request, $id): JsonResponse
    {
        $lead = $this->mios($request)->findOrFail($id);
        $datos = $request->validate(['estado' => ['required', Rule::in(Lead::ESTADOS)]]);
        $lead->update($datos);

        return response()->json([
            'message' => 'Contacto actualizado.',
            'data' => $this->formato($lead->fresh()->load('propiedad:id,tipo,barrio,ciudad,operacion')->loadCount('visitas')),
        ]);
    }

    private function formato(Lead $l): array
    {
        return [
            'id' => $l->id,
            'nombre' => $l->nombre,
            'contacto' => $l->contacto,
            'mensaje' => $l->mensaje,
            'estado' => $l->estado,
            'fecha' => $l->created_at?->toIso8601String(),
            'propiedad' => ['id' => $l->propiedad_id, 'titulo' => $this->tituloInmueble($l->propiedad)],
            'visitas' => (int) ($l->visitas_count ?? 0),
        ];
    }
}
