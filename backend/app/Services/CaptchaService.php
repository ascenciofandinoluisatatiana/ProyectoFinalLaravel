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
 * Sin claves el captcha queda desactivado.
 *
 * IN9: las claves de PRUEBA de Cloudflare (empiezan por 1x0000, 2x0000 o 3x0000) siempre aprueban,
 * por eso en producción "no validaba". En producción se avisa en el log si faltan las claves o si
 * son de prueba, y con claves reales se revisa además que el token se haya resuelto en nuestro
 * dominio (APP_URL), para que no sirva un token sacado de otra página.
 */
class CaptchaService
{
    private const VERIFICAR = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    private static bool $avisado = false;

    public function activo(): bool
    {
        $activo = (bool) (config('services.turnstile.site_key') && config('services.turnstile.secret_key'));
        $this->avisarEnProduccion($activo);

        return $activo;
    }

    public function claveSitio(): ?string
    {
        return $this->activo() ? config('services.turnstile.site_key') : null;
    }

    /** true si se están usando las claves de prueba de Cloudflare (siempre aprueban). */
    public function clavesDePrueba(): bool
    {
        foreach (['site_key', 'secret_key'] as $clave) {
            if (preg_match('/^[123]x0{4}/', (string) config('services.turnstile.' . $clave))) {
                return true;
            }
        }

        return false;
    }

    /** Lanza un error de validación en "captcha" si el token no es válido. */
    public function validar(Request $request): void
    {
        if (! $this->activo()) {
            return;
        }

        $token = (string) $request->input('captcha', '');
        if ($token === '' || strlen($token) > 2048) {
            throw ValidationException::withMessages(['captcha' => 'Confirma que no eres un robot.']);
        }

        try {
            $respuesta = Http::asForm()->timeout(8)->post(self::VERIFICAR, [
                'secret' => config('services.turnstile.secret_key'),
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo verificar el captcha', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['captcha' => 'No pudimos verificar el captcha. Intenta de nuevo.']);
        }

        $datos = $respuesta->successful() ? (array) $respuesta->json() : [];
        if (($datos['success'] ?? false) !== true) {
            $codigos = (array) ($datos['error-codes'] ?? []);
            if (array_intersect($codigos, ['invalid-input-secret', 'missing-input-secret'])) {
                Log::error('Captcha: la clave secreta de Turnstile no es válida (revisa TURNSTILE_SECRET_KEY).');
            }
            throw ValidationException::withMessages(['captcha' => in_array('timeout-or-duplicate', $codigos, true)
                ? 'El captcha venció o ya se usó. Vuelve a marcarlo.'
                : 'El captcha no es válido. Vuelve a marcarlo.']);
        }

        // Con claves reales, el token debe venir de nuestro dominio
        if (! $this->clavesDePrueba() && ! $this->dominioPermitido((string) ($datos['hostname'] ?? ''), $request)) {
            Log::warning('Captcha resuelto en otro dominio', ['hostname' => $datos['hostname'] ?? null]);
            throw ValidationException::withMessages(['captcha' => 'El captcha no es válido. Vuelve a marcarlo.']);
        }
    }

    /** Dominio de APP_URL o el de la petición (con o sin "www."). */
    private function dominioPermitido(string $hostname, Request $request): bool
    {
        $hostname = strtolower($hostname);
        if ($hostname === '') {
            return false;
        }
        $permitidos = array_filter([parse_url((string) config('app.url'), PHP_URL_HOST), $request->getHost()]);
        foreach ($permitidos as $dominio) {
            $dominio = preg_replace('/^www\./', '', strtolower($dominio));
            if ($hostname === $dominio || $hostname === 'www.' . $dominio) {
                return true;
            }
        }

        return false;
    }

    /** Una sola vez por proceso: en producción el captcha debe tener claves reales. */
    private function avisarEnProduccion(bool $activo): void
    {
        if (self::$avisado || ! app()->isProduction()) {
            return;
        }
        self::$avisado = true;
        if (! $activo) {
            Log::warning('Captcha desactivado en producción: faltan TURNSTILE_SITE_KEY y TURNSTILE_SECRET_KEY.');
        } elseif ($this->clavesDePrueba()) {
            Log::warning('Captcha con claves de PRUEBA en producción: siempre aprueba. Pon las claves reales de Cloudflare Turnstile.');
        }
    }
}
