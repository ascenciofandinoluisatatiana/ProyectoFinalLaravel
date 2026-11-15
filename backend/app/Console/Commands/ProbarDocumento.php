<?php

namespace App\Console\Commands;

use App\Services\DeepSeekDocumentoService;
use Illuminate\Console\Command;

/**
 * Prueba la lectura de un documento con DeepSeek, sin tocar cuentas ni la base de datos.
 *
 *   php artisan umbral:probar-documento storage/app/private/pruebas/muestra_clara.png --numero=1020304050 --nombre="Maria Camila Garcia Lopez"
 *   php artisan umbral:probar-documento storage/app/private/pruebas/muestra_rut.png --tipo=inmobiliaria --numero=900123456-7 --nombre="Inmobiliaria Ejemplo SAS" --representante="Carlos Andres Rojas"
 */
class ProbarDocumento extends Command
{
    protected $signature = 'umbral:probar-documento
                            {archivo : Ruta de la foto (desde la carpeta backend)}
                            {--tipo=persona : persona o inmobiliaria}
                            {--numero= : Número de cédula o NIT que se "escribió" en el formulario}
                            {--nombre= : Nombre completo o razón social "escrito" en el formulario}
                            {--representante= : Representante legal (solo inmobiliaria)}';

    protected $description = 'Prueba la lectura de un documento de identidad con DeepSeek (no guarda nada)';

    private const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

    public function handle(): int
    {
        $ruta = (string) $this->argument('archivo');
        if (! is_file($ruta)) {
            $this->error("No encuentro el archivo: {$ruta}");
            return self::FAILURE;
        }

        $info = @getimagesize($ruta);
        if ($info === false || ! in_array($info['mime'] ?? '', self::TIPOS, true)) {
            $this->error('El archivo no es una imagen JPG, PNG o WebP.');
            return self::FAILURE;
        }
        if (filesize($ruta) > 5 * 1024 * 1024) {
            $this->error('La foto pesa más de 5 MB.');
            return self::FAILURE;
        }

        $this->info('Enviando la foto a DeepSeek...');
        $inicio = microtime(true);

        $resultado = DeepSeekDocumentoService::analizar(file_get_contents($ruta), $info['mime'], [
            'tipo_cuenta'         => $this->option('tipo'),
            'numero_documento'    => (string) $this->option('numero'),
            'nombre'              => (string) $this->option('nombre'),
            'representante_legal' => (string) $this->option('representante'),
        ]);

        $this->line('Tardó ' . round(microtime(true) - $inicio, 1) . ' segundos.');
        $this->newLine();
        $this->line(json_encode($resultado, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return $resultado['disponible'] ? self::SUCCESS : self::FAILURE;
    }
}
