<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Recuperar contraseña por correo (sirve para todos los roles).
 *
 * POST /api/v1/recuperar-clave    { email }                                   → envía el enlace
 * GET  /api/v1/restablecer-clave/verificar?email=&token=                    → ¿el enlace sigue sirviendo?
 * POST /api/v1/restablecer-clave  { email, token, password, password_confirmation } → guarda la clave nueva
 *
 * El enlace vence a los 60 minutos (config/auth.php) y solo sirve una vez.
 * Cada solicitud y cada cambio queda en eventos_seguridad; cada correo, en registro_correo.
 */
class RecuperarClaveController extends Controller
{
    /** Pide el enlace. La respuesta es siempre la misma, exista o no el correo. */
    public function solicitar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $usuario = User::with('role')->where('email', $datos['email'])->first();

        if ($usuario && self::puedeRecuperar($usuario)) {
            self::enviarEnlace($usuario, $request, 'recuperacion_solicitada');
        }

        return response()->json([
            'message' => 'Si el correo está registrado, te enviamos un enlace para elegir una contraseña nueva.',
        ]);
    }

    /** Dice si el enlace del correo todavía sirve (no usado y no vencido). */
    public function verificar(Request $request): JsonResponse
    {
        $email = (string) $request->query('email', '');
        $token = (string) $request->query('token', '');

        $usuario = $email !== '' ? User::where('email', $email)->first() : null;
        $valido = $usuario && $token !== '' && Password::tokenExists($usuario, $token);

        return response()->json(['valido' => (bool) $valido]);
    }

    /** Guarda la contraseña nueva usando el enlace del correo. */
    public function restablecer(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email'    => ['required', 'email'],
            'token'    => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.min'       => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $estado = Password::reset(
            [
                'email'                 => $datos['email'],
                'token'                 => $datos['token'],
                'password'              => $datos['password'],
                'password_confirmation' => $request->input('password_confirmation'),
            ],
            function (User $usuario, string $clave) use ($request) {
                $usuario->forceFill([
                    'password'          => $clave,           // se cifra con el cast del modelo
                    'remember_token'    => Str::random(60),
                    'intentos_fallidos' => 0,                // también se desbloquea la cuenta
                    'bloqueado_hasta'   => null,
                ])->save();

                self::registrarEvento($usuario->id, 'clave_restablecida', $request);
            }
        );

        if ($estado !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'El enlace no es válido o ya venció. Pide uno nuevo.',
                'codigo'  => 'enlace_invalido',
            ], 422);
        }

        return response()->json(['message' => 'Contraseña cambiada. Ya puedes iniciar sesión.']);
    }

    /**
     * Crea el enlace y lo envía por correo. También lo usa el botón del administrador.
     * $tipoEvento: recuperacion_solicitada | enlace_enviado_admin
     */
    public static function enviarEnlace(User $usuario, Request $request, string $tipoEvento): bool
    {
        $token = Password::createToken($usuario);
        $url = rtrim(config('app.url'), '/')
            . '/restablecer.html?token=' . urlencode($token)
            . '&email=' . urlencode($usuario->email);

        $texto = "Hola {$usuario->name},\n\n"
            . "Recibimos una solicitud para cambiar la contraseña de tu cuenta en UMBRAL.\n\n"
            . "Abre este enlace para elegir una contraseña nueva (vence en 60 minutos):\n\n"
            . "{$url}\n\n"
            . "Si no fuiste tú, ignora este mensaje: tu contraseña no cambiará.\n";

        $estado = 'enviado';
        $error = null;

        try {
            Mail::raw($texto, function ($mensaje) use ($usuario) {
                $mensaje->to($usuario->email)->subject('Cambia tu contraseña de UMBRAL');
            });

            // Solo en modo "log" (pruebas): deja el enlace completo en el registro para poder abrirlo
            if (config('mail.default') === 'log') {
                Log::info('Enlace de recuperación (solo modo log): ' . $url);
            }
        } catch (\Throwable $e) {
            $estado = 'fallido';
            $error = mb_substr($e->getMessage(), 0, 500);
            Log::error('Recuperar contraseña: no se pudo enviar el correo', ['user_id' => $usuario->id, 'error' => $error]);
        }

        DB::table('registro_correo')->insert([
            'user_id'      => $usuario->id,
            'destinatario' => mb_substr($usuario->email, 0, 150),
            'plantilla'    => 'recuperar_clave',
            'estado'       => $estado,
            'error'        => $error,
            'fecha'        => now(),
        ]);

        self::registrarEvento($usuario->id, $tipoEvento, $request);

        return $estado === 'enviado';
    }

    /** Solo cuentas que pueden iniciar sesión en el portal y que no están desactivadas. */
    public static function puedeRecuperar(User $usuario): bool
    {
        return $usuario->tieneRol(...User::ROLES_PANEL) && $usuario->estado !== 'inactivo';
    }

    private static function registrarEvento(int $userId, string $tipo, Request $request): void
    {
        DB::table('eventos_seguridad')->insert([
            'user_id'     => $userId,
            'tipo'        => $tipo,
            'ip'          => $request->ip(),
            'dispositivo' => mb_substr((string) $request->userAgent(), 0, 150),
            'fecha'       => now(),
        ]);
    }
}
