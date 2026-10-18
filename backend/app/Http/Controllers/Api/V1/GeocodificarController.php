<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * GET /api/v1/public/geocodificar?q=Calle 10 #5-20, Barrio, Cali, Valle del Cauca, Colombia
 *
 * Convierte una dirección escrita en coordenadas (lat, lng).
 * El frontend le habla a ESTA API y ella consulta a Nominatim (OpenStreetMap),
 * que es gratis y no pide cuenta ni tarjeta.
 *
 * En Colombia OpenStreetMap casi nunca tiene el número exacto de la casa
 * (ej. "Calle 10 #5-20"). Por eso, si la dirección completa no aparece,
 * se intenta de nuevo con menos detalle: la calle sin número, luego el barrio
 * y por último la ciudad. Si el resultado es menos exacto, se responde
 * "aproximado": true para avisarle al usuario que ajuste el pin.
 */
class GeocodificarController extends Controller
{
    /** Máximo de intentos por búsqueda (Nominatim pide ir despacio). */
    private const MAX_INTENTOS = 4;

    public function __invoke(Request $request): JsonResponse
    {
        $q = trim($request->validate([
            'q' => ['required', 'string', 'min:3', 'max:200'],
        ], [
            'q.required' => 'Escribe una dirección para buscar.',
        ])['q']);

        // "v2": evita usar respuestas vacías guardadas por la versión anterior
        $clave = 'geocodificar.v2.' . md5(mb_strtolower($q));
        $guardado = Cache::get($clave);

        if ($guardado !== null) {
            return response()->json(['data' => $guardado === 'sin-resultado' ? null : $guardado]);
        }

        $partes = $this->partes($q);

        foreach ($this->variantes($partes) as $i => $texto) {
            if ($i > 0) {
                usleep(1100000); // Nominatim: máximo 1 consulta por segundo
            }

            try {
                $respuesta = Http::timeout(8)
                    ->withHeaders([
                        // Nominatim exige identificar la aplicación
                        'User-Agent' => 'UmbralPortalInmobiliario/1.0 (proyecto academico SENA)',
                        'Accept-Language' => 'es',
                    ])
                    ->get('https://nominatim.openstreetmap.org/search', [
                        'format' => 'json',
                        'limit' => 1,
                        'countrycodes' => 'co',
                        'q' => $texto,
                    ]);
            } catch (ConnectionException $e) {
                return response()->json(['message' => 'No se pudo conectar con el servicio de mapas.'], 502);
            }

            if (! $respuesta->successful()) {
                return response()->json(['message' => 'El servicio de mapas no respondió. Intenta de nuevo.'], 502);
            }

            $primero = $respuesta->json(0);

            if ($primero) {
                $resultado = [
                    'lat' => (float) $primero['lat'],
                    'lng' => (float) $primero['lon'],
                    'nombre' => $primero['display_name'] ?? null,
                    // true si hubo que buscar con menos partes que las escritas (ej. solo la ciudad)
                    'aproximado' => count($this->partes($texto)) < count($partes),
                ];
                Cache::put($clave, $resultado, 86400);

                return response()->json(['data' => $resultado]);
            }
        }

        Cache::put($clave, 'sin-resultado', 3600);

        return response()->json(['data' => null]);
    }

    /** "Calle 10 #5-20, Centro, Cali, Valle, Colombia" → ['Calle 10 #5-20', 'Centro', 'Cali', ...] */
    private function partes(string $texto): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $texto)), fn ($p) => $p !== ''));
    }

    /** Lista de textos a probar, del más exacto al menos exacto. */
    private function variantes(array $partes): array
    {
        $lista = [implode(', ', $partes)];

        // La misma dirección sin el número de casa: "Calle 10 #5-20" → "Calle 10"
        if (count($partes) > 1) {
            $calle = trim((string) preg_replace('/\s*(#|\bNo\.|\bNro\.?|N°|Nº).*$/iu', '', $partes[0]));
            if ($calle !== '' && $calle !== $partes[0]) {
                $copia = $partes;
                $copia[0] = $calle;
                $lista[] = implode(', ', $copia);
            }
        }

        // Quitando de a una parte: sin calle (barrio + ciudad), luego solo la ciudad...
        $resto = $partes;
        while (count($resto) > 2) {
            array_shift($resto);
            $lista[] = implode(', ', $resto);
        }

        return array_slice(array_values(array_unique($lista)), 0, self::MAX_INTENTOS);
    }
}