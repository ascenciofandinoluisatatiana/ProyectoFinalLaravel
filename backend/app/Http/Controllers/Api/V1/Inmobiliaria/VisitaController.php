<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Http\Controllers\Api\V1\Concerns\ManejaVisitas;
use App\Models\Visita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Visitas a las propiedades (RF-085): programar, confirmar, reprogramar,
 * cancelar y marcar como realizada.
 * La fecha llega en hora de Colombia ("2026-10-20T10:00") y se guarda en UTC.
 */
class VisitaController extends BaseInmobiliariaController
{
    use ManejaVisitas;

    /** GET /visitas?periodo=proximas|pasadas|todas&estado= */
    public function index(Request $request): JsonResponse
    {
        $consulta = Visita::with(['propiedad:id,tipo,barrio,ciudad,direccion', 'agente:id,name'])
            ->whereIn('propiedad_id', $this->idsPropiedades($request));

        $periodo = $request->query('periodo', 'proximas');
        if ($periodo === 'proximas') {
            $consulta->where('fecha', '>=', now()->startOfDay())->orderBy('fecha');
        } elseif ($periodo === 'pasadas') {
            $consulta->where('fecha', '<', now()->startOfDay())->orderByDesc('fecha');
        } else {
            $consulta->orderByDesc('fecha');
        }
        if (in_array($request->query('estado'), Visita::ESTADOS, true)) {
            $consulta->where('estado', $request->query('estado'));
        }

        return response()->json(['data' => $consulta->get()->map(fn (Visita $v) => $this->formatoVisita($v))->all()]);
    }

    /** POST /visitas */
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'propiedad_id' => ['required', 'integer'],
            'lead_id' => ['nullable', 'integer'],
            'agente_id' => ['nullable', 'integer', $this->reglaAgente($request)],
            'nombre' => ['required_without:lead_id', 'nullable', 'string', 'max:120'],
            'contacto' => ['required_without:lead_id', 'nullable', 'string', 'max:120'],
            'fecha' => ['required', 'date', $this->reglaFutura()],
            'nota' => ['nullable', 'string', 'max:500'],
        ], [
            'nombre.required_without' => 'Escribe el nombre de quien visita.',
            'contacto.required_without' => 'Escribe el teléfono o correo de quien visita.',
        ]);

        $propiedad = $this->propiedadPropia($request, $datos['propiedad_id']);

        // Si la visita nace de un contacto, se toman sus datos y pasa a "en seguimiento"
        $lead = null;
        if (! empty($datos['lead_id'])) {
            $lead = $this->leadPropio($request, $datos['lead_id']);
            if ($lead->estado === 'nuevo') {
                $lead->update(['estado' => 'en_seguimiento']);
            }
        }

        $visita = Visita::create([
            'propiedad_id' => $propiedad->id,
            'lead_id' => $lead?->id,
            'agente_id' => array_key_exists('agente_id', $datos) && $datos['agente_id'] !== null
                ? $datos['agente_id']
                : ($lead?->agente_id ?? $propiedad->agente_id),
            'nombre' => $datos['nombre'] ?? $lead->nombre,
            'contacto' => $datos['contacto'] ?? $lead->contacto,
            'fecha' => $this->aUtc($datos['fecha']),
            'estado' => 'pendiente',
            'nota' => $datos['nota'] ?? null,
        ]);

        return response()->json(['message' => 'Visita programada.', 'data' => $this->formatoVisita($visita->load(['propiedad', 'agente']))], 201);
    }

    /** PATCH /visitas/{id}  { estado?, fecha?, agente_id?, nota? } */
    public function update(Request $request, $id): JsonResponse
    {
        $visita = $this->visitaPropia($request, $id);
        $datos = $request->validate([
            'estado' => ['sometimes', Rule::in(Visita::ESTADOS)],
            'fecha' => ['sometimes', 'date', $this->reglaFutura()],
            'agente_id' => ['sometimes', 'nullable', 'integer', $this->reglaAgente($request)],
            'nota' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        if (isset($datos['fecha'])) {
            $datos['fecha'] = $this->aUtc($datos['fecha']);
            // Reprogramar deja la visita pendiente de confirmar otra vez
            $datos['estado'] = $datos['estado'] ?? 'pendiente';
        }

        $visita->update($datos);

        return response()->json(['message' => 'Visita actualizada.', 'data' => $this->formatoVisita($visita->fresh()->load(['propiedad', 'agente']))]);
    }
}
