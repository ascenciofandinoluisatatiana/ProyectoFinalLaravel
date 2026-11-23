<?php

namespace Database\Seeders;

use App\Models\Propiedad;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Borra las publicaciones que creó PosicionadasPruebaSeeder (y sus fotos).
 *
 *   php artisan db:seed --class=QuitarPosicionadasPruebaSeeder
 */
class QuitarPosicionadasPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $ids = Propiedad::where('direccion', 'like', 'POSICIONADA PRUEBA %')->pluck('id')->all();
        DB::table('membresias')->whereIn('propiedad_id', $ids)->delete();
        Propiedad::whereIn('id', $ids)->delete();   // fotos y características se borran con ella
        $this->command->info(count($ids) . ' publicaciones POSICIONADAS de PRUEBA borradas.');
    }
}
