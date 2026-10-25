<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Palabra guardada en propiedades.caracteristicas => nombre en la lista fija.
     */
    private array $nombres = [
        'ascensor' => 'Ascensor',
        'balcon' => 'Balcón',
        'chimenea' => 'Chimenea',
        'deposito' => 'Depósito',
        'gas_natural' => 'Gas natural',
        'gimnasio' => 'Gimnasio',
        'internet' => 'Internet',
        'jardin' => 'Jardín',
        'mascotas' => 'Mascotas',
        'parque_infantil' => 'Parque infantil',
        'piscina' => 'Piscina',
        'porteria' => 'Portería',
        'salon_comunal' => 'Salón comunal',
        'terraza' => 'Terraza',
        'zona_bbq' => 'Zona BBQ',
    ];

    /**
     * Copia las características de cada propiedad (hoy guardadas como
     * texto JSON) a la tabla propiedad_caracteristica.
     * La columna original no se modifica.
     */
    public function up(): void
    {
        // nombre en la lista fija => id
        $ids = DB::table('caracteristicas')->pluck('id', 'nombre')->all();

        $propiedades = DB::table('propiedades')
            ->whereNotNull('caracteristicas')
            ->get(['id', 'caracteristicas']);

        foreach ($propiedades as $propiedad) {
            $palabras = json_decode($propiedad->caracteristicas, true);

            if (! is_array($palabras)) {
                continue;
            }

            foreach (array_unique($palabras) as $palabra) {
                $nombre = $this->nombres[$palabra] ?? null;

                // Palabras que no están en la lista fija se omiten
                if ($nombre === null || ! isset($ids[$nombre])) {
                    continue;
                }

                DB::table('propiedad_caracteristica')->insertOrIgnore([
                    'propiedad_id' => $propiedad->id,
                    'caracteristica_id' => $ids[$nombre],
                ]);
            }
        }
    }

    public function down(): void
    {
        // La tabla estaba vacía antes de esta migración
        DB::table('propiedad_caracteristica')->delete();
    }
};