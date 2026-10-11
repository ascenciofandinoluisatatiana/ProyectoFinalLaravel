<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Verificacion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;
use Illuminate\Support\Facades\Storage;

/**
 * "Mi perfil" y "Ajustes de cuenta" del propio administrador que inició sesión.
 */
class PerfilController extends Controller
{
    /** GET /admin/perfil */
    public function perfil(): View
    {
        $usuario = auth()->user()->load('role');

        $aprobadas = Verificacion::query()
            ->where('decidido_por', $usuario->id)
            ->where('decision', 'aprobada')
            ->count();

        $rechazadas = Verificacion::query()
            ->where('decidido_por', $usuario->id)
            ->where('decision', 'rechazada')
            ->count();

        $ultimasDecisiones = Verificacion::query()
            ->where('decidido_por', $usuario->id)
            ->latest('created_at')
            ->take(5)
            ->get();

        return view('admin.perfil', [
            'usuario' => $usuario,
            'aprobadas' => $aprobadas,
            'rechazadas' => $rechazadas,
            'totalDecisiones' => $aprobadas + $rechazadas,
            'ultimasDecisiones' => $ultimasDecisiones,
        ]);
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

        return redirect()->route('admin.ajustes')->with(
            'exito',
            'Contraseña actualizada correctamente.'
        );
    }

    /** POST /admin/perfil/avatar */
    public function actualizarAvatar(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'avatar' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
            ],
        ], [
            'avatar.required' => 'Selecciona una imagen.',
            'avatar.image' => 'El archivo debe ser una imagen.',
            'avatar.mimes' => 'La imagen debe ser JPG, JPEG, PNG o WEBP.',
            'avatar.max' => 'La imagen no puede superar 4 MB.',
        ]);

        $usuario = $request->user();

        if ($usuario->avatar) {
            Storage::disk('public')->delete($usuario->avatar);
        }

        $ruta = $datos['avatar']->store('avatars', 'public');

        $usuario->avatar = $ruta;
        $usuario->save();

        return redirect()
            ->route('admin.perfil')
            ->with('exito', 'Foto de perfil actualizada correctamente.');
    }
}