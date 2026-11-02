<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Captcha anti-bots con Cloudflare Turnstile (gratis, sin documentos).
 *   - El formulario muestra el widget con la clave de sitio y envía el token en "captcha".
 *   - El servidor confirma el token con Cloudflare usando la clave secreta.
 * Las claves vienen del .env (TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY).
 * Sin claves el captcha queda desactivado. Para probar en local sirven las claves de
 * prueba de Cloudflare (siempre aprueban), que están en .env.example.
 */
class CaptchaService
{
    private const VERIFICAR = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function activo(): bool
    {
        return (bool) (config('services.turnstile.site_key') && config('services.turnstile.secret_key'));
    }

    public function claveSitio(): ?string
    {
        return $this->activo() ? config('services.turnstile.site_key') : null;
    }

    /** Lanza un error de validación en "captcha" si el token no es válido. */
    public function validar(Request $request): void
    {
        if (! $this->activo()) {
            return;
        }

        $token = (string) $request->input('captcha', '');
        if ($token === '') {
            throw ValidationException::withMessages(['captcha' => 'Confirma que no eres un robot.']);
        }

        try {
            $respuesta = Http::asForm()->timeout(8)->post(self::VERIFICAR, [
                'secret' => config('services.turnstile.secret_key'),
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);
            $valido = $respuesta->successful() && $respuesta->json('success') === true;
        } catch (\Throwable $e) {
            Log::warning('No se pudo verificar el captcha', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['captcha' => 'No pudimos verificar el captcha. Intenta de nuevo.']);
        }

        if (! $valido) {
            throw ValidationException::withMessages(['captcha' => 'El captcha no es válido o ya venció. Vuelve a marcarlo.']);
        }
    }
}
