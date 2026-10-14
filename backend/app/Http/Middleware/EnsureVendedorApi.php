<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege los endpoints /api/v1/vendedor/...
 * Mismo esquema que EnsureInmobiliariaApi (sesión web de Laravel), pero para el rol vendedor:
 *   401 → no hay sesión iniciada
 *   403 → la cuenta no es de vendedor o no está activa
 */
class EnsureVendedorApi
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

        if (! $usuario->tieneRol('vendedor')) {
            return response()->json(['message' => 'Esta cuenta no tiene acceso al panel del vendedor.'], 403);
        }

        return $next($request);
    }
}
