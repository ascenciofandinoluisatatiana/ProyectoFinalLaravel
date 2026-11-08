<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Inicio y cierre de sesión del panel de administración, con doble autenticación (2FA).
 *
 * Paso 1: POST /sesion          → valida correo y contraseña y envía un código de 6 dígitos al correo.
 * Paso 2: POST /sesion/codigo   → valida el código y recién entonces abre la sesión.
 *         POST /sesion/codigo/reenviar → manda un código nuevo.
 *
 * El código se guarda cifrado (hash) en la sesión y vence a los 5 minutos.
 * Con 5 códigos equivocados la cuenta se bloquea 15 minutos.
 * El código nuevo solo se puede pedir una vez por minuto.
 */
class SesionController extends Controller
{
    private const VIGENCIA_CODIGO_MINUTOS = 5;
    private const MAX_INTENTOS = 5;            // códigos o contraseñas equivocadas antes de bloquear
    private const MINUTOS_BLOQUEO = 15;        // lo que dura el bloqueo de la cuenta
    private const ESPERA_REENVIO_SEGUNDOS = 60; // mínimo entre un envío del código y el siguiente

    /**
     * GET /api/v1/admin/csrf
     * Devuelve el token CSRF para que el login del frontend pueda
     * hacer el POST sin que Laravel lo rechace.
     */
    public function csrf(Request $request): JsonResponse
    {
        return response()->json(['token' => csrf_token()]);
    }

    /**
     * POST /api/v1/admin/sesion
     * Paso 1 del 2FA: comprueba las credenciales y envía el código. Todavía NO abre la sesión.
     */
    public function entrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $proveedor = Auth::guard('web')->getProvider();
        $credenciales = ['email' => $datos['email'], 'password' => $datos['password']];
        $usuario = $proveedor->retrieveByCredentials($credenciales);

        // Cuenta bloqueada: ni con la contraseña correcta se puede entrar hasta que pase el tiempo
        if ($usuario && $this->estaBloqueada($usuario)) {
            return $this->respuestaBloqueada($usuario);
        }

        if (! $usuario || ! $proveedor->validateCredentials($usuario, $credenciales)) {
            if (! $usuario) {
                $this->registrarEvento(
                    $request,
                    null,
                    'login_fallido',
                    'Correo no registrado: ' . mb_substr($datos['email'], 0, 120)
                );

                return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
            }

            // Contraseña mal: se cuenta el intento y al quinto se bloquea la cuenta
            $intentos = (int) $usuario->intentos_fallidos + 1;
            $bloquear = $intentos >= self::MAX_INTENTOS;

            DB::table('users')->where('id', $usuario->id)->update([
                'intentos_fallidos' => $bloquear ? 0 : $intentos,
                'bloqueado_hasta'   => $bloquear ? now()->addMinutes(self::MINUTOS_BLOQUEO) : null,
            ]);

            $this->registrarEvento(
                $request,
                $usuario->id,
                $bloquear ? 'cuenta_bloqueada' : 'login_fallido',
                $bloquear
                    ? 'Bloqueada ' . self::MINUTOS_BLOQUEO . ' minutos tras ' . self::MAX_INTENTOS . ' contraseñas incorrectas en el panel de administración'
                    : "Contraseña incorrecta en el panel de administración (intento {$intentos} de " . self::MAX_INTENTOS . ')'
            );

            if ($bloquear) {
                return $this->respuestaBloqueada($usuario->fresh());
            }

            return response()->json([
                'message' => 'Correo o contraseña incorrectos.',
                'intento' => $intentos,
                'max_intentos' => self::MAX_INTENTOS,
            ], 401);
        }

        // Contraseña correcta: se borra la cuenta de intentos fallidos
        if ($usuario->intentos_fallidos > 0) {
            DB::table('users')->where('id', $usuario->id)->update(['intentos_fallidos' => 0]);
        }

        // Solo administradores pueden entrar al panel
        if (! $usuario->tieneRol('administrador')) {
            return response()->json(['message' => 'Esta cuenta no tiene acceso al panel de administración.'], 403);
        }

        // Cuenta inactiva o pendiente
        if (in_array($usuario->estado, ['inactivo', 'pendiente'], true)) {
            return response()->json(['message' => 'Tu cuenta está inactiva o pendiente de verificación.'], 403);
        }

        if (! $this->emitirCodigo($request, $usuario)) {
            return $this->respuestaCorreoFallido();
        }

        return response()->json([
            'requiere_codigo' => true,
            'espera_reenvio'  => self::ESPERA_REENVIO_SEGUNDOS,
            'message' => 'Te enviamos un código de 6 dígitos a ' . $this->ocultarCorreo($usuario->email)
                . '. Vence en ' . self::VIGENCIA_CODIGO_MINUTOS . ' minutos.',
        ]);
    }

    /**
     * POST /api/v1/admin/sesion/codigo { codigo }
     * Paso 2 del 2FA: si el código es correcto, abre la sesión.
     */
    public function verificarCodigo(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'codigo' => ['required', 'digits:6'],
        ], [
            'codigo.required' => 'Escribe el código de 6 dígitos.',
            'codigo.digits'   => 'El código debe tener 6 dígitos.',
        ]);

        $pendiente = $request->session()->get('admin_2fa');

        if (! $pendiente || time() > $pendiente['expira']) {
            $request->session()->forget('admin_2fa');
            return response()->json([
                'message' => 'El código expiró. Inicia sesión de nuevo.',
                'codigo'  => 'codigo_expirado',
            ], 422);
        }

        if (! Hash::check($datos['codigo'], $pendiente['hash'])) {
            $pendiente['intentos']++;

            if ($pendiente['intentos'] >= self::MAX_INTENTOS) {
                $request->session()->forget('admin_2fa');

                // 5 códigos equivocados: la cuenta queda bloqueada y el contador empieza de cero al desbloquearse
                DB::table('users')->where('id', $pendiente['user_id'])->update([
                    'intentos_fallidos' => 0,
                    'bloqueado_hasta'   => now()->addMinutes(self::MINUTOS_BLOQUEO),
                ]);
                $this->registrarEvento(
                    $request,
                    $pendiente['user_id'],
                    'cuenta_bloqueada',
                    'Bloqueada ' . self::MINUTOS_BLOQUEO . ' minutos tras ' . self::MAX_INTENTOS . ' códigos de verificación incorrectos'
                );
                Log::warning('2FA admin: cuenta bloqueada por códigos incorrectos', [
                    'admin_id' => $pendiente['user_id'],
                    'ip' => $request->ip(),
                ]);

                return response()->json([
                    'message' => 'Demasiados códigos incorrectos. Tu cuenta quedó bloqueada durante '
                        . self::MINUTOS_BLOQUEO . ' minutos.',
                    'codigo'  => 'cuenta_bloqueada',
                    'bloqueado_minutos' => self::MINUTOS_BLOQUEO,
                ], 423);
            }

            $request->session()->put('admin_2fa', $pendiente);
            $quedan = self::MAX_INTENTOS - $pendiente['intentos'];

            return response()->json([
                'message' => 'Código incorrecto. Te quedan ' . $quedan . ' intento' . ($quedan === 1 ? '' : 's') . '.',
            ], 422);
        }

        $usuario = User::find($pendiente['user_id']);

        if (! $usuario || ! $usuario->tieneRol('administrador')
            || in_array($usuario->estado, ['inactivo', 'pendiente'], true)) {
            $request->session()->forget('admin_2fa');
            return response()->json(['message' => 'Esta cuenta no tiene acceso al panel de administración.'], 403);
        }

        // Código correcto: recién ahora se abre la sesión
        Auth::guard('web')->login($usuario, false);   // sin "recordar sesión": debe caducar por inactividad
        $request->session()->forget('admin_2fa');
        $request->session()->regenerate();
        $request->session()->put('admin_ultima_actividad', time());

        $this->registrarEvento($request, $usuario->id, 'inicio_sesion', 'Panel de administración (con código de verificación)');

        return response()->json([
            'message' => 'Sesión iniciada.',
            'usuario' => [
                'id'     => $usuario->id,
                'nombre' => $usuario->name,
                'email'  => $usuario->email,
                'rol'    => $usuario->role?->nombre,
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/sesion/codigo/reenviar
     * Manda un código nuevo (los intentos fallidos se conservan).
     */
    public function reenviarCodigo(Request $request): JsonResponse
    {
        $pendiente = $request->session()->get('admin_2fa');
        $usuario = $pendiente ? User::find($pendiente['user_id']) : null;

        if (! $usuario) {
            $request->session()->forget('admin_2fa');
            return response()->json([
                'message' => 'Tu solicitud expiró. Inicia sesión de nuevo.',
                'codigo'  => 'codigo_expirado',
            ], 422);
        }

        // Un código nuevo solo cada 60 segundos
        $faltan = (int) ($pendiente['reenvio_desde'] ?? 0) - time();
        if ($faltan > 0) {
            return response()->json([
                'message'  => 'Espera ' . $faltan . ' segundo' . ($faltan === 1 ? '' : 's') . ' para pedir otro código.',
                'segundos' => $faltan,
            ], 429);
        }

        if (! $this->emitirCodigo($request, $usuario, (int) $pendiente['intentos'])) {
            return $this->respuestaCorreoFallido();
        }

        return response()->json([
            'message' => 'Te enviamos un código nuevo.',
            'espera_reenvio' => self::ESPERA_REENVIO_SEGUNDOS,
        ]);
    }

    /* ---------------------------------------------------------- */

    /** Genera el código, lo guarda cifrado en la sesión y lo envía por correo. Devuelve false si el correo no salió. */
    private function emitirCodigo(Request $request, User $usuario, int $intentos = 0): bool
    {
        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $request->session()->put('admin_2fa', [
            'user_id'  => $usuario->id,
            'hash'     => Hash::make($codigo),
            'expira'   => time() + self::VIGENCIA_CODIGO_MINUTOS * 60,
            'intentos' => $intentos,
            'reenvio_desde' => time() + self::ESPERA_REENVIO_SEGUNDOS,
        ]);

        $texto = "Hola {$usuario->name},\n\n"
            . "Tu código de verificación para entrar al panel de administración de UMBRAL es:\n\n"
            . "CODIGO: {$codigo}\n\n"
            . 'Vence en ' . self::VIGENCIA_CODIGO_MINUTOS . " minutos.\n"
            . "Si no fuiste tú, ignora este mensaje y cambia tu contraseña.\n";

        try {
            Mail::raw($texto, function ($mensaje) use ($usuario) {
                $mensaje->to($usuario->email)->subject('Tu código de acceso a UMBRAL');
            });
        } catch (\Throwable $e) {
            // El detalle técnico se queda en el registro del servidor; el usuario no lo ve
            $request->session()->forget('admin_2fa');
            Log::error('2FA admin: no se pudo enviar el correo', ['admin_id' => $usuario->id, 'error' => $e->getMessage()]);

            return false;
        }

        Log::info('2FA admin: código enviado', ['admin_id' => $usuario->id, 'ip' => $request->ip()]);

        return true;
    }

    /** ¿La cuenta sigue bloqueada por intentos fallidos? */
    private function estaBloqueada(User $usuario): bool
    {
        return $usuario->bloqueado_hasta && now()->lt($usuario->bloqueado_hasta);
    }

    /** 423 con los minutos que faltan para que se desbloquee. */
    private function respuestaBloqueada(User $usuario): JsonResponse
    {
        $minutos = max(1, (int) ceil(now()->diffInSeconds($usuario->bloqueado_hasta, true) / 60));

        return response()->json([
            'message' => "Tu cuenta está bloqueada temporalmente por varios intentos fallidos. Intenta de nuevo en {$minutos} minuto(s).",
            'codigo'  => 'cuenta_bloqueada',
            'bloqueado_minutos' => $minutos,
        ], 423);
    }

    /** Mensaje limpio cuando Gmail (u otro servidor de correo) no deja enviar. */
    private function respuestaCorreoFallido(): JsonResponse
    {
        return response()->json([
            'message' => 'No pudimos enviar el correo con el código. Inténtalo de nuevo en un momento.',
            'codigo'  => 'correo_fallido',
        ], 503);
    }

    /** Anota un evento de seguridad. Nunca debe romper el inicio de sesión. */
    private function registrarEvento(Request $request, ?int $userId, string $tipo, ?string $detalle = null): void
    {
        try {
            DB::table('eventos_seguridad')->insert([
                'user_id'     => $userId,
                'tipo'        => $tipo,
                'ip'          => $request->ip(),
                'dispositivo' => mb_substr((string) $request->userAgent(), 0, 150),
                'detalle'     => $detalle !== null ? mb_substr($detalle, 0, 255) : null,
                'fecha'       => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo guardar el evento de seguridad: ' . $e->getMessage(), ['tipo' => $tipo]);
        }
    }

    /** juan.perez@dominio.com → ju******@dominio.com */
    private function ocultarCorreo(string $correo): string
    {
        [$local, $dominio] = explode('@', $correo, 2);

        return Str::substr($local, 0, 2) . str_repeat('*', max(1, Str::length($local) - 2)) . '@' . $dominio;
    }
}