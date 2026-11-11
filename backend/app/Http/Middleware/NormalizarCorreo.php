<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pasa a minúsculas y sin espacios el correo que llega en cualquier formulario o consulta
 * (campos «email» y «correo»). Así «Ana@Correo.com» y «ana@correo.com» son la misma cuenta
 * en el registro, el ingreso, la recuperación de clave y las validaciones de correo único.
 */
class NormalizarCorreo
{
    public function handle(Request $request, Closure $next): Response
    {
        // El aviso de Wompi viene firmado: no se le toca nada.
        if ($request->is('api/v1/pagos/wompi/*')) {
            return $next($request);
        }

        foreach (['email', 'correo'] as $campo) {
            $valor = $request->input($campo);

            if (is_string($valor)) {
                $request->merge([$campo => mb_strtolower(trim($valor))]);
            }
        }

        return $next($request);
    }
}
