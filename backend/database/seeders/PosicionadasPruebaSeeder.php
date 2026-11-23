<?php

namespace Database\Seeders;

use App\Models\Propiedad;
use App\Models\PropiedadFoto;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * PRUEBA: 10 publicaciones NORMALES con posicionamiento pagado vigente (el grupo "Posicionadas"
 * del Inicio y del Invitado: ni Oro, ni Plata, ni Bronce) del vendedor de prueba.
 *
 * - No llevan membresía (así no suben a Oro/Plata/Bronce): solo tienen posicionada_hasta en el futuro.
 * - Todas empiezan con "POSICIONADA PRUEBA" en la dirección; se borran con QuitarPosicionadasPruebaSeeder.
 * - Se pueden correr varias veces: no duplican (usan updateOrCreate por dirección).
 *
 *   php artisan db:seed --class=PosicionadasPruebaSeeder
 */
class PosicionadasPruebaSeeder extends Seeder
{
    /** Fotos de backend/objects/propiedades/umbral/<carpeta>/*.jpg */
    private function fotos(string $carpeta): array
    {
        $lista = glob(base_path('objects/propiedades/umbral/' . $carpeta) . '/*.jpg') ?: [];
        sort($lista);

        return array_map(fn ($f) => 'propiedades/umbral/' . $carpeta . '/' . basename($f), $lista);
    }

    public function run(): void
    {
        $vend = User::where('email', 'vendedor@umbral.test')->where('estado', 'activo')->first();
        if (! $vend) {
            $this->command->error('No existe el vendedor de prueba (vendedor@umbral.test). Corre antes: php artisan db:seed --class=UsuariosPruebaSeeder');

            return;
        }

        $fotos = [];
        foreach (['apartamento', 'interior', 'oficina', 'finca', 'lote'] as $c) {
            $fotos[$c] = $this->fotos($c);
            if (! $fotos[$c]) {
                $this->command->error("No hay fotos en backend/objects/propiedades/umbral/{$c}.");

                return;
            }
        }

        // tipo, operación, precio, DANE, barrio, dirección, lat, lng, hab, baños, parq, área, estrato, días de posicionamiento que le quedan
        $props = [
            ['apartamento', 'venta',    355000000, '11001', 'Cedritos',     'Cra 13 # 147-20',      4.7270, -74.0390, 3, 2, 1, 82,  4, 20],
            ['apartamento', 'arriendo',   2400000, '05001', 'Belén',        'Cl 30A # 76-40',       6.2300, -75.6000, 2, 1, 1, 58,  3, 12],
            ['casa',        'venta',    690000000, '76001', 'Pance',        'Cl 18 # 118-30',       3.3200, -76.5400, 4, 3, 2, 210, 5, 25],
            ['casa',        'arriendo',   4300000, '68001', 'Cañaveral',    'Cra 25 # 31-15',       7.0900, -73.1000, 3, 2, 2, 150, 4, 9],
            ['apartamento', 'venta',    480000000, '13001', 'Manga',        'Cl 25 # 21-10',       10.4100, -75.5400, 3, 2, 1, 95,  5, 30],
            ['finca',       'venta',   1100000000, '05615', 'Llanogrande',  'Vereda Don Diego, Km 2', 6.1500, -75.4300, 4, 3, 4, 2800, 5, 14],
            ['lote',        'venta',    210000000, '47001', 'Gaira',        'Vía Gaira Km 1, lote 3', 11.1900, -74.2400, 0, 0, 0, 800, null, 18],
            ['oficina',     'arriendo',   4900000, '11001', 'Chicó',        'Cl 94 # 11-30',        4.6760, -74.0480, 0, 2, 1, 70,  6, 7],
            ['casa',        'venta',    820000000, '08001', 'Villa Santos', 'Cl 84 # 53-20',       10.9900, -74.8000, 4, 3, 2, 230, 5, 22],
            ['apartamento', 'arriendo',   3100000, '76001', 'San Fernando', 'Cl 5 # 36-50',         3.4300, -76.5400, 2, 2, 1, 75,  4, 16],
        ];

        $conCar = ['balcon', 'porteria', 'ascensor', 'gas_natural', 'internet', 'jardin', 'piscina', 'zona_bbq', 'terraza', 'deposito'];

        foreach ($props as $n => [$tipo, $op, $precio, $dane, $barrio, $dir, $lat, $lng, $hab, $ban, $par, $area, $est, $dias]) {
            $ub = DB::table('municipios as m')->join('departamentos as d', 'd.id', '=', 'm.departamento_id')
                ->where('m.codigo_dane', $dane)->first(['m.nombre as ciudad', 'd.nombre as departamento']);
            if (! $ub) {
                $this->command->error("No existe el municipio {$dane}.");
                continue;
            }

            $principales = match ($tipo) {
                'apartamento' => $fotos['apartamento'],
                'casa', 'finca' => $fotos['finca'],
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
            mt_srand(5000 + $n);                         // mismo resultado cada vez
            $principal = $principales[array_rand($principales)];
            $otras = array_values(array_diff($extras, [$principal]));
            shuffle($otras);
            $otras = array_slice($otras, 0, mt_rand(3, 5));
            $car = array_slice($conCar, 0, mt_rand(3, 6));

            $p = Propiedad::updateOrCreate(['direccion' => 'POSICIONADA PRUEBA ' . $dir], [
                'user_id' => $vend->id, 'tipo' => $tipo, 'operacion' => $op, 'precio' => $precio,
                'departamento' => $ub->departamento, 'ciudad' => $ub->ciudad, 'barrio' => $barrio,
                'lat' => $lat, 'lng' => $lng, 'habitaciones' => $hab, 'banos' => $ban, 'parqueaderos' => $par,
                'area' => $area, 'estrato' => $est, 'estado' => 'publicada', 'verificada' => true,
                'imagen' => $principal,
                'descripcion' => 'PRUEBA. ' . ucfirst($tipo) . ' en ' . $op . ' en ' . $barrio . ', ' . $ub->ciudad . '. Publicación normal con posicionamiento pagado: texto de ejemplo para revisar el grupo Posicionadas.',
                'caracteristicas' => $car,
            ]);

            // Posicionamiento vigente y sin membresía (así queda en "Posicionadas" y no en Oro/Plata/Bronce)
            $p->forceFill(['posicionada_hasta' => now()->addDays($dias), 'publicada_hasta' => null])->save();
            DB::table('membresias')->where('propiedad_id', $p->id)->delete();

            PropiedadFoto::where('propiedad_id', $p->id)->delete();
            foreach ($otras as $i => $ruta) {
                PropiedadFoto::create(['propiedad_id' => $p->id, 'ruta' => $ruta, 'orden' => $i + 1]);
            }
        }

        $this->command->info('Listo: 10 publicaciones POSICIONADAS de PRUEBA para ' . $vend->email . '.');
    }
}
