<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege los endpoints /api/v1/agente/...
 * Mismo esquema que el panel de la inmobiliaria (sesión web de Laravel):
 *   401 → no hay sesión iniciada
 *   403 → no es agente, está inactivo o no pertenece a una inmobiliaria activa
 */
class EnsureAgenteApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = Auth::user();

        if (! $usuario) {
            return response()->json(['message' => 'No has iniciado sesión.'], 401);
        }

        if ($motivo = self::motivoRechazo($usuario)) {
            return response()->json(['message' => $motivo], 403);
        }

        return $next($request);
    }

    /** null si el agente puede usar el panel; si no, el mensaje para mostrar. */
    public static function motivoRechazo($usuario): ?string
    {
        if (! $usuario->tieneRol('agente')) {
            return 'Esta cuenta no tiene acceso al panel del agente.';
        }
        if (in_array($usuario->estado, ['inactivo', 'pendiente'], true)) {
            return 'Tu cuenta de agente está inactiva. Habla con tu inmobiliaria.';
        }
        $inmobiliaria = $usuario->inmobiliaria;
        if (! $inmobiliaria || in_array($inmobiliaria->estado, ['inactivo', 'pendiente'], true)) {
            return 'Tu cuenta no está vinculada a una inmobiliaria activa.';
        }

        return null;
    }
}
