<?php

namespace Database\Seeders;

use App\Models\Propiedad;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Deshace Fase2UmbralSeeder: borra los contactos, visitas, pagos, calificaciones, comisiones y movimientos
 * de ejemplo, y vuelve a publicar las propiedades que se habían cerrado. Las cuentas y publicaciones se quedan.
 *
 *   php artisan db:seed --class=QuitarFase2UmbralSeeder
 */
class QuitarFase2UmbralSeeder extends Seeder
{
    public function run(): void
    {
        $duenos = Fase2UmbralSeeder::duenosIds();
        $props = DB::table('propiedades')->whereIn('user_id', $duenos)->pluck('id')->all();

        DB::transaction(function () use ($duenos, $props) {
            // Cierres: las propiedades vuelven a estar publicadas (con Eloquent, para sincronizar la publicación)
            $cerradas = DB::table('comisiones')->whereIn('inmobiliaria_id', $duenos)->pluck('propiedad_id')->filter()->all();
            foreach (array_chunk($cerradas, 200) as $lote) {
                foreach (Propiedad::whereIn('id', $lote)->get() as $p) {
                    $p->estado = 'publicada';
                    $p->forceFill(['cerrada_en' => null])->save();
                }
            }
            DB::table('comisiones')->whereIn('inmobiliaria_id', $duenos)->delete();

            DB::table('pagos')->where('referencia', 'like', 'UMB-F2-%')->delete();
            DB::table('calificaciones_vendedor')->whereIn('vendedor_id', $duenos)->delete();

            foreach (array_chunk($props, 500) as $lote) {
                DB::table('visitas')->whereIn('propiedad_id', $lote)->delete();
                DB::table('leads')->whereIn('propiedad_id', $lote)->delete();   // su seguimiento se borra con ellos
            }

            DB::table('movimientos')->where(function ($q) {
                foreach (Fase2UmbralSeeder::IPS as $rango) {
                    $q->orWhere('ip', 'like', $rango . '%');
                }
            })->delete();
        });

        $this->command->info('Fase 2 deshecha.');
    }
}
