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
     *
     * Estados posibles de una cuenta:
     *   - pendiente  → creada pero no aprobada por el administrador todavía
     *   - activo     → aprobada: puede entrar
     *   - inactivo   → rechazada o desactivada: no puede entrar
     */
    public function login(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $usuario = User::with('role')->where('email', $datos['email'])->first();

        // Mismo mensaje si el correo no existe o la clave está mal (no revelar cuál falló)
        if (! $usuario || ! Hash::check($datos['password'], $usuario->password)) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        // Soporte (proceso del sistema) e invitado no inician sesión con formulario
        if ($usuario->tieneRol('soporte', 'invitado') || $usuario->role === null) {
            return response()->json(['message' => 'Esta cuenta no puede iniciar sesión aquí.'], 403);
        }

        // Cuenta pendiente: creada pero aún no aprobada por el administrador
        // Código 202 (Accepted): la petición fue válida pero el resultado aún está pendiente.
        // El frontend distingue este caso del 401 para mostrar la pantalla de espera.
        if ($usuario->estado === 'pendiente') {
            return response()->json([
                'message' => 'Tu cuenta está pendiente de aprobación por el administrador. Te avisaremos cuando esté lista.',
                'estado'  => 'pendiente',
            ], 202);
        }

        // Cuenta desactivada o rechazada
        if ($usuario->estado === 'inactivo') {
            return response()->json([
                'message' => 'Tu cuenta ha sido desactivada. Contacta al administrador si crees que es un error.',
                'estado'  => 'inactivo',
            ], 403);
        }

        return response()->json([
            'message' => 'Inicio de sesión correcto.',
            'usuario' => [
                'id'     => $usuario->id,
                'nombre' => $usuario->name,
                'email'  => $usuario->email,
                'rol'    => $usuario->role?->nombre,
            ],
        ]);
    }

    /**
     * GET /api/v1/estado-cuenta?email=...
     * La pantalla de espera consulta esto cada N segundos para saber
     * si el administrador ya aprobó o rechazó la cuenta.
     * Solo devuelve el estado, nunca datos sensibles.
     */
    public function estadoCuenta(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $usuario = User::where('email', $request->input('email'))
            ->select('id', 'estado')
            ->first();

        if (! $usuario) {
            // No revelamos si el correo existe o no
            return response()->json(['estado' => 'desconocido']);
        }

        return response()->json(['estado' => $usuario->estado]);
    }

    /**
     * POST /api/v1/registro
     * Crea una cuenta nueva para quien quiere publicar inmuebles:
     *   - tipo_cuenta = persona       → rol "vendedor"     (documento CC o CE)
     *   - tipo_cuenta = inmobiliaria  → rol "inmobiliaria" (documento NIT + representante legal)
     *
     * La cuenta se crea con estado "pendiente": el administrador debe aprobarla
     * antes de que el usuario pueda iniciar sesión en su panel (RF-009, RF-010, RF-011).
     *
     * Solo se acepta a quien declara residir en Colombia (RF-030 y RF-031).
     */
    public function register(Request $request): JsonResponse
    {
        // RF-030: solo Colombia puede registrarse para publicar.
        // La regla se aplica aquí, en el servidor, y no solo en la pantalla.
        if ($request->input('pais_residencia') !== 'CO') {
            Log::warning('Registro rechazado: país no permitido', [
                'pais'  => $request->input('pais_residencia'),
                'email' => $request->input('email'),
                'ip'    => $request->ip(),
            ]);

            return response()->json([
                'message' => 'La publicación de inmuebles solo está disponible en Colombia.',
            ], 403);
        }

        $esInmobiliaria = $request->input('tipo_cuenta') === 'inmobiliaria';

        $datos = $request->validate([
            'tipo_cuenta'       => ['required', 'in:persona,inmobiliaria'],
            'name'              => ['required', 'string', 'max:255'],
            'email'             => ['required', 'email', 'max:255', 'unique:users,email'],
            'telefono'          => ['required', 'string', 'max:20'],
            'tipo_documento'    => ['required', 'string', Rule::in($esInmobiliaria ? ['NIT'] : ['CC', 'CE'])],
            'numero_documento'  => ['required', 'string', 'max:30'],
            'representante_legal' => [Rule::requiredIf($esInmobiliaria), 'nullable', 'string', 'max:255'],
            'password'          => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // El mismo tipo y número de documento no puede registrarse dos veces
        $documentoOcupado = User::where('tipo_documento', $datos['tipo_documento'])
            ->where('numero_documento', $datos['numero_documento'])
            ->exists();

        if ($documentoOcupado) {
            return response()->json(['message' => 'Este documento ya está registrado.'], 422);
        }

        $usuario = User::create([
            'name'               => $datos['name'],
            'email'              => $datos['email'],
            'password'           => $datos['password'],
            'role_id'            => Role::where('nombre', $esInmobiliaria ? 'inmobiliaria' : 'vendedor')->value('id'),
            'telefono'           => $datos['telefono'],
            'tipo_documento'     => $datos['tipo_documento'],
            'numero_documento'   => $datos['numero_documento'],
            'representante_legal' => $esInmobiliaria ? $datos['representante_legal'] : null,
            'pais_residencia'    => 'CO',
            'estado'             => 'pendiente', // Espera aprobación del administrador
        ]);

        // Respondemos 201 con estado "pendiente" para que el frontend
        // muestre la pantalla de espera en vez de redirigir al panel.
        return response()->json([
            'message' => 'Cuenta creada. Debes esperar a que el administrador la apruebe antes de poder entrar.',
            'estado'  => 'pendiente',
            'usuario' => [
                'id'     => $usuario->id,
                'nombre' => $usuario->name,
                'email'  => $usuario->email,
                'rol'    => $usuario->role?->nombre,
            ],
        ], 201);
    }
}
