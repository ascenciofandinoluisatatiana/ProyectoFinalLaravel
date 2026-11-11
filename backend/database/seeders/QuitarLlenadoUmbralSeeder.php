<?php

namespace Database\Seeders;

use App\Models\Propiedad;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Borra las publicaciones que creó LlenadoUmbralSeeder (con sus fotos y membresías SEED).
 * Las cuentas se quedan.
 *
 *   php artisan db:seed --class=QuitarLlenadoUmbralSeeder
 */
class QuitarLlenadoUmbralSeeder extends Seeder
{
    public function run(): void
    {
        $ids = Propiedad::whereHas('vendedor', fn ($q) => $q->where(
            fn ($w) => $w->where('email', 'like', 'inmobiliaria__@demo.umbral.co')->orWhere('email', 'like', 'vendedor__@demo.umbral.co')->orWhereIn('email', ['gomezoyolajorge12@gmail.com', 'luzenidloaizagonzalez6@gmail.com'])
        ))->pluck('id')->all();

        DB::table('membresias')->where('referencia_pago', 'SEED')->delete();
        foreach (array_chunk($ids, 200) as $lote) {
            Propiedad::whereIn('id', $lote)->delete();   // fotos, publicaciones y características se borran con ella
        }
        $this->command->info(count($ids) . ' publicaciones borradas.');
    }
}
