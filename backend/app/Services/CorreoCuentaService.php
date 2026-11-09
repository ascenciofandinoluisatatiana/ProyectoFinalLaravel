<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Correos que el portal manda a una cuenta cuando el administrador decide algo:
 *   - cuenta aprobada
 *   - cuenta rechazada (con el motivo que escribió el administrador)
 *   - cuenta nueva creada por el administrador
 *
 * Solo en español (las cuentas de rol son de Colombia).
 * Nunca rompe la acción del administrador: si el correo no sale, la aprobación o la creación
 * igual se hacen, y el fallo queda anotado en "registro_correo" y en el registro del servidor.
 * La contraseña NUNCA va dentro de un correo.
 */
class CorreoCuentaService
{
    public static function aprobada(User $usuario): bool
    {
        $texto = "Hola {$usuario->name},\n\n"
            . "Tu cuenta en UMBRAL fue aprobada. Ya puedes iniciar sesión con tu correo y tu contraseña.\n\n"
            . 'Entra aquí: ' . self::portal() . "\n\n"
            . "Si no recuerdas tu contraseña, usa la opción \"¿Olvidaste tu contraseña?\" en el inicio de sesión.\n";

        return self::enviar($usuario, 'cuenta_aprobada', 'Tu cuenta en UMBRAL fue aprobada', $texto);
    }

    public static function rechazada(User $usuario, ?string $motivo): bool
    {
        $texto = "Hola {$usuario->name},\n\n"
            . "Revisamos tu solicitud y tu cuenta en UMBRAL no fue aprobada.\n\n"
            . ($motivo ? "Motivo: {$motivo}\n\n" : '')
            . "Si crees que es un error o quieres corregir tus datos, ponte en contacto con el administrador del portal.\n";

        return self::enviar($usuario, 'cuenta_rechazada', 'Tu cuenta en UMBRAL no fue aprobada', $texto);
    }

    public static function creada(User $usuario): bool
    {
        $texto = "Hola {$usuario->name},\n\n"
            . "El administrador de UMBRAL creó una cuenta para ti con este correo.\n\n"
            . "Entra con tu correo y la contraseña que te dio el administrador:\n" . self::portal() . "\n\n"
            . "Por seguridad, cambia tu contraseña apenas entres: en el inicio de sesión usa la opción "
            . "\"¿Olvidaste tu contraseña?\" y elige una nueva que solo tú conozcas.\n";

        return self::enviar($usuario, 'cuenta_creada', 'Tu cuenta en UMBRAL fue creada', $texto);
    }

    /** Dirección del portal: en cada PC es su puerto y en el servidor es el dominio (FRONTEND_URL). */
    private static function portal(): string
    {
        return rtrim((string) config('portal.frontend_url'), '/') . '/';
    }

    /** Envía el correo y lo anota en registro_correo. Devuelve false si no salió. */
    private static function enviar(User $usuario, string $plantilla, string $asunto, string $texto): bool
    {
        $estado = 'enviado';
        $error = null;

        try {
            Mail::raw($texto, function ($mensaje) use ($usuario, $asunto) {
                $mensaje->to($usuario->email)->subject($asunto);
            });
        } catch (\Throwable $e) {
            $estado = 'fallido';
            $error = mb_substr($e->getMessage(), 0, 500);
            Log::error('Correo de cuenta: no se pudo enviar', [
                'plantilla' => $plantilla,
                'user_id'   => $usuario->id,
                'error'     => $error,
            ]);
        }

        try {
            DB::table('registro_correo')->insert([
                'user_id'      => $usuario->id,
                'destinatario' => mb_substr($usuario->email, 0, 150),
                'plantilla'    => $plantilla,
                'estado'       => $estado,
                'error'        => $error,
                'fecha'        => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo anotar el correo en registro_correo: ' . $e->getMessage());
        }

        return $estado === 'enviado';
    }
}
