<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    private const MAX_INTENTOS = 5;        // intentos fallidos antes de bloquear
    private const MINUTOS_BLOQUEO = 15;    // minutos que dura el bloqueo

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

                // Cuenta bloqueada temporalmente por demasiados intentos fallidos
        if ($usuario && $usuario->bloqueado_hasta && now()->lt($usuario->bloqueado_hasta)) {
            $minutos = (int) ceil(now()->diffInSeconds($usuario->bloqueado_hasta, true) / 60);

            return response()->json([
                'message' => "Tu cuenta está bloqueada temporalmente por varios intentos fallidos. Intenta de nuevo en {$minutos} minuto(s).",
                'bloqueado_minutos' => $minutos,
            ], 423);
        }

        // Correo que no existe, o contraseña mal
        if (! $usuario || ! Hash::check($datos['password'], $usuario->password)) {
            // Correo que no existe: se le avisa y el intento queda anotado (no hay cuenta que bloquear)
            if (! $usuario) {
                $this->registrarEvento($request, null, 'login_fallido', 'Correo no registrado: ' . mb_substr($datos['email'], 0, 120));

                return response()->json([
                    'message' => 'Este correo no está registrado.',
                    'codigo'  => 'correo_no_registrado',
                ], 401);
            }

            if ($usuario) {
                $intentos = $usuario->intentos_fallidos + 1;
                $bloquear = $intentos >= self::MAX_INTENTOS;

                DB::table('users')->where('id', $usuario->id)->update([
                    'intentos_fallidos' => $bloquear ? 0 : $intentos,
                    'bloqueado_hasta'   => $bloquear ? now()->addMinutes(self::MINUTOS_BLOQUEO) : null,
                ]);

                $this->registrarEvento(
                    $request,
                    $usuario->id,
                    $bloquear ? 'cuenta_bloqueada' : 'login_fallido',
                    $bloquear ? 'Bloqueada ' . self::MINUTOS_BLOQUEO . ' minutos tras ' . self::MAX_INTENTOS . ' intentos fallidos'
                              : "Contraseña incorrecta (intento {$intentos} de " . self::MAX_INTENTOS . ')'
                );

                return $this->respuestaFallo($intentos, $bloquear);
            }

            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        // Clave correcta: se borra la cuenta de intentos fallidos
        if ($usuario->intentos_fallidos > 0 || $usuario->bloqueado_hasta) {
            DB::table('users')->where('id', $usuario->id)->update([
                'intentos_fallidos' => 0,
                'bloqueado_hasta'   => null,
            ]);
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

        // Entró bien: queda anotado en el historial (Movimientos del administrador)
        // (el administrador se anota aparte, cuando termina de poner el código de verificación)
        if (! $usuario->tieneRol('administrador')) {
            $this->registrarEvento($request, $usuario->id, 'inicio_sesion', 'Panel de ' . ($usuario->role?->nombre ?? 'usuario'));
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

    /** Respuesta de un intento fallido: 401 con el número de intento, o 423 si ya se bloqueó. */
    private function respuestaFallo(int $intentos, bool $bloqueada): JsonResponse
    {
        if ($bloqueada) {
            return response()->json([
                'message' => 'Cuenta bloqueada durante ' . self::MINUTOS_BLOQUEO . ' minutos por varios intentos fallidos.',
                'bloqueado_minutos' => self::MINUTOS_BLOQUEO,
            ], 423);
        }

        return response()->json([
            'message' => 'Correo o contraseña incorrectos.',
            'intento' => $intentos,
            'max_intentos' => self::MAX_INTENTOS,
        ], 401);
    }

    /** Anota un evento de seguridad (intento fallido, bloqueo, inicio de sesión). Nunca debe romper el login. */
    private function registrarEvento(Request $request, ?int $userId, string $tipo, ?string $detalle = null): void
    {
        try {
            DB::table('eventos_seguridad')->insert([
                'user_id'     => $userId,
                'tipo'        => $tipo,
                'ip'          => $request->ip(),
                'dispositivo' => mb_substr((string) $request->userAgent(), 0, 150),   // la columna acepta 150
                'detalle'     => $detalle !== null ? mb_substr($detalle, 0, 255) : null,
                'fecha'       => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo guardar el evento de seguridad: ' . $e->getMessage(), ['tipo' => $tipo]);
        }
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
            'idioma_preferido'  => ['nullable', 'string', 'size:2', 'exists:idiomas,codigo'],
            'acepta_terminos'   => ['nullable', 'boolean'],
            'acepta_datos'      => ['nullable', 'boolean'],
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

        
        // Idioma preferido (opcional): se guarda solo si el formulario lo envía
        if (! empty($datos['idioma_preferido'])) {
            DB::table('users')->where('id', $usuario->id)->update([
                'idioma_preferido' => $datos['idioma_preferido'],
            ]);
        }

        // Aceptaciones legales (opcionales): una fila por cada casilla marcada.
        // La versión "1.0" es provisional hasta que el equipo defina los textos oficiales.
        $aceptaciones = [
            'terminos'         => $datos['acepta_terminos'] ?? false,
            'datos_personales' => $datos['acepta_datos'] ?? false,
        ];

        foreach ($aceptaciones as $tipo => $acepto) {
            if ($acepto) {
                DB::table('aceptaciones_legales')->insert([
                    'user_id' => $usuario->id,
                    'tipo'    => $tipo,
                    'version' => '1.0',
                    'fecha'   => now(),
                    'ip'      => $request->ip(),
                ]);
            }
        }

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
