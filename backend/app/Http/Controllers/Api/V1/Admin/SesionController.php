<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
 * El código se guarda cifrado (hash) en la sesión, vence a los 5 minutos y
 * se anula después de 5 intentos fallidos.
 */
class SesionController extends Controller
{
    private const VIGENCIA_CODIGO_MINUTOS = 5;
    private const MAX_INTENTOS = 5;

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

        if (! $usuario || ! $proveedor->validateCredentials($usuario, $credenciales)) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        // Solo administradores pueden entrar al panel
        if (! $usuario->tieneRol('administrador')) {
            return response()->json(['message' => 'Esta cuenta no tiene acceso al panel de administración.'], 403);
        }

        // Cuenta inactiva o pendiente
        if (in_array($usuario->estado, ['inactivo', 'pendiente'], true)) {
            return response()->json(['message' => 'Tu cuenta está inactiva o pendiente de verificación.'], 403);
        }

        $this->emitirCodigo($request, $usuario);

        return response()->json([
            'requiere_codigo' => true,
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
                Log::warning('2FA admin: código anulado por demasiados intentos', [
                    'admin_id' => $pendiente['user_id'],
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'message' => 'Demasiados intentos fallidos. Inicia sesión de nuevo.',
                    'codigo'  => 'codigo_expirado',
                ], 422);
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

        $this->emitirCodigo($request, $usuario, (int) $pendiente['intentos']);

        return response()->json(['message' => 'Te enviamos un código nuevo.']);
    }

    /* ---------------------------------------------------------- */

    /** Genera el código, lo guarda cifrado en la sesión y lo envía por correo. */
    private function emitirCodigo(Request $request, User $usuario, int $intentos = 0): void
    {
        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $request->session()->put('admin_2fa', [
            'user_id'  => $usuario->id,
            'hash'     => Hash::make($codigo),
            'expira'   => time() + self::VIGENCIA_CODIGO_MINUTOS * 60,
            'intentos' => $intentos,
        ]);

        $texto = "Hola {$usuario->name},\n\n"
            . "Tu código de verificación para entrar al panel de administración de UMBRAL es:\n\n"
            . "CODIGO: {$codigo}\n\n"
            . 'Vence en ' . self::VIGENCIA_CODIGO_MINUTOS . " minutos.\n"
            . "Si no fuiste tú, ignora este mensaje y cambia tu contraseña.\n";

        Mail::raw($texto, function ($mensaje) use ($usuario) {
            $mensaje->to($usuario->email)->subject('Tu código de acceso a UMBRAL');
        });

        Log::info('2FA admin: código enviado', ['admin_id' => $usuario->id, 'ip' => $request->ip()]);
    }

    /** juan.perez@dominio.com → ju******@dominio.com */
    private function ocultarCorreo(string $correo): string
    {
        [$local, $dominio] = explode('@', $correo, 2);

        return Str::substr($local, 0, 2) . str_repeat('*', max(1, Str::length($local) - 2)) . '@' . $dominio;
    }
}