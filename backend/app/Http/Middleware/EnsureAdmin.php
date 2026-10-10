<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege el panel de administración: exige sesión iniciada
 * y que la cuenta tenga el rol "administrador".
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return redirect()->route('admin.login');
        }

        if (! Auth::user()->tieneRol('administrador')) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('admin.login')
                ->with('error', 'Esta cuenta no tiene acceso al panel de administración.');
        }

        return $next($request);
    }
}
