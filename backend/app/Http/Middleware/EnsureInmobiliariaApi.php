<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege los endpoints /api/v1/inmobiliaria/...
 * Mismo esquema que EnsureAdminApi (sesión web de Laravel), pero para el rol inmobiliaria:
 *   401 → no hay sesión iniciada
 *   403 → la cuenta no es inmobiliaria o no está activa
 */
class EnsureInmobiliariaApi
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

        if (! $usuario->tieneRol('inmobiliaria')) {
            return response()->json(['message' => 'Esta cuenta no tiene acceso al panel de la inmobiliaria.'], 403);
        }

        return $next($request);
    }
}
