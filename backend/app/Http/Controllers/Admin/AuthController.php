<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

/**
 * Acceso al panel de administración.
 * Reutiliza la tabla users de UMBRAL, pero solo entra el rol "administrador".
 */
class AuthController extends Controller
{
    /** GET /admin/login */
    public function showLogin(): View|RedirectResponse
    {
        if (Auth::check() && Auth::user()->tieneRol('administrador')) {
            return redirect()->route('admin.panel');
        }

        return view('admin.login');
    }

    /** POST /admin/login */
    public function login(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Escribe tu correo.',
            'email.email' => 'El correo no tiene un formato válido.',
            'password.required' => 'Escribe tu contraseña.',
        ]);

        if (! Auth::attempt(['email' => $datos['email'], 'password' => $datos['password']], $request->boolean('recordar'))) {
            throw ValidationException::withMessages([
                'email' => 'Correo o contraseña incorrectos.',
            ]);
        }

        $request->session()->regenerate();

        // Una cuenta bloqueada o sin verificar no entra al panel
        if (in_array(Auth::user()->estado, ['inactivo', 'pendiente'], true)) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Tu cuenta está inactiva o pendiente de verificación.',
            ]);
        }

        if (! Auth::user()->tieneRol('administrador')) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Esta cuenta no tiene acceso al panel de administración.',
            ]);
        }

        return redirect()->intended(route('admin.panel'));
    }

    /** POST /admin/logout */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // De vuelta al portal público (landing), nunca al formulario del panel
        return redirect()->away(rtrim(config('portal.frontend_url'), '/') . '/');
    }
}
