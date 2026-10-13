<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Concerns\ManejaVisitas;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Visita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Agenda del agente (RF-085): sus visitas, programar, confirmar, reprogramar y cancelar. */
class VisitaController extends Controller
{
    use ManejaVisitas;

    private function mias(Request $request)
    {
        return Visita::where('agente_id', $request->user()->id);
    }

    /** GET /api/v1/agente/visitas?periodo=proximas|pasadas|todas */
    public function index(Request $request): JsonResponse
    {
        $consulta = $this->mias($request)->with(['propiedad:id,tipo,barrio,ciudad,direccion', 'agente:id,name']);
        $periodo = $request->query('periodo', 'proximas');
        if ($periodo === 'proximas') {
            $consulta->where('fecha', '>=', now()->startOfDay())->orderBy('fecha');
        } elseif ($periodo === 'pasadas') {
            $consulta->where('fecha', '<', now()->startOfDay())->orderByDesc('fecha');
        } else {
            $consulta->orderByDesc('fecha');
        }

        return response()->json(['data' => $consulta->get()->map(fn (Visita $v) => $this->formatoVisita($v))->all()]);
    }

    /** POST /api/v1/agente/visitas  { lead_id } o { propiedad_id, nombre, contacto } + fecha, nota */
    public function store(Request $request): JsonResponse
    {
        $yo = $request->user();
        $datos = $request->validate([
            'lead_id' => ['nullable', 'integer'],
            'propiedad_id' => ['required_without:lead_id', 'nullable', 'integer'],
            'nombre' => ['required_without:lead_id', 'nullable', 'string', 'max:120'],
            'contacto' => ['required_without:lead_id', 'nullable', 'string', 'max:120'],
            'fecha' => ['required', 'date', $this->reglaFutura()],
            'nota' => ['nullable', 'string', 'max:500'],
        ], [
            'nombre.required_without' => 'Escribe el nombre de quien visita.',
            'contacto.required_without' => 'Escribe el teléfono o correo de quien visita.',
        ]);

        $lead = null;
        if (! empty($datos['lead_id'])) {
            $lead = Lead::where('agente_id', $yo->id)
                ->whereHas('propiedad', fn ($q) => $q->where('user_id', $yo->inmobiliaria_id))
                ->findOrFail($datos['lead_id']);
            $propiedadId = $lead->propiedad_id;
            if ($lead->estado === 'nuevo') {
                $lead->update(['estado' => 'en_seguimiento']);
            }
        } else {
            $propiedadId = Propiedad::where('agente_id', $yo->id)->where('user_id', $yo->inmobiliaria_id)
                ->findOrFail($datos['propiedad_id'])->id;
        }

        $visita = Visita::create([
            'propiedad_id' => $propiedadId,
            'lead_id' => $lead?->id,
            'agente_id' => $yo->id,
            'nombre' => $datos['nombre'] ?? $lead->nombre,
            'contacto' => $datos['contacto'] ?? $lead->contacto,
            'fecha' => $this->aUtc($datos['fecha']),
            'estado' => 'pendiente',
            'nota' => $datos['nota'] ?? null,
        ]);

        return response()->json(['message' => 'Visita programada.', 'data' => $this->formatoVisita($visita->load(['propiedad', 'agente']))], 201);
    }

    /** PATCH /api/v1/agente/visitas/{id}  { estado?, fecha?, nota? } */
    public function update(Request $request, $id): JsonResponse
    {
        $visita = $this->mias($request)->findOrFail($id);
        $datos = $request->validate([
            'estado' => ['sometimes', Rule::in(Visita::ESTADOS)],
            'fecha' => ['sometimes', 'date', $this->reglaFutura()],
            'nota' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        if (isset($datos['fecha'])) {
            $datos['fecha'] = $this->aUtc($datos['fecha']);
            $datos['estado'] = $datos['estado'] ?? 'pendiente';
        }
        $visita->update($datos);

        return response()->json(['message' => 'Visita actualizada.', 'data' => $this->formatoVisita($visita->fresh()->load(['propiedad', 'agente']))]);
    }
}
