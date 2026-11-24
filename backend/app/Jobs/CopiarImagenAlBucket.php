<?php

namespace App\Jobs;

use App\Services\ImagenService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * S9 (fotos lentas): trabajo de segundo plano.
 *
 * ImagenService guarda la foto primero en el disco local ("public", carpeta objects/) para
 * responder rápido. Este trabajo la copia después al bucket (disco "imagenes") y borra la copia
 * local. Mientras tanto la foto se ve igual: la ruta /storage/{ruta} busca primero en el disco
 * local y solo después en el bucket.
 *
 * Si el bucket falla, se reintenta varias veces; si sigue fallando, la foto queda en el disco
 * local (se sigue viendo) y el error queda en el registro.
 */
class CopiarImagenAlBucket implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 5;

    public int $timeout = 90;

    /** Segundos de espera entre reintentos. */
    public array $backoff = [10, 30, 60, 120];

    public function __construct(public string $clave)
    {
    }

    public function handle(): void
    {
        $local = Storage::disk('public');

        // Si ya no está (la propiedad se borró o ya se copió), no hay nada que hacer
        if (! $local->exists($this->clave)) {
            return;
        }

        $flujo = $local->readStream($this->clave);
        try {
            $guardado = Storage::disk(ImagenService::DISCO)->put($this->clave, $flujo);
            if ($guardado === false) {
                throw new \RuntimeException('El almacenamiento no confirmó el guardado.');
            }
        } finally {
            if (is_resource($flujo)) {
                fclose($flujo);
            }
        }

        // Solo se borra la copia local cuando el bucket ya la tiene
        $local->delete($this->clave);
    }

    public function failed(Throwable $e): void
    {
        Log::error('No se pudo copiar la foto al bucket (queda en el disco local)', [
            'clave' => $this->clave,
            'error' => mb_substr($e->getMessage(), 0, 200),
        ]);
    }
}
