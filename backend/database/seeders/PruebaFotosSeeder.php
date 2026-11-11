<?php

namespace Database\Seeders;

use App\Models\Propiedad;
use App\Models\PropiedadFoto;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * PRUEBA: crea 12 publicaciones con fotos reales para verlas en localhost.
 * Todas llevan "PRUEBA" al inicio de la dirección y "PRUEBA" en referencia_pago de su membresía,
 * así se borran fácil con QuitarPruebaFotosSeeder.
 *
 *   php artisan db:seed --class=PruebaFotosSeeder
 */
class PruebaFotosSeeder extends Seeder
{
    /** Carpeta de fotos (backend/objects/propiedades/umbral/<tipo>/*.jpg) */
    private function fotos(string $carpeta): array
    {
        $base = base_path('objects/propiedades/umbral/' . $carpeta);
        $lista = glob($base . '/*.jpg') ?: [];
        sort($lista);

        return array_map(fn ($f) => 'propiedades/umbral/' . $carpeta . '/' . basename($f), $lista);
    }

    public function run(): void
    {
        $fotos = [
            'apartamento' => $this->fotos('apartamento'),
            'interior' => $this->fotos('interior'),
            'oficina' => $this->fotos('oficina'),
            'finca' => $this->fotos('finca'),
            'lote' => $this->fotos('lote'),
        ];
        foreach ($fotos as $c => $l) {
            if (! $l) {
                $this->command->error("No hay fotos en backend/objects/propiedades/umbral/{$c}. Copia primero la carpeta 'umbral'.");

                return;
            }
        }

        $inmo = User::whereHas('role', fn ($q) => $q->where('nombre', 'inmobiliaria'))->where('estado', 'activo')->whereNull('inmobiliaria_id')->orderBy('id')->first();
        $vend = User::whereHas('role', fn ($q) => $q->where('nombre', 'vendedor'))->where('estado', 'activo')->orderBy('id')->first();
        if (! $inmo || ! $vend) {
            $this->command->error('Hace falta una cuenta activa de inmobiliaria y una de vendedor.');

            return;
        }

        // tipo, operación, precio, DANE, barrio, dirección, lat, lng, hab, baños, parq, área, estrato, quien, membresía (null | semanal | quincenal | mensual)
        $props = [
            ['apartamento', 'venta',    420000000, '11001', 'Chapinero',   'Cl 63 # 9-30',          4.6533, -74.0626, 3, 2, 1, 88,  5, 'i', 'mensual'],
            ['apartamento', 'arriendo',   3200000, '05001', 'Laureles',    'Cir. 4 # 70-15',        6.2442, -75.5900, 2, 2, 1, 70,  4, 'i', 'quincenal'],
            ['apartamento', 'venta',    610000000, '13001', 'Bocagrande',  'Av. San Martín # 7-120', 10.4010, -75.5560, 3, 3, 2, 120, 6, 'i', null],
            ['casa',        'venta',    980000000, '76001', 'Ciudad Jardín', 'Cl 14 # 98-40',       3.3500, -76.5350, 4, 3, 2, 240, 5, 'i', 'semanal'],
            ['casa',        'arriendo',   5200000, '68001', 'Cabecera',    'Cra 33 # 52-10',        7.1190, -73.1100, 4, 3, 2, 210, 5, 'v', null],
            ['casa',        'venta',    750000000, '08001', 'Alto Prado',  'Cl 79 # 56-20',        11.0000, -74.8100, 3, 3, 2, 180, 6, 'v', null],
            ['finca',       'venta',   1900000000, '05615', 'Llanogrande', 'Km 4 vía Las Palmas',   6.1300, -75.4200, 5, 4, 6, 2500, 6, 'v', 'mensual'],
            ['finca',       'venta',   1350000000, '05001', 'Santa Elena', 'Vereda Mazo, Km 3',     6.2200, -75.5000, 4, 3, 4, 3200, 5, 'v', null],
            ['lote',        'venta',    380000000, '47001', 'El Rodadero', 'Vía al Rodadero Km 2',  11.2000, -74.2300, 0, 0, 0, 600, null, 'v', 'semanal'],
            ['lote',        'venta',    240000000, '05615', 'Llanogrande', 'Vereda Chipre, lote 7',  6.1400, -75.4300, 0, 0, 0, 1000, null, 'v', null],
            ['oficina',     'arriendo',   6800000, '11001', 'Usaquén',     'Cra 6 # 119-25',        4.7110, -74.0300, 0, 2, 2, 95,  5, 'i', 'quincenal'],
            ['oficina',     'venta',    530000000, '05001', 'El Poblado',  'Cl 10 # 43D-50',        6.2086, -75.5659, 0, 2, 2, 110, 6, 'i', null],
        ];

        $conCar = ['balcon', 'porteria', 'ascensor', 'gas_natural', 'internet', 'jardin', 'piscina', 'zona_bbq', 'terraza', 'deposito'];

        foreach ($props as $n => [$tipo, $op, $precio, $dane, $barrio, $dir, $lat, $lng, $hab, $ban, $par, $area, $est, $quien, $plan]) {
            $ub = DB::table('municipios as m')->join('departamentos as d', 'd.id', '=', 'm.departamento_id')
                ->where('m.codigo_dane', $dane)->first(['m.nombre as ciudad', 'd.nombre as departamento']);
            if (! $ub) {
                $this->command->error("No existe el municipio {$dane}.");
                continue;
            }

            // Fotos: la principal según el tipo; las demás mezcladas sin repetir
            $principales = match ($tipo) {
                'apartamento' => $fotos['apartamento'],
                'casa' => $fotos['finca'],
                'finca' => $fotos['finca'],
                'lote' => array_merge($fotos['lote'], $fotos['finca']),
                'oficina' => $fotos['oficina'],
            };
            $extras = match ($tipo) {
                'apartamento' => array_merge($fotos['apartamento'], $fotos['interior']),
                'casa' => array_merge($fotos['interior'], $fotos['finca']),
                'finca' => $fotos['finca'],
                'lote' => array_merge($fotos['lote'], $fotos['finca']),
                'oficina' => array_merge($fotos['oficina'], $fotos['interior']),
            };
            mt_srand(1000 + $n);                        // mismo resultado cada vez
            $principal = $principales[array_rand($principales)];
            $otras = array_values(array_diff($extras, [$principal]));
            shuffle($otras);
            $otras = array_slice($otras, 0, mt_rand(4, 6));

            $dueno = $quien === 'i' ? $inmo : $vend;
            $car = array_slice($conCar, 0, mt_rand(3, 6));

            $p = Propiedad::updateOrCreate(['direccion' => 'PRUEBA ' . $dir], [
                'user_id' => $dueno->id, 'tipo' => $tipo, 'operacion' => $op, 'precio' => $precio,
                'departamento' => $ub->departamento, 'ciudad' => $ub->ciudad, 'barrio' => $barrio,
                'lat' => $lat, 'lng' => $lng, 'habitaciones' => $hab, 'banos' => $ban, 'parqueaderos' => $par,
                'area' => $area, 'estrato' => $est, 'estado' => 'publicada', 'verificada' => true,
                'imagen' => $principal,
                'descripcion' => 'PRUEBA. ' . ucfirst($tipo) . ' en ' . $op . ' en ' . $barrio . ', ' . $ub->ciudad . '. Texto de ejemplo para revisar cómo se ve la ficha con sus fotos.',
                'caracteristicas' => $car,
            ]);

            PropiedadFoto::where('propiedad_id', $p->id)->delete();
            foreach ($otras as $i => $ruta) {
                PropiedadFoto::create(['propiedad_id' => $p->id, 'ruta' => $ruta, 'orden' => $i + 1]);
            }

            DB::table('membresias')->where('propiedad_id', $p->id)->where('referencia_pago', 'PRUEBA')->delete();
            if ($plan) {
                $dias = ['semanal' => 7, 'quincenal' => 15, 'mensual' => 30][$plan];
                DB::table('membresias')->insert([
                    'user_id' => $dueno->id, 'propiedad_id' => $p->id, 'plan' => $plan, 'precio' => 0,
                    'estado' => 'activa', 'fecha_inicio' => now()->toDateString(),
                    'fecha_fin' => now()->addDays($dias)->toDateString(),
                    'referencia_pago' => 'PRUEBA', 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        $this->command->info('Listo: 12 publicaciones de PRUEBA creadas.');
    }
}
