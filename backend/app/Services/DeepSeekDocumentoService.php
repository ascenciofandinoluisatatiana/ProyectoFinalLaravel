<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Lee con DeepSeek la foto del documento de identidad que sube una persona al registrarse
 * (cédula para personas, RUT para inmobiliarias) y la compara con los datos que escribió.
 *
 * Devuelve SIEMPRE un arreglo con esta forma:
 *   disponible : true si la IA respondió bien; false si falló (sin saldo, caída, tardó demasiado...)
 *   puntaje    : 0 a 100 (null si no estuvo disponible)
 *   motivo     : frase corta en español para mostrar o guardar
 *   detalle    : lo que leyó la IA (tipo detectado, número, nombre, legible, etc.)
 *
 * Si la IA falla, NUNCA se inventa un puntaje: quien la use debe dejar la cuenta pendiente.
 * La clave de DeepSeek vive solo en el .env del backend (DEEPSEEK_API_KEY).
 */
class DeepSeekDocumentoService
{
    /**
     * @param  string  $contenido  Bytes de la imagen (JPG, PNG o WebP)
     * @param  string  $mime       'image/jpeg', 'image/png' o 'image/webp'
     * @param  array   $datos      tipo_cuenta ('persona'|'inmobiliaria'), numero_documento, nombre,
     *                             representante_legal (solo inmobiliaria)
     */
    public static function analizar(string $contenido, string $mime, array $datos): array
    {
        $clave = config('services.deepseek.key');
        if (! $clave) {
            return self::noDisponible('Falta configurar la clave de DeepSeek en el servidor.');
        }

        $esInmobiliaria = ($datos['tipo_cuenta'] ?? 'persona') === 'inmobiliaria';

        try {
            $respuesta = Http::withToken($clave)
                ->acceptJson()
                ->timeout((int) config('services.deepseek.timeout', 30))
                ->post(config('services.deepseek.url'), [
                    'model'       => config('services.deepseek.model'),
                    'temperature' => 0,
                    'max_tokens'  => 700,
                    'messages'    => [
                        ['role' => 'system', 'content' => self::instrucciones()],
                        ['role' => 'user', 'content' => [
                            ['type' => 'text', 'text' => self::pedido($datos, $esInmobiliaria)],
                            ['type' => 'image_url', 'image_url' => ['url' => 'data:' . $mime . ';base64,' . base64_encode($contenido)]],
                        ]],
                    ],
                ]);
        } catch (\Throwable $e) {
            Log::warning('DeepSeek: no respondió', ['error' => mb_substr($e->getMessage(), 0, 200)]);

            return self::noDisponible('No se pudo conectar con la IA o tardó demasiado.');
        }

        if (! $respuesta->successful()) {
            Log::warning('DeepSeek: respuesta con error', [
                'estado' => $respuesta->status(),
                'cuerpo' => mb_substr($respuesta->body(), 0, 300),
            ]);

            return self::noDisponible($respuesta->status() === 402
                ? 'La cuenta de DeepSeek no tiene saldo.'
                : 'La IA respondió con un error (' . $respuesta->status() . ').');
        }

        $lectura = self::extraerJson((string) $respuesta->json('choices.0.message.content'));
        if ($lectura === null) {
            Log::warning('DeepSeek: la respuesta no era JSON', ['cuerpo' => mb_substr($respuesta->body(), 0, 300)]);

            return self::noDisponible('La IA respondió algo que no se pudo entender.');
        }

        return self::resultado($lectura, $datos, $esInmobiliaria);
    }

    /* ------------------------------------------------------------------
       Lo que se le pide a la IA
       ------------------------------------------------------------------ */

    private static function instrucciones(): string
    {
        return "Eres un verificador de documentos de identidad de Colombia para un portal inmobiliario. "
            . "Recibes la foto de un documento y los datos que la persona escribió en un formulario. "
            . "Tu trabajo es mirar la foto con cuidado y decir si es un documento real, si se lee bien "
            . "y si sus datos coinciden con lo escrito. Respondes SOLO con un objeto JSON, sin texto antes ni después, "
            . "sin bloques de código.";
    }

    private static function pedido(array $datos, bool $esInmobiliaria): string
    {
        $esperado = $esInmobiliaria
            ? 'un RUT (Registro Único Tributario) de una empresa colombiana, donde aparecen el NIT y la razón social'
            : 'una cédula de ciudadanía colombiana, por la cara donde aparecen la foto, el nombre y el número';

        $escrito = $esInmobiliaria
            ? "- NIT escrito: " . ($datos['numero_documento'] ?? '') . "\n"
              . "- Razón social escrita: " . ($datos['nombre'] ?? '') . "\n"
              . "- Representante legal escrito: " . ($datos['representante_legal'] ?? '')
            : "- Número de cédula escrito: " . ($datos['numero_documento'] ?? '') . "\n"
              . "- Nombre escrito: " . ($datos['nombre'] ?? '');

        return "La persona debía subir {$esperado}.\n\n"
            . "Datos que escribió en el formulario:\n{$escrito}\n\n"
            . "Mira la imagen y responde con este JSON exacto:\n"
            . "{\n"
            . '  "es_documento": true o false (¿la imagen es el documento esperado y no otra cosa: un paisaje, una captura, un dibujo, una foto cualquiera?),' . "\n"
            . '  "legible": true o false (¿se leen bien los datos o la foto está borrosa, cortada, oscura o con reflejos?),' . "\n"
            . '  "numero_detectado": "el número que se ve en el documento, o null",' . "\n"
            . '  "nombre_detectado": "' . ($esInmobiliaria ? 'la razón social' : 'el nombre completo') . ' que se ve en el documento, o null",' . "\n"
            . '  "nombre_coincide": true o false (compara con lo escrito; ignora tildes, mayúsculas y el orden de apellidos y nombres),' . "\n"
            . '  "senales_de_alteracion": true o false (señales de edición, montaje, letras de distinto tipo, foto de otra pantalla o fotocopia manipulada),' . "\n"
            . '  "puntaje": número de 0 a 100 (qué tan seguro estás de que el documento es auténtico, se lee bien y sus datos coinciden con lo escrito),' . "\n"
            . '  "motivo": "una frase corta en español que explique el puntaje"' . "\n"
            . "}\n\n"
            . "Guía del puntaje: si no es el documento esperado, 20 o menos; si no se lee bien, 40 o menos; "
            . "si el número o el nombre no coinciden, 30 o menos; si hay señales de alteración, 40 o menos; "
            . "si todo está bien, entre 90 y 100. No inventes datos que no se vean en la imagen.";
    }

    /* ------------------------------------------------------------------
       Revisión de lo que respondió la IA (no se confía ciegamente en ella)
       ------------------------------------------------------------------ */

    public static function resultado(array $lectura, array $datos, bool $esInmobiliaria): array
    {
        $esDocumento = (bool) ($lectura['es_documento'] ?? false);
        $legible = (bool) ($lectura['legible'] ?? false);
        $alterado = (bool) ($lectura['senales_de_alteracion'] ?? false);
        $nombreOk = (bool) ($lectura['nombre_coincide'] ?? false);
        $numeroDetectado = isset($lectura['numero_detectado']) ? (string) $lectura['numero_detectado'] : null;

        // El número lo comparamos nosotros, no la IA
        $numeroOk = self::numerosCoinciden((string) ($datos['numero_documento'] ?? ''), $numeroDetectado, $esInmobiliaria);

        $puntaje = (int) round((float) ($lectura['puntaje'] ?? 0));
        $puntaje = max(0, min(100, $puntaje));

        // Topes: aunque la IA se equivoque en el puntaje, un problema grave no puede dar nota alta
        if (! $esDocumento) { $puntaje = min($puntaje, 20); }
        if (! $legible)     { $puntaje = min($puntaje, 40); }
        if (! $numeroOk)    { $puntaje = min($puntaje, 30); }
        if (! $nombreOk)    { $puntaje = min($puntaje, 50); }
        if ($alterado)      { $puntaje = min($puntaje, 40); }

        $motivo = trim((string) ($lectura['motivo'] ?? ''));
        if ($numeroDetectado !== null && ! $numeroOk && stripos($motivo, 'número') === false) {
            $motivo = trim($motivo . ' El número del documento no coincide con el escrito.');
        }

        return [
            'disponible' => true,
            'puntaje'    => $puntaje,
            'motivo'     => $motivo !== '' ? mb_substr($motivo, 0, 250) : 'Sin motivo.',
            'detalle'    => [
                'es_documento'      => $esDocumento,
                'legible'           => $legible,
                'numero_detectado'  => $numeroDetectado,
                'numero_coincide'   => $numeroOk,
                'nombre_detectado'  => isset($lectura['nombre_detectado']) ? (string) $lectura['nombre_detectado'] : null,
                'nombre_coincide'   => $nombreOk,
                'alteracion'        => $alterado,
            ],
        ];
    }

    /**
     * Compara solo los dígitos. En un NIT se acepta que a uno le falte el dígito de verificación
     * (900123456 y 900123456-7 son la misma empresa). En una cédula tiene que ser exacto.
     */
    public static function numerosCoinciden(string $escrito, ?string $detectado, bool $esNit): bool
    {
        if ($detectado === null) {
            return false;
        }

        $a = preg_replace('/\D/', '', $escrito);
        $b = preg_replace('/\D/', '', $detectado);
        if ($a === '' || $b === '') {
            return false;
        }
        if ($a === $b) {
            return true;
        }

        return $esNit
            && abs(strlen($a) - strlen($b)) === 1
            && (str_starts_with($a, $b) || str_starts_with($b, $a))
            && min(strlen($a), strlen($b)) >= 9;
    }

    /** Saca el objeto JSON de la respuesta, aunque venga envuelto en ``` o con texto alrededor. */
    public static function extraerJson(string $texto): ?array
    {
        $texto = trim($texto);
        $inicio = strpos($texto, '{');
        $fin = strrpos($texto, '}');
        if ($inicio === false || $fin === false || $fin <= $inicio) {
            return null;
        }

        $datos = json_decode(substr($texto, $inicio, $fin - $inicio + 1), true);

        return is_array($datos) ? $datos : null;
    }

    private static function noDisponible(string $motivo): array
    {
        return ['disponible' => false, 'puntaje' => null, 'motivo' => $motivo, 'detalle' => null];
    }
}
