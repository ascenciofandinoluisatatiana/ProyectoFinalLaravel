<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

/**
 * Sesión del panel del vendedor (persona). Sesión web de Laravel, igual que
 * la inmobiliaria y el agente: el frontend vive en el mismo origen (nginx
 * reenvía /api a Laravel), así que la cookie viaja sola.
 */
class SesionController extends Controller
{
    /** GET /api/v1/vendedor/csrf — solo deja la cookie XSRF-TOKEN para poder hacer POST. */
    public function csrf(): Response
    {
        return response()->noContent();
    }

    /** POST /api/v1/vendedor/sesion  { email, password, recordar } */
    public function entrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => $datos['email'], 'password' => $datos['password']], $request->boolean('recordar'))) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        $request->session()->regenerate();
        $usuario = Auth::user();

        // Una cuenta bloqueada, sin verificar o de otro rol no entra al panel
        $motivo = null;
        if (in_array($usuario->estado, ['inactivo', 'pendiente'], true)) {
            $motivo = 'Tu cuenta está inactiva o pendiente de verificación.';
        } elseif (! $usuario->tieneRol('vendedor')) {
            $motivo = 'Esta cuenta no tiene acceso al panel del vendedor.';
        }

        if ($motivo) {
            $this->cerrar($request);

            return response()->json(['message' => $motivo], 403);
        }

        return response()->json(['message' => 'Sesión iniciada.', 'usuario' => $this->datosUsuario($usuario)]);
    }

    /** GET /api/v1/vendedor/yo — datos del vendedor que tiene la sesión */
    public function yo(Request $request): JsonResponse
    {
        return response()->json(['usuario' => $this->datosUsuario($request->user())]);
    }

    /** POST /api/v1/vendedor/salir */
    public function salir(Request $request): JsonResponse
    {
        $this->cerrar($request);

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    private function cerrar(Request $request): void
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    private function datosUsuario($usuario): array
    {
        return [
            'id' => $usuario->id,
            'nombre' => $usuario->name,
            'email' => $usuario->email,
            'rol' => $usuario->role?->nombre,
            'telefono' => $usuario->telefono,
            'avatar' => $usuario->avatar,
        ];
    }
}
