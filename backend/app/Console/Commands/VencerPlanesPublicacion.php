<?php

namespace App\Console\Commands;

use App\Models\Membresia;
use App\Models\Propiedad;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Vence los planes nuevos de publicación (corre cada hora):
 *  - Publicación normal por tiempo: al pasar "publicada_hasta" la propiedad vuelve a borrador
 *    y queda "en espera de pago" (así le sale el botón "Pagar y publicar" para renovar).
 *  - Posicionamiento: al pasar "posicionada_hasta" se quita el posicionamiento.
 *  - Una propiedad con Oro, Plata o Bronce vigente NO vuelve a borrador (esa membresía la mantiene).
 *
 *  php artisan propiedades:vencer-planes              (el que corre cada hora)
 *  php artisan propiedades:vencer-planes --solo-ver   (lista lo que haría, sin guardar nada)
 */
class VencerPlanesPublicacion extends Command
{
    protected $signature = 'propiedades:vencer-planes {--solo-ver : Solo lista lo que haría, sin guardar nada}';

    protected $description = 'Vuelve a borrador las publicaciones normales vencidas y quita el posicionamiento vencido.';

    private const ZONA = 'America/Bogota';

    public function handle(): int
    {
        $soloVer = (bool) $this->option('solo-ver');
        $ahora = Carbon::now();
        $hoy = Carbon::now(self::ZONA)->toDateString();
        $aBorrador = 0;
        $sinPosicion = 0;

        // 1. Publicaciones normales vencidas
        $vencidas = Propiedad::where('estado', 'publicada')
            ->whereNotNull('publicada_hasta')
            ->where('publicada_hasta', '<=', $ahora)
            ->get();

        foreach ($vencidas as $propiedad) {
            $conMembresia = Membresia::where('propiedad_id', $propiedad->id)->where('estado', 'activa')
                ->whereDate('fecha_fin', '>=', $hoy)->exists();

            if ($conMembresia) {
                $this->line('#' . $propiedad->id . ': sigue publicada (tiene membresía vigente).');
                if (! $soloVer) {
                    $propiedad->update(['publicada_hasta' => null]);
                }
                continue;
            }

            $this->line('#' . $propiedad->id . ': vuelve a borrador (venció ' . $propiedad->publicada_hasta . ').');
            $aBorrador++;
            if (! $soloVer) {
                $propiedad->update([
                    'estado' => 'borrador',
                    'en_espera_pago' => true,
                    'publicada_hasta' => null,
                    'posicionada_hasta' => null,
                ]);
            }
        }

        // 2. Posicionamientos vencidos
        $posVencidas = Propiedad::whereNotNull('posicionada_hasta')
            ->where('posicionada_hasta', '<=', $ahora)
            ->get();

        foreach ($posVencidas as $propiedad) {
            $this->line('#' . $propiedad->id . ': se quita el posicionamiento (venció ' . $propiedad->posicionada_hasta . ').');
            $sinPosicion++;
            if (! $soloVer) {
                $propiedad->update(['posicionada_hasta' => null]);
            }
        }

        $this->info(($soloVer ? '[Solo ver] ' : '') . 'Vuelven a borrador: ' . $aBorrador . '. Sin posicionamiento: ' . $sinPosicion . '.');
        if (! $soloVer && ($aBorrador || $sinPosicion)) {
            Log::info('Planes de publicación vencidos', ['a_borrador' => $aBorrador, 'sin_posicion' => $sinPosicion]);
        }

        return self::SUCCESS;
    }
}
