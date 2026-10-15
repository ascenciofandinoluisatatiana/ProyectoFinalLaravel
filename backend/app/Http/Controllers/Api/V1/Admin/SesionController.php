<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Inicio y cierre de sesión del panel de administración.
 *
 * El panel vive en el frontend (HTML estático servido por nginx).
 * La sesión se maneja con la cookie de Laravel (mismo origen),
 * así el resto de endpoints de /api/v1/admin/ siguen funcionando
 * igual que antes sin cambiar nada más.
 */
class SesionController extends Controller
{
    /**
     * GET /api/v1/admin/csrf
     * Devuelve el token CSRF para que el login del frontend pueda
     * hacer el POST sin que Laravel lo rechace.
     */
    public function csrf(Request $request): JsonResponse
    {
        return response()->json(['token' => csrf_token()]);
    }

    /**
     * POST /api/v1/admin/sesion
     * Crea la sesión de Laravel para el administrador.
     * El frontend llama a este endpoint desde login.html.
     */
    public function entrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
            'recordar' => ['boolean'],
        ]);

        if (! Auth::attempt(
            ['email' => $datos['email'], 'password' => $datos['password']],
            $request->boolean('recordar')
        )) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        $usuario = Auth::user();

        // Solo administradores pueden entrar al panel
        if (! $usuario->tieneRol('administrador')) {
            Auth::guard('web')->logout();
            return response()->json(['message' => 'Esta cuenta no tiene acceso al panel de administración.'], 403);
        }

        // Cuenta inactiva o pendiente
        if (in_array($usuario->estado, ['inactivo', 'pendiente'], true)) {
            Auth::guard('web')->logout();
            return response()->json(['message' => 'Tu cuenta está inactiva o pendiente de verificación.'], 403);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Sesión iniciada.',
            'usuario' => [
                'id'     => $usuario->id,
                'nombre' => $usuario->name,
                'email'  => $usuario->email,
                'rol'    => $usuario->role?->nombre,
            ],
        ]);
    }
}
