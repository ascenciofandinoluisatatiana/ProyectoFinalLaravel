<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Contactos (leads) que dejan los invitados en las propiedades de la inmobiliaria
 * (RF-082, RF-083): clasificarlos por estado y asignarlos a un agente.
 */
class ContactoController extends BaseInmobiliariaController
{
    /** GET /contactos?estado=&agente_id= */
    public function index(Request $request): JsonResponse
    {
        $consulta = Lead::with(['propiedad:id,tipo,barrio,ciudad,operacion,agente_id', 'agente:id,name'])
            ->withCount('visitas')
            ->whereIn('propiedad_id', $this->idsPropiedades($request));

        if (in_array($request->query('estado'), Lead::ESTADOS, true)) {
            $consulta->where('estado', $request->query('estado'));
        }
        if ($request->query('agente_id') === 'sin') {
            $consulta->whereNull('agente_id');
        } elseif ($request->filled('agente_id')) {
            $consulta->where('agente_id', (int) $request->query('agente_id'));
        }

        $lista = $consulta->latest()->get()->map(fn (Lead $l) => $this->formato($l));

        // Totales por estado para las pestañas del filtro
        $totales = Lead::whereIn('propiedad_id', $this->idsPropiedades($request))
            ->selectRaw('estado, COUNT(*) as total')->groupBy('estado')->pluck('total', 'estado');

        return response()->json(['data' => $lista->all(), 'totales' => $totales]);
    }

    /** PATCH /contactos/{id}  { estado?, agente_id? } */
    public function update(Request $request, $id): JsonResponse
    {
        $lead = $this->leadPropio($request, $id);
        $datos = $request->validate([
            'estado' => ['sometimes', Rule::in(Lead::ESTADOS)],
            'agente_id' => ['sometimes', 'nullable', 'integer', $this->reglaAgente($request)],
        ]);

        $lead->update($datos);

        return response()->json([
            'message' => 'Contacto actualizado.',
            'data' => $this->formato($lead->fresh()->load(['propiedad:id,tipo,barrio,ciudad,operacion,agente_id', 'agente:id,name'])->loadCount('visitas')),
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
            'propiedad' => [
                'id' => $l->propiedad_id,
                'titulo' => $this->tituloPropiedad($l->propiedad),
                'operacion' => $l->propiedad?->operacion,
                'agente_id' => $l->propiedad?->agente_id,
            ],
            'agente' => $l->agente ? ['id' => $l->agente->id, 'nombre' => $l->agente->name] : null,
            'visitas' => (int) ($l->visitas_count ?? 0),
        ];
    }
}
