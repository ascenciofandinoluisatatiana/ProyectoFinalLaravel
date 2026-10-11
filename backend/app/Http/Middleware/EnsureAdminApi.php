<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege los endpoints /api/v1/admin/...
 * Igual que EnsureAdmin, pero en vez de redirigir al formulario responde JSON:
 *   401 → no hay sesión iniciada
 *   403 → la cuenta no es administradora o no está activa
 *
 * Hoy la identidad sale de la sesión del login actual. Cuando se agreguen
 * tokens, este es el único lugar que cambia para decidir quién es el usuario.
 */
class EnsureAdminApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = Auth::user();

        if (! $usuario) {
            return response()->json(['message' => 'No has iniciado sesión.'], 401);
        }

        if (in_array($usuario->estado, ['inactivo', 'pendiente'], true)) {
            return response()->json(['message' => 'Tu cuenta está inactiva o pendiente de verificación.'], 403);
        }

        if (! $usuario->tieneRol('administrador')) {
            return response()->json(['message' => 'Esta cuenta no tiene acceso al panel de administración.'], 403);
        }

        return $next($request);
    }
}
