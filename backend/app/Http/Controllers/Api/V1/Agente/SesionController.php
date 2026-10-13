<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureAgenteApi;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

/** Sesión del panel del agente (sesión web de Laravel, igual que la inmobiliaria). */
class SesionController extends Controller
{
    /** GET /api/v1/agente/csrf — deja la cookie XSRF-TOKEN */
    public function csrf(): Response
    {
        return response()->noContent();
    }

    /** POST /api/v1/agente/sesion  { email, password, recordar } */
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

        if ($motivo = EnsureAgenteApi::motivoRechazo(Auth::user())) {
            $this->cerrar($request);

            return response()->json(['message' => $motivo], 403);
        }

        return response()->json(['message' => 'Sesión iniciada.', 'usuario' => self::datos(Auth::user())]);
    }

    /** GET /api/v1/agente/yo */
    public function yo(Request $request): JsonResponse
    {
        return response()->json(['usuario' => self::datos($request->user())]);
    }

    /** POST /api/v1/agente/salir */
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

    public static function datos(User $u): array
    {
        return [
            'id' => $u->id,
            'nombre' => $u->name,
            'email' => $u->email,
            'rol' => 'agente',
            'telefono' => $u->telefono,
            'documento' => trim(($u->tipo_documento ?? '') . ' ' . ($u->numero_documento ?? '')),
            'inmobiliaria' => $u->inmobiliaria ? ['id' => $u->inmobiliaria->id, 'nombre' => $u->inmobiliaria->name] : null,
        ];
    }
}
