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
 *   - documento en revisión (aviso corto a la persona y aviso a todos los administradores activos)
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

    /** Rechazo automático de la IA al revisar el documento: explica el motivo y cómo volver a intentar. */
    public static function rechazadaPorIA(User $usuario, string $motivo): bool
    {
        $texto = "Hola {$usuario->name},\n\n"
            . "Revisamos el documento que subiste y tu registro en UMBRAL no fue aprobado.\n\n"
            . "Motivo: {$motivo}\n\n"
            . "Puedes volver a registrarte en " . self::portal() . " con una foto clara y completa de tu documento "
            . "y con los mismos datos que escribes en el formulario.\n";

        return self::enviar($usuario, 'cuenta_rechazada', 'Tu registro en UMBRAL no fue aprobado', $texto);
    }

    /** Aviso corto a la persona: la IA no pudo decidir sola y el documento lo revisa soporte. */
    public static function enRevision(User $usuario): bool
    {
        $texto = "Hola {$usuario->name},\n\n"
            . "Recibimos tu registro en UMBRAL. Tu documento está en revisión por soporte.\n\n"
            . "Te avisaremos por este correo apenas tengamos una respuesta.\n";

        return self::enviar($usuario, 'cuenta_en_revision', 'Tu documento está en revisión en UMBRAL', $texto);
    }

    /** Aviso a TODOS los administradores activos: hay una cuenta que debe revisar una persona. */
    public static function pendienteParaAdmins(User $cuenta, ?string $rol, int $puntaje, ?string $motivo): int
    {
        $administradores = User::where('estado', 'activo')
            ->whereHas('role', fn ($q) => $q->where('nombre', 'administrador'))
            ->get();

        $enviados = 0;
        foreach ($administradores as $admin) {
            $texto = "Hola {$admin->name},\n\n"
                . "Una cuenta nueva necesita tu revisión en UMBRAL.\n\n"
                . "Nombre: {$cuenta->name}\n"
                . 'Rol: ' . ($rol ?: 'sin rol') . "\n"
                . "Puntaje de la IA: {$puntaje} de 100\n"
                . 'Observación de la IA: ' . ($motivo ?: 'sin observaciones') . "\n\n"
                . 'Revísala en el panel de administración, en Verificaciones: ' . self::portal() . "\n";

            if (self::enviar($admin, 'cuenta_pendiente_admin', 'Cuenta pendiente de revisión en UMBRAL', $texto)) {
                $enviados++;
            }
        }

        return $enviados;
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

    /**
     * Un solo correo al día con todo lo que le vence a la persona (membresías y paquetes).
     * Lo manda el comando diario "membresias:avisar-vencimiento".
     *
     * @param  array<int, array{que:string, detalle:string, dias:int, fin:string}>  $items
     */
    public static function porVencer(User $usuario, array $items): bool
    {
        if (! $items) {
            return false;
        }

        usort($items, fn ($a, $b) => $a['dias'] <=> $b['dias']);
        $cuando = fn (int $d) => $d === 0 ? 'vence hoy' : ($d === 1 ? 'vence mañana' : "vence en {$d} días");

        $lineas = [];
        foreach (array_slice($items, 0, 30) as $i) {
            $lineas[] = "- {$i['que']}: {$i['detalle']} · {$cuando($i['dias'])} ({$i['fin']})";
        }
        if (count($items) > 30) {
            $lineas[] = '- y ' . (count($items) - 30) . ' más. Míralas todas en el portal.';
        }

        $urgente = $items[0]['dias'] <= 5;
        $unico = count($items) === 1;

        $texto = "Hola {$usuario->name},\n\n"
            . ($unico ? "Esto está por vencer en UMBRAL:\n\n" : "Estas membresías y paquetes están por vencer en UMBRAL:\n\n")
            . implode("\n", $lineas) . "\n\n"
            . ($unico ? 'Renuévalo' : 'Renuévalos') . ' a tiempo para que tus publicaciones sigan visibles. Entra aquí: ' . self::portal() . "\n\n"
            . ($urgente
                ? "Te avisaremos cada día hasta que renueves o venza.\n"
                : "Si ya renovaste, ignora este mensaje.\n");

        $asunto = $unico
            ? ($items[0]['que'] === 'Paquete' ? 'Tu paquete ' : 'Tu membresía ') . $cuando($items[0]['dias']) . ' en UMBRAL'
            : 'Tienes ' . count($items) . ' membresías o paquetes por vencer en UMBRAL';

        return self::enviar($usuario, 'membresia_por_vencer', $asunto, $texto);
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
