<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Fotos de propiedades y de perfil en el Object Storage (disco "imagenes").
 *
 * - Revisa el tipo REAL del archivo (no solo la extensión), el peso y que sea una imagen.
 * - Guarda con nombre único (UUID): {categoria}/{año}/{mes}/{uuid}.{ext}
 * - En la base de datos se guarda SOLO esa clave (el prefijo del proyecto lo pone el disco).
 * - Si el bucket falla o se demora, avisa con un mensaje claro y no deja nada a medias.
 */
class ImagenService
{
    public const DISCO = 'imagenes';

    public const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

    private const TIPOS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    private const CATEGORIAS = ['propiedades', 'usuarios'];

    /**
     * Sube la imagen y devuelve ['ruta', 'nombre_original', 'peso', 'mime', 'disco'].
     * Si algo falla lanza ValidationException sobre el campo indicado.
     */
    public function subir(UploadedFile $archivo, string $categoria, string $campo = 'foto'): array
    {
        if (! in_array($categoria, self::CATEGORIAS, true)) {
            throw new \InvalidArgumentException('Categoría de imagen no permitida.');
        }

        $origen = $archivo->getRealPath();
        if (! $archivo->isValid() || ! $origen || ! is_file($origen)) {
            $this->fallar($campo, 'No se pudo recibir el archivo. Intenta de nuevo.');
        }

        $peso = (int) filesize($origen);
        if ($peso <= 0) {
            $this->fallar($campo, 'El archivo está vacío.');
        }
        if ($peso > self::MAX_BYTES) {
            $this->fallar($campo, 'La foto no puede superar 4 MB.');
        }

        // Tipo real por el contenido del archivo (si lo renombraron, no pasa)
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($origen);
        $extension = self::TIPOS[$mime] ?? null;
        if ($extension === null || @getimagesize($origen) === false) {
            $this->fallar($campo, 'La foto debe ser una imagen JPG, PNG o WebP válida.');
        }

        $clave = sprintf('%s/%s/%s/%s.%s', $categoria, now()->format('Y'), now()->format('m'), (string) Str::uuid(), $extension);

        $flujo = null;
        try {
            $flujo = fopen($origen, 'rb');
            $guardado = Storage::disk(self::DISCO)->put($clave, $flujo);
            if ($guardado === false) {
                throw new \RuntimeException('El almacenamiento no confirmó el guardado.');
            }
        } catch (Throwable $e) {
            Log::error('No se pudo subir la imagen al Object Storage', ['clave' => $clave, 'error' => $e->getMessage()]);
            $this->fallar($campo, 'No pudimos guardar la foto en este momento. Intenta de nuevo en unos minutos.');
        } finally {
            if (is_resource($flujo)) {
                fclose($flujo);
            }
        }

        return [
            'ruta' => $clave,
            'nombre_original' => $this->limpiarNombre($archivo->getClientOriginalName()),
            'peso' => $peso,
            'mime' => $mime,
            'disco' => self::DISCO,
        ];
    }

    /**
     * Borra una imagen del bucket (y del disco local si todavía es una foto antigua).
     * No toca las imágenes de ejemplo del frontend (rutas que empiezan por / o http).
     * Un fallo al borrar no rompe la operación: queda en el registro de errores.
     */
    public function borrar(?string $ruta): void
    {
        if (! $ruta || str_starts_with($ruta, '/') || str_starts_with($ruta, 'http') || str_contains($ruta, '..')) {
            return;
        }

        try {
            Storage::disk(self::DISCO)->delete($ruta);
        } catch (Throwable $e) {
            Log::warning('No se pudo borrar la imagen del Object Storage', ['ruta' => $ruta, 'error' => $e->getMessage()]);
        }

        // Fotos antiguas que aún estén en el disco local (antes de la migración)
        Storage::disk('public')->delete($ruta);
    }

    /** Datos de la imagen para guardar junto a la clave. */
    public function metadatos(array $subida): array
    {
        return [
            'nombre_original' => $subida['nombre_original'],
            'peso' => $subida['peso'],
            'mime' => $subida['mime'],
            'disco' => $subida['disco'],
        ];
    }

    private function limpiarNombre(?string $nombre): string
    {
        $limpio = preg_replace('/[^\p{L}\p{N}\s._-]/u', '', (string) $nombre) ?? '';

        return Str::limit(trim($limpio) !== '' ? trim($limpio) : 'imagen', 200, '');
    }

    private function fallar(string $campo, string $mensaje): never
    {
        throw ValidationException::withMessages([$campo => $mensaje]);
    }
}
