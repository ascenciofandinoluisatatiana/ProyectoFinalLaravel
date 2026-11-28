<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Http\Controllers\Api\V1\Concerns\ManejaVisitas;
use App\Models\Visita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VisitaController extends BaseInmobiliariaController
{
    use ManejaVisitas;

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
        if ($request->query('agente_id') === 'sin') {
            $consulta->whereNull('agente_id');
        } elseif ($request->filled('agente_id')) {
            $consulta->where('agente_id', (int) $request->query('agente_id'));
        }
        $this->filtrarFechas($consulta, $request, 'fecha');
        $this->filtrarTexto($consulta, $request, ['nombre', 'contacto', 'nota', 'propiedad.barrio', 'propiedad.ciudad']);

        return response()->json($this->listado($consulta->orderBy('id'), $request, fn (Visita $v) => $this->formatoVisita($v)));
    }

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
            $datos['estado'] = $datos['estado'] ?? 'pendiente';
        }

        $visita->update($datos);

        return response()->json(['message' => 'Visita actualizada.', 'data' => $this->formatoVisita($visita->fresh()->load(['propiedad', 'agente']))]);
    }
}
