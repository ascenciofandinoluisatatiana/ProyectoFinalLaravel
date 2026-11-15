<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Pasa las fotos antiguas (carpeta local backend/objects) al Object Storage.
 *
 *  - Solo toca las fotos que todavía tienen ruta antigua (propiedades/x.jpg, avatars/x.jpg).
 *  - Cada foto DISTINTA se sube una sola vez; los registros que la comparten (por ejemplo
 *    las propiedades de ejemplo) pasan a apuntar al mismo archivo del bucket.
 *  - Comprueba que quedó completa (peso y huella sha256) y recién entonces cambia la ruta.
 *  - NO borra nada de la carpeta local.
 *  - Se puede correr varias veces: lo que ya se pasó se salta.
 *  - Guarda un reporte JSON con lo que pasó y lo que falló.
 *
 *  php artisan imagenes:migrar --simulacro   (solo cuenta, no sube ni cambia nada)
 *  php artisan imagenes:migrar               (migra de verdad)
 */
class MigrarImagenesAlBucket extends Command
{
    protected $signature = 'imagenes:migrar {--simulacro : Solo cuenta lo que haría, sin subir ni cambiar nada}';

    protected $description = 'Pasa las fotos antiguas (carpeta local) al Object Storage y actualiza sus rutas. No borra nada.';

    private const TIPOS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /** Ruta nueva: propiedades/2026/11/uuid.jpg  o  usuarios/2026/11/uuid.jpg */
    private const RUTA_NUEVA = '#^(propiedades|usuarios)/\d{4}/\d{2}/#';

    public function handle(): int
    {
        $simulacro = (bool) $this->option('simulacro');
        $local = Storage::disk('public');
        $bucket = Storage::disk('imagenes');

        $fuentes = [
            ['tabla' => 'propiedades', 'columna' => 'imagen', 'categoria' => 'propiedades'],
            ['tabla' => 'propiedad_fotos', 'columna' => 'ruta', 'categoria' => 'propiedades'],
            ['tabla' => 'users', 'columna' => 'avatar', 'categoria' => 'usuarios'],
        ];

        $reporte = [
            'inicio' => now()->toIso8601String(),
            'simulacro' => $simulacro,
            'migradas' => [],
            'saltadas' => [],
            'fallidas' => [],
        ];

        // Fotos ya subidas en esta corrida: ruta antigua => datos del archivo en el bucket
        $subidas = [];
        // Fotos que no se pudieron subir: ruta antigua => motivo (no se reintenta por cada registro)
        $falladas = [];

        $this->info($simulacro ? 'SIMULACRO: no se sube ni se cambia nada.' : 'Migrando fotos al Object Storage...');

        foreach ($fuentes as $fuente) {
            $tabla = $fuente['tabla'];
            $columna = $fuente['columna'];

            $filas = DB::table($tabla)->whereNotNull($columna)->where($columna, '<>', '')->orderBy('id')->get(['id', $columna]);

            foreach ($filas as $fila) {
                $ruta = (string) $fila->{$columna};
                $ref = ['tabla' => $tabla, 'id' => $fila->id, 'ruta' => $ruta];

                // Imágenes de ejemplo del frontend o enlaces externos
                if (str_starts_with($ruta, '/') || str_starts_with($ruta, 'http')) {
                    $reporte['saltadas'][] = $ref + ['motivo' => 'imagen de ejemplo o enlace externo'];
                    continue;
                }
                // Ya está en el bucket
                if (preg_match(self::RUTA_NUEVA, $ruta)) {
                    $reporte['saltadas'][] = $ref + ['motivo' => 'ya está en el bucket'];
                    continue;
                }
                if (isset($falladas[$ruta])) {
                    $reporte['fallidas'][] = $ref + ['motivo' => $falladas[$ruta]];
                    continue;
                }

                // --- Subir la foto (solo la primera vez que aparece esa ruta antigua) ---
                if (! isset($subidas[$ruta])) {
                    if (str_contains($ruta, '..') || ! $local->exists($ruta)) {
                        $falladas[$ruta] = 'el archivo no existe en la carpeta local';
                        $reporte['fallidas'][] = $ref + ['motivo' => $falladas[$ruta]];
                        continue;
                    }

                    $origen = $local->path($ruta);
                    $peso = (int) filesize($origen);
                    $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($origen);
                    $extension = self::TIPOS[$mime] ?? null;
                    if ($peso <= 0 || $extension === null) {
                        $falladas[$ruta] = 'no es una imagen JPG, PNG o WebP válida';
                        $reporte['fallidas'][] = $ref + ['motivo' => $falladas[$ruta]];
                        continue;
                    }

                    $clave = sprintf('%s/%s/%s/%s.%s', $fuente['categoria'], now()->format('Y'), now()->format('m'), (string) Str::uuid(), $extension);

                    if (! $simulacro) {
                        $puesta = false;
                        try {
                            $flujo = fopen($origen, 'rb');
                            $bucket->put($clave, $flujo);
                            if (is_resource($flujo)) {
                                fclose($flujo);
                            }
                            $puesta = true;

                            // Se comprueba que quedó completa: mismo peso y misma huella
                            if ($bucket->size($clave) !== $peso || $this->huellaBucket($bucket, $clave) !== hash_file('sha256', $origen)) {
                                throw new \RuntimeException('la copia en el bucket no coincide con el original');
                            }
                        } catch (Throwable $e) {
                            if ($puesta) {
                                $this->borrarSilencioso($bucket, $clave);
                            }
                            $falladas[$ruta] = $e->getMessage();
                            $reporte['fallidas'][] = $ref + ['motivo' => $falladas[$ruta]];
                            continue;
                        }
                    }

                    $subidas[$ruta] = ['clave' => $clave, 'peso' => $peso, 'mime' => $mime, 'usos' => 0];
                }

                $foto = $subidas[$ruta];

                if ($simulacro) {
                    $subidas[$ruta]['usos']++;
                    $reporte['migradas'][] = $ref + ['a' => $foto['clave'], 'peso' => $foto['peso'], 'nota' => 'se migraría'];
                    continue;
                }

                // --- Cambiar la ruta en la base de datos ---
                try {
                    $cambios = [$columna => $foto['clave']];
                    $meta = ['nombre_original' => basename($ruta), 'peso' => $foto['peso'], 'mime' => $foto['mime'], 'disco' => 'imagenes'];
                    if ($tabla === 'propiedades') {
                        $cambios['imagen_meta'] = json_encode($meta);
                    } elseif ($tabla === 'propiedad_fotos') {
                        $cambios += $meta;
                    }

                    // Solo cambia si la ruta sigue siendo la antigua (por si alguien la editó mientras tanto)
                    $filasCambiadas = DB::table($tabla)->where('id', $fila->id)->where($columna, $ruta)->update($cambios);
                    if ($filasCambiadas !== 1) {
                        throw new \RuntimeException('el registro cambió mientras se migraba');
                    }

                    $subidas[$ruta]['usos']++;
                    $reporte['migradas'][] = $ref + ['a' => $foto['clave'], 'peso' => $foto['peso']];
                } catch (Throwable $e) {
                    $reporte['fallidas'][] = $ref + ['motivo' => $e->getMessage()];
                    // Si ningún registro llegó a usar este archivo, no se deja huérfano en el bucket
                    if ($subidas[$ruta]['usos'] === 0) {
                        $this->borrarSilencioso($bucket, $foto['clave']);
                        unset($subidas[$ruta]);
                    }
                }
            }
        }

        $reporte['fin'] = now()->toIso8601String();
        $reporte['resumen'] = [
            'registros_migrados' => count($reporte['migradas']),
            'fotos_distintas_subidas' => count($subidas),
            'saltadas' => count($reporte['saltadas']),
            'fallidas' => count($reporte['fallidas']),
        ];

        $archivo = 'reportes/migracion-imagenes-' . now()->format('Ymd-His') . '.json';
        Storage::disk('local')->put($archivo, json_encode($reporte, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $this->newLine();
        $this->table(['Resultado', 'Cantidad'], [
            [$simulacro ? 'Registros que se migrarían' : 'Registros migrados', $reporte['resumen']['registros_migrados']],
            [$simulacro ? 'Fotos distintas que se subirían' : 'Fotos distintas subidas', $reporte['resumen']['fotos_distintas_subidas']],
            ['Saltadas (ejemplo o ya en el bucket)', $reporte['resumen']['saltadas']],
            ['Fallidas', $reporte['resumen']['fallidas']],
        ]);
        foreach (array_slice($reporte['fallidas'], 0, 20) as $f) {
            $this->warn("  {$f['tabla']} #{$f['id']} {$f['ruta']} → {$f['motivo']}");
        }
        $this->line('Reporte guardado en: storage/app/private/' . $archivo);
        $this->line('No se borró ningún archivo de la carpeta local.');

        return $reporte['resumen']['fallidas'] > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function borrarSilencioso($disco, string $clave): void
    {
        try {
            $disco->delete($clave);
        } catch (Throwable $ignorado) {
            // no se detiene el proceso
        }
    }

    /** Huella sha256 del archivo tal como quedó en el bucket (se lee por partes). */
    private function huellaBucket($disco, string $clave): ?string
    {
        $flujo = $disco->readStream($clave);
        if (! is_resource($flujo)) {
            return null;
        }
        $contexto = hash_init('sha256');
        while (! feof($flujo)) {
            $trozo = fread($flujo, 1048576);
            if ($trozo === false) {
                break;
            }
            hash_update($contexto, $trozo);
        }
        fclose($flujo);

        return hash_final($contexto);
    }
}
