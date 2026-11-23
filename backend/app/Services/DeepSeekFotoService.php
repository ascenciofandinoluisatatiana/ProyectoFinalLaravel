<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Revisa con DeepSeek que una foto sea de un inmueble (casa, apartamento, finca, local,
 * lote u oficina) antes de guardarla en el almacenamiento.
 *
 * Devuelve SIEMPRE un arreglo con esta forma:
 *   disponible  : true si la IA respondió bien; false si falló (sin clave, sin saldo, caída, tardó...)
 *   es_inmueble : true / false (null si la IA no estuvo disponible)
 *   categoria   : casa | apartamento | finca | local | lote | oficina | otro (null si no hubo respuesta)
 *   motivo      : frase corta en español
 *
 * Si la IA falla, la foto se ACEPTA y el fallo queda en el log (así una caída de DeepSeek nunca
 * deja a un vendedor sin poder publicar). Quien la use decide rechazar solo cuando
 * disponible === true y es_inmueble === false.
 *
 * Usa la misma clave, URL, modelo y tiempo de espera de config/services.php ('deepseek').
 */
class DeepSeekFotoService
{
    /** Lado más largo (px) al que se reduce la foto antes de enviarla: ahorra tiempo y datos. */
    private const LADO_MAXIMO = 1024;

    /** Tope de espera en segundos: debe ser bien menor al del servidor (nginx corta a los 60 s). */
    private const ESPERA_MAXIMA = 12;

    /**
     * @param  string  $contenido  Bytes de la imagen (JPG, PNG, WebP o GIF)
     * @param  string  $mime       'image/jpeg', 'image/png', 'image/webp' o 'image/gif'
     */
    public static function revisar(string $contenido, string $mime): array
    {
        $clave = config('services.deepseek.key');
        if (! $clave) {
            return self::noDisponible('Falta configurar la clave de DeepSeek en el servidor.');
        }

        [$contenido, $mime] = self::reducir($contenido, $mime);

        try {
            $respuesta = Http::withToken($clave)
                ->acceptJson()
                ->connectTimeout(4)
                ->timeout(min(self::ESPERA_MAXIMA, (int) config('services.deepseek.timeout', 30)))
                ->post(config('services.deepseek.url'), [
                    'model'       => config('services.deepseek.model'),
                    'temperature' => 0,
                    'max_tokens'  => 200,
                    'messages'    => [
                        ['role' => 'system', 'content' => self::instrucciones()],
                        ['role' => 'user', 'content' => [
                            ['type' => 'text', 'text' => self::pedido()],
                            ['type' => 'image_url', 'image_url' => ['url' => 'data:' . $mime . ';base64,' . base64_encode($contenido)]],
                        ]],
                    ],
                ]);
        } catch (Throwable $e) {
            Log::warning('DeepSeek (fotos): no respondió', ['error' => mb_substr($e->getMessage(), 0, 200)]);

            return self::noDisponible('No se pudo conectar con la IA o tardó demasiado.');
        }

        if (! $respuesta->successful()) {
            Log::warning('DeepSeek (fotos): respuesta con error', [
                'estado' => $respuesta->status(),
                'cuerpo' => mb_substr($respuesta->body(), 0, 300),
            ]);

            return self::noDisponible($respuesta->status() === 402
                ? 'La cuenta de DeepSeek no tiene saldo.'
                : 'La IA respondió con un error (' . $respuesta->status() . ').');
        }

        // Reutiliza el lector de JSON que ya usa la verificación de documentos
        $lectura = DeepSeekDocumentoService::extraerJson((string) $respuesta->json('choices.0.message.content'));
        if ($lectura === null || ! array_key_exists('es_inmueble', $lectura)) {
            Log::warning('DeepSeek (fotos): la respuesta no era la esperada', ['cuerpo' => mb_substr($respuesta->body(), 0, 300)]);

            return self::noDisponible('La IA respondió algo que no se pudo entender.');
        }

        $categoria = strtolower(trim((string) ($lectura['categoria'] ?? 'otro')));
        if (! in_array($categoria, ['casa', 'apartamento', 'finca', 'local', 'lote', 'oficina', 'otro'], true)) {
            $categoria = 'otro';
        }

        return [
            'disponible'  => true,
            'es_inmueble' => filter_var($lectura['es_inmueble'], FILTER_VALIDATE_BOOLEAN),
            'categoria'   => $categoria,
            'motivo'      => mb_substr(trim((string) ($lectura['motivo'] ?? '')), 0, 120),
        ];
    }

    /* ------------------------------------------------------------------
       Lo que se le pide a la IA
       ------------------------------------------------------------------ */

    private static function instrucciones(): string
    {
        return 'Eres un revisor de fotos para un portal inmobiliario de Colombia. '
            . 'Recibes una foto que alguien quiere subir a la publicación de un inmueble y decides si '
            . 'realmente muestra un inmueble. Respondes SOLO con un objeto JSON, sin texto antes ni después, '
            . 'sin bloques de código.';
    }

    private static function pedido(): string
    {
        return "Los inmuebles del portal son: casa, apartamento, finca, local, lote y oficina.\n\n"
            . "ACEPTA (es_inmueble = true) fotos donde el protagonista es el inmueble o su entorno: "
            . "fachada, exterior, interior (sala, cocina, baño, habitación, comedor, estudio, bodega, parqueadero), "
            . "terraza, balcón, patio, jardín, piscina, zonas comunes, vista del edificio o del conjunto, "
            . "terreno o lote (aunque sea solo pasto o tierra), cultivos o instalaciones de una finca, "
            . "y planos o renders del inmueble. Un inmueble vacío o con muebles también es válido.\n\n"
            . "RECHAZA (es_inmueble = false) lo que no es un inmueble: selfies o fotos donde el protagonista es una persona, "
            . "animales o mascotas, comida, vehículos, objetos sueltos, memes, dibujos o logos sin relación, "
            . "capturas de pantalla, documentos, pantallas de celular o computador, y cualquier contenido sexual o violento.\n\n"
            . "Responde con este JSON exacto:\n"
            . "{\n"
            . '  "es_inmueble": true o false,' . "\n"
            . '  "categoria": "casa" | "apartamento" | "finca" | "local" | "lote" | "oficina" | "otro",' . "\n"
            . '  "motivo": "una frase corta en español que diga qué se ve en la foto"' . "\n"
            . "}\n\n"
            . 'Si dudas entre aceptar y rechazar una foto que sí podría ser de un inmueble, acéptala. '
            . 'No inventes lo que no se vea en la imagen.';
    }

    /* ------------------------------------------------------------------
       Utilidades
       ------------------------------------------------------------------ */

    /**
     * Reduce la foto (si GD está disponible) para enviarla más rápido. DeepSeek cobra un máximo
     * fijo por imagen sin importar su tamaño, así que reducirla no pierde precisión.
     * Si algo falla, se devuelve la foto original.
     *
     * @return array{0: string, 1: string}  [bytes, mime]
     */
    private static function reducir(string $contenido, string $mime): array
    {
        if ($mime === 'image/gif' || ! function_exists('imagecreatefromstring') || ! function_exists('imagescale')) {
            return [$contenido, $mime];
        }

        try {
            $imagen = @imagecreatefromstring($contenido);
            if (! $imagen) {
                return [$contenido, $mime];
            }

            $ancho = imagesx($imagen);
            $alto = imagesy($imagen);
            $lado = max($ancho, $alto);
            if ($lado <= self::LADO_MAXIMO) {
                return [$contenido, $mime];
            }

            $escala = self::LADO_MAXIMO / $lado;
            $chica = imagescale($imagen, max(1, (int) round($ancho * $escala)), max(1, (int) round($alto * $escala)));
            if (! $chica) {
                return [$contenido, $mime];
            }

            ob_start();
            imagejpeg($chica, null, 80);
            $jpg = (string) ob_get_clean();

            return $jpg !== '' ? [$jpg, 'image/jpeg'] : [$contenido, $mime];
        } catch (Throwable $e) {
            return [$contenido, $mime];
        }
    }

    private static function noDisponible(string $motivo): array
    {
        return ['disponible' => false, 'es_inmueble' => null, 'categoria' => null, 'motivo' => $motivo];
    }
}