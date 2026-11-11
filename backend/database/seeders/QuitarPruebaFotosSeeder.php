<?php

namespace Database\Seeders;

use App\Models\Propiedad;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Borra las publicaciones de PRUEBA que creó PruebaFotosSeeder (y sus fotos y membresías).
 *
 *   php artisan db:seed --class=QuitarPruebaFotosSeeder
 */
class QuitarPruebaFotosSeeder extends Seeder
{
    public function run(): void
    {
        $ids = Propiedad::where('direccion', 'like', 'PRUEBA %')->pluck('id')->all();
        DB::table('membresias')->where('referencia_pago', 'PRUEBA')->delete();
        Propiedad::whereIn('id', $ids)->delete();   // fotos, publicaciones y características se borran con ella
        $this->command->info(count($ids) . ' publicaciones de PRUEBA borradas.');
    }
}
