<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/v1/login
     * Recibe correo y contraseña. Si son correctos, responde con los datos del usuario y su rol.
     */
    public function login(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $usuario = User::with('role')->where('email', $datos['email'])->first();

        // Mismo mensaje si el correo no existe o la clave está mal
        if (! $usuario || ! Hash::check($datos['password'], $usuario->password)) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        // Soporte (IA del sistema) e invitado no inician sesión con formulario
        if ($usuario->tieneRol('soporte', 'invitado') || $usuario->role === null) {
            return response()->json(['message' => 'Esta cuenta no puede iniciar sesión aquí.'], 403);
        }

        return response()->json([
            'message' => 'Inicio de sesión correcto.',
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->name,
                'email' => $usuario->email,
                'rol' => $usuario->role?->nombre,
            ],
        ]);
    }

    /**
     * POST /api/v1/registro
     * Crea una cuenta nueva con rol vendedor (quien publica sus inmuebles).
     * Responde con la misma forma que login para que el frontend
     * pueda dejar la sesión iniciada de una vez.
     */
    public function register(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telefono' => ['required', 'string', 'max:20'],
            'tipo_documento' => ['required', 'string', 'max:10', 'in:CC,CE,NIT,PAS'],
            'numero_documento' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // El mismo tipo y número de documento no puede registrarse dos veces
        $documentoOcupado = User::where('tipo_documento', $datos['tipo_documento'])
            ->where('numero_documento', $datos['numero_documento'])
            ->exists();

        if ($documentoOcupado) {
            return response()->json(['message' => 'Este documento ya está registrado.'], 422);
        }

        $usuario = User::create([
            'name' => $datos['name'],
            'email' => $datos['email'],
            'password' => $datos['password'], // el cast 'hashed' del modelo la cifra
            'role_id' => Role::where('nombre', 'vendedor')->value('id'),
            'telefono' => $datos['telefono'],
            'tipo_documento' => $datos['tipo_documento'],
            'numero_documento' => $datos['numero_documento'],
        ]);

        return response()->json([
            'message' => 'Cuenta creada correctamente.',
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->name,
                'email' => $usuario->email,
                'rol' => $usuario->role?->nombre,
            ],
        ], 201);
    }
}