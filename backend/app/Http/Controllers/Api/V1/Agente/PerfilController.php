<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class PerfilController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Tus datos los actualiza tu inmobiliaria. Pídele el cambio desde su panel.',
        ], 403);
    }

    public function cambiarClave(Request $request): JsonResponse
    {
        $usuario = $request->user();
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
}
