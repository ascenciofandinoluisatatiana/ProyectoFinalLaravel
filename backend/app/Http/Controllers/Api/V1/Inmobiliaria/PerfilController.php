<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Perfil de la empresa (RF-011, RF-018).
 * El NIT y el correo no se cambian aquí: el NIT fue verificado por soporte
 * y el correo es el usuario de inicio de sesión.
 */
class PerfilController extends BaseInmobiliariaController
{
    /** GET /perfil */
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->formato($this->inmobiliaria($request))]);
    }

    /** POST /perfil  (multipart: name, representante_legal, telefono, logo?) */
    public function update(Request $request): JsonResponse
    {
        $usuario = $this->inmobiliaria($request);
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'representante_legal' => ['required', 'string', 'max:120'],
            'telefono' => ['required', 'string', 'max:20'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'name.required' => 'Escribe la razón social.',
            'representante_legal.required' => 'Escribe el nombre del representante legal.',
            'logo.max' => 'El logo no puede superar 4 MB.',
        ]);

        if ($request->hasFile('logo')) {
            if ($usuario->avatar) {
                Storage::disk('public')->delete($usuario->avatar);
            }
            $usuario->avatar = $request->file('logo')->store('avatars', 'public');
        }

        $usuario->fill([
            'name' => $datos['name'],
            'representante_legal' => $datos['representante_legal'],
            'telefono' => $datos['telefono'],
        ])->save();

        return response()->json(['message' => 'Datos de la empresa actualizados.', 'data' => $this->formato($usuario)]);
    }

    /** POST /perfil/clave  { actual, password, password_confirmation } */
    public function cambiarClave(Request $request): JsonResponse
    {
        $usuario = $this->inmobiliaria($request);
        $datos = $request->validate([
            'actual' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8), 'different:actual'],
        ], [
            'password.confirmed' => 'Las contraseñas nuevas no coinciden.',
            'password.different' => 'La nueva contraseña debe ser distinta a la actual.',
        ]);

        if (! Hash::check($datos['actual'], $usuario->password)) {
            throw ValidationException::withMessages(['actual' => 'La contraseña actual no es correcta.']);
        }

        $usuario->password = $datos['password'];
        $usuario->save();

        return response()->json(['message' => 'Contraseña actualizada.']);
    }

    private function formato($u): array
    {
        return [
            'nombre' => $u->name,
            'email' => $u->email,
            'nit' => $u->numero_documento,
            'representante_legal' => $u->representante_legal,
            'telefono' => $u->telefono,
            'estado' => $u->estado,
            'logo' => $u->avatar ? '/storage/' . $u->avatar : null,
            'desde' => $u->created_at?->toDateString(),
        ];
    }
}
