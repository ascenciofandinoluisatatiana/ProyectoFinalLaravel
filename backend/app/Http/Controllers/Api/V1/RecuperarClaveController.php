<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
 * GET  /api/v1/recuperar-clave/estado?solicitud=                            → ¿esa solicitud ya cambió la clave?
 *   (la pestaña que pidió el enlace lo consulta al volver a verla, para cerrar su ventana sola)
 *
 * El enlace vence a los 60 minutos (config/auth.php) y solo sirve una vez.
 * Cada solicitud y cada cambio queda en eventos_seguridad; cada correo, en registro_correo.
 */
class RecuperarClaveController extends Controller
{
    /** Cuánto se recuerda una solicitud: lo mismo que dura el enlace del correo. */
    private const MINUTOS_SOLICITUD = 60;

    /** Pide el enlace. La respuesta es siempre la misma, exista o no el correo. */
    public function solicitar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $usuario = User::with('role')->where('email', $datos['email'])->first();

        // Número al azar de esta solicitud: se devuelve siempre (exista o no el correo)
        // para que la respuesta no delate qué correos están registrados.
        $solicitud = Str::random(40);

        if ($usuario && self::puedeRecuperar($usuario)) {
            self::enviarEnlace($usuario, $request, 'recuperacion_solicitada');
            self::guardarSolicitud($usuario->id, $solicitud);
        }

        return response()->json([
            'message'   => 'Si el correo está registrado, te enviamos un enlace para elegir una contraseña nueva.',
            'solicitud' => $solicitud,
        ]);
    }

    /** Dice si la clave de esa solicitud ya se cambió. Solo responde sí o no. */
    public function estado(Request $request): JsonResponse
    {
        $solicitud = (string) $request->query('solicitud', '');
        $cambiada = strlen($solicitud) === 40 && Cache::get('recuperar:sol:' . $solicitud) === 'cambiada';

        return response()->json(['cambiada' => $cambiada]);
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
                self::marcarSolicitudesCambiadas($usuario->id);
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
    public static function enviarEnlace(User $usuario, Request $request, string $tipoEvento, ?string $detalle = null): bool
    {
        $token = Password::createToken($usuario);
        // Dirección de la página (FRONTEND_URL): en cada PC es su puerto y en el servidor es el dominio
        $url = rtrim(config('portal.frontend_url'), '/')
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

        self::registrarEvento($usuario->id, $tipoEvento, $request, $detalle);

        return $estado === 'enviado';
    }

    /** Guarda la solicitud (en la caché del servidor, 60 min) como "pendiente" y la liga a la cuenta. */
    private static function guardarSolicitud(int $userId, string $solicitud): void
    {
        $vence = now()->addMinutes(self::MINUTOS_SOLICITUD);
        $lista = Cache::get('recuperar:lista:' . $userId, []);
        $lista[] = $solicitud;

        Cache::put('recuperar:sol:' . $solicitud, 'pendiente', $vence);
        Cache::put('recuperar:lista:' . $userId, array_slice($lista, -10), $vence);
    }

    /** Al cambiar la clave, todas las solicitudes abiertas de esa cuenta pasan a "cambiada". */
    private static function marcarSolicitudesCambiadas(int $userId): void
    {
        $vence = now()->addMinutes(self::MINUTOS_SOLICITUD);

        foreach (Cache::pull('recuperar:lista:' . $userId, []) as $solicitud) {
            Cache::put('recuperar:sol:' . $solicitud, 'cambiada', $vence);
        }
    }

    /** Solo cuentas que pueden iniciar sesión en el portal y que no están desactivadas. */
    public static function puedeRecuperar(User $usuario): bool
    {
        return $usuario->tieneRol(...User::ROLES_PANEL) && $usuario->estado !== 'inactivo';
    }

    private static function registrarEvento(int $userId, string $tipo, Request $request, ?string $detalle = null): void
    {
        $fila = [
            'user_id'     => $userId,
            'tipo'        => $tipo,
            'ip'          => $request->ip(),
            'dispositivo' => mb_substr((string) $request->userAgent(), 0, 150),
            'fecha'       => now(),
        ];

        // La columna "detalle" la crea la migración del paso 5B; solo se usa cuando hay algo que anotar
        if ($detalle !== null) {
            $fila['detalle'] = mb_substr($detalle, 0, 255);
        }

        DB::table('eventos_seguridad')->insert($fila);
    }
}
