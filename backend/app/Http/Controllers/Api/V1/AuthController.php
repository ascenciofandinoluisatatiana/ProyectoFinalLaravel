<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

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
     * Crea una cuenta nueva para quien quiere publicar inmuebles:
     *   - tipo_cuenta = persona       → rol "vendedor"     (documento CC o CE)
     *   - tipo_cuenta = inmobiliaria  → rol "inmobiliaria" (documento NIT + representante legal)
     * Solo se acepta a quien declara residir en Colombia (RF-030 y RF-031).
     * Responde con la misma forma que login para que el frontend
     * pueda dejar la sesión iniciada de una vez.
     */
    public function register(Request $request): JsonResponse
    {
        // RF-030: solo Colombia puede registrarse para publicar.
        // La regla se aplica aquí, en el servidor, y no solo en la pantalla.
        if ($request->input('pais_residencia') !== 'CO') {
            Log::warning('Registro rechazado: país no permitido', [
                'pais' => $request->input('pais_residencia'),
                'email' => $request->input('email'),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'La publicación de inmuebles solo está disponible en Colombia.',
            ], 403);
        }

        $esInmobiliaria = $request->input('tipo_cuenta') === 'inmobiliaria';

        $datos = $request->validate([
            'tipo_cuenta' => ['required', 'in:persona,inmobiliaria'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telefono' => ['required', 'string', 'max:20'],
            // Persona: cédula de ciudadanía o de extranjería. Inmobiliaria: NIT.
            'tipo_documento' => ['required', 'string', Rule::in($esInmobiliaria ? ['NIT'] : ['CC', 'CE'])],
            'numero_documento' => ['required', 'string', 'max:30'],
            // Solo se pide a las inmobiliarias (RF-011)
            'representante_legal' => [Rule::requiredIf($esInmobiliaria), 'nullable', 'string', 'max:255'],
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
            'name' => $datos['name'], // en una inmobiliaria es la razón social
            'email' => $datos['email'],
            'password' => $datos['password'], // el cast 'hashed' del modelo la cifra
            'role_id' => Role::where('nombre', $esInmobiliaria ? 'inmobiliaria' : 'vendedor')->value('id'),
            'telefono' => $datos['telefono'],
            'tipo_documento' => $datos['tipo_documento'],
            'numero_documento' => $datos['numero_documento'],
            'representante_legal' => $esInmobiliaria ? $datos['representante_legal'] : null,
            'pais_residencia' => 'CO',
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
