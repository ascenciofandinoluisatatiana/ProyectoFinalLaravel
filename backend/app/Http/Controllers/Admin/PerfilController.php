<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

/**
 * "Mi perfil" y "Ajustes de cuenta" del propio administrador que inició sesión.
 */
class PerfilController extends Controller
{
    /** GET /admin/perfil */
    public function perfil(): View
    {
        return view('admin.perfil', ['usuario' => auth()->user()->load('role')]);
    }

    /** GET /admin/ajustes */
    public function ajustes(): View
    {
        return view('admin.ajustes');
    }

    /** POST /admin/ajustes/clave */
    public function actualizarClave(Request $request): RedirectResponse
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
            throw ValidationException::withMessages([
                'clave_actual' => 'La contraseña actual no es correcta.',
            ]);
        }

        // El cast 'hashed' del modelo la cifra al asignarla
        $usuario->password = $datos['password'];
        $usuario->save();

        return redirect()->route('admin.ajustes')->with('exito', 'Contraseña actualizada correctamente.');
    }
}
