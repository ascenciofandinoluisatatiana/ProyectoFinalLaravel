<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AgenteController extends BaseInmobiliariaController
{
    public function index(Request $request): JsonResponse
    {
        $ids = $this->idsPropiedades($request);
        $ahora = now();

        $comisiones = ComisionController::resumenPorAgente($this->inmobiliaria($request));

        $agentes = User::where('inmobiliaria_id', $this->inmobiliaria($request)->id)
            ->whereHas('role', fn ($q) => $q->where('nombre', 'agente'))
            ->orderBy('name')
            ->get()
            ->map(fn (User $a) => $this->formato($a) + [
                'propiedades' => Propiedad::whereIn('id', $ids)->where('agente_id', $a->id)->count(),
                'contactos' => Lead::whereIn('propiedad_id', $ids)->where('agente_id', $a->id)->count(),
                'visitas' => Visita::whereIn('propiedad_id', $ids)->where('agente_id', $a->id)
                    ->where('fecha', '>=', $ahora)->whereIn('estado', ['pendiente', 'confirmada'])->count(),
                'cierres' => $comisiones[$a->id]['cierres'] ?? 0,
                'comision_pendiente' => $comisiones[$a->id]['comision_pendiente'] ?? 0,
                'comision_pagada' => $comisiones[$a->id]['comision_pagada'] ?? 0,
            ]);

        return response()->json(['data' => $agentes->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'telefono' => ['required', 'string', 'max:20'],
            'tipo_documento' => ['required', Rule::in(['CC'])],
            'numero_documento' => [
                'required', 'string', 'max:30',
                Rule::unique('users')->where(fn ($q) => $q->where('tipo_documento', $request->input('tipo_documento'))),
            ],
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'email.unique' => 'Ya existe una cuenta con ese correo.',
            'numero_documento.unique' => 'Ya existe una cuenta con ese documento.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $agente = User::create([
            'name' => $datos['name'],
            'email' => $datos['email'],
            'password' => $datos['password'],
            'telefono' => $datos['telefono'],
            'tipo_documento' => $datos['tipo_documento'],
            'numero_documento' => $datos['numero_documento'],
            'role_id' => Role::where('nombre', 'agente')->value('id'),
            'inmobiliaria_id' => $this->inmobiliaria($request)->id,
            'pais_residencia' => 'CO',
            'estado' => 'activo',
        ]);

        return response()->json(['message' => 'Agente agregado al equipo.', 'data' => $this->formato($agente)], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $agente = $this->agentePropio($request, $id);
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'telefono' => ['required', 'string', 'max:20'],
        ]);

        $agente->update($datos);

        return response()->json(['message' => 'Datos del agente actualizados.', 'data' => $this->formato($agente)]);
    }

    public function clave(Request $request, $id): JsonResponse
    {
        $agente = $this->agentePropio($request, $id);
        $datos = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $agente->forceFill([
            'password' => $datos['password'],
            'remember_token' => Str::random(60),
            'intentos_fallidos' => 0,
            'bloqueado_hasta' => null,
        ])->save();

        return response()->json(['message' => 'Contraseña de ' . $agente->name . ' restablecida. Compártela con el agente.']);
    }

    public function estado(Request $request, $id): JsonResponse
    {
        $agente = $this->agentePropio($request, $id);
        $datos = $request->validate(['estado' => ['required', Rule::in(['activo', 'inactivo'])]]);

        $agente->update(['estado' => $datos['estado']]);

        $liberadas = 0;
        if ($datos['estado'] === 'inactivo') {
            $liberadas = Propiedad::whereIn('id', $this->idsPropiedades($request))
                ->where('agente_id', $agente->id)->update(['agente_id' => null]);
        }

        return response()->json([
            'message' => $datos['estado'] === 'activo'
                ? 'Agente activado.'
                : 'Agente desactivado' . ($liberadas ? '; ' . $liberadas . ' propiedad(es) quedaron sin agente.' : '.'),
            'data' => $this->formato($agente),
        ]);
    }

    private function formato(User $a): array
    {
        return [
            'id' => $a->id,
            'nombre' => $a->name,
            'email' => $a->email,
            'telefono' => $a->telefono,
            'tipo_documento' => $a->tipo_documento,
            'numero_documento' => $a->numero_documento,
            'estado' => $a->estado,
            'desde' => $a->created_at?->toDateString(),
        ];
    }
}
