<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Datos de la cuenta del administrador que inició sesión y listas
 * que necesitan los formularios del panel. Todo en JSON.
 */
class CuentaController extends Controller
{
    /** GET /api/v1/admin/yo — quién es el administrador con sesión iniciada. */
    public function yo(Request $request): JsonResponse
    {
        $usuario = $request->user()->load('role');

        return response()->json([
            'usuario' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
                'rol' => $usuario->role?->nombre,
                'estado' => $usuario->estado,
                'avatar' => $usuario->avatar,
                'telefono' => $usuario->telefono,
                'tipo_documento' => $usuario->tipo_documento,
                'numero_documento' => $usuario->numero_documento,
                'creado' => optional($usuario->created_at)->toIso8601String(),
            ],
        ]);
    }

    /** GET /api/v1/admin/catalogos — roles y estados para los filtros y formularios. */
    public function catalogos(): JsonResponse
    {
        return response()->json([
            'roles' => Role::whereIn('nombre', User::ROLES_PANEL)->orderBy('nombre')->get(['id', 'nombre']),
            'estados' => User::ESTADOS,
        ]);
    }

    /** POST /api/v1/admin/clave — cambia la contraseña del administrador. */
    public function cambiarClave(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'clave_actual' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'clave_actual.required' => 'Escribe tu contraseña actual.',
            'password.required' => 'Escribe la contraseña nueva.',
            'password.min' => 'La contraseña nueva debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación no coincide con la contraseña nueva.',
        ]);

        $usuario = $request->user();

        if (! Hash::check($datos['clave_actual'], $usuario->password)) {
            return response()->json([
                'message' => 'La contraseña actual no es correcta.',
                'errors' => ['clave_actual' => ['La contraseña actual no es correcta.']],
            ], 422);
        }

        // El cast 'hashed' del modelo la cifra al asignarla
        $usuario->password = $datos['password'];
        $usuario->save();

        return response()->json(['mensaje' => 'Contraseña actualizada correctamente.']);
    }
}
