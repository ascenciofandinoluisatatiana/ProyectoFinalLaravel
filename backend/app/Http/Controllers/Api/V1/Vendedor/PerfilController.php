<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Perfil del vendedor (persona).
 * El correo (es el usuario de inicio de sesión) y el documento (ya fue
 * verificado) NO se cambian aquí; solo nombre y teléfono.
 */
class PerfilController extends Controller
{
    /** GET /api/v1/vendedor/perfil */
    public function show(Request $request): JsonResponse
    {
        return response()->json(['usuario' => $this->formato($request->user())]);
    }

    /** PUT /api/v1/vendedor/perfil  { nombre, telefono } */
    public function update(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombre'   => ['required', 'string', 'max:120'],
            'telefono' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\s()\-]{7,20}$/'],
        ], [
            'nombre.required' => 'Escribe tu nombre.',
            'telefono.regex'  => 'Escribe un teléfono válido (solo números, +, espacios o guiones).',
        ]);

        $usuario = $request->user();
        $usuario->fill([
            'name'     => trim($datos['nombre']),
            'telefono' => $datos['telefono'] ?? null,
        ])->save();

        return response()->json([
            'message' => 'Perfil actualizado.',
            'usuario' => $this->formato($usuario),
        ]);
    }

    /** Misma forma que SesionController::datosUsuario, para que el frontend lo guarde igual. */
    private function formato($u): array
    {
        return [
            'id'       => $u->id,
            'nombre'   => $u->name,
            'email'    => $u->email,
            'rol'      => $u->role?->nombre,
            'telefono' => $u->telefono,
            'avatar'   => $u->avatar,
        ];
    }
}