<?php

namespace Database\Seeders;

use App\Models\Propiedad;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PropiedadSeeder extends Seeder
{
    public function run(): void
    {
        $vendedores = [
            ['Inmobiliaria Horizonte S.A.S.', 'horizonte@demo.umbral.co', 3, '+57 604 555 0101', 'NIT', '900100001-1', true],
            ['Capital Urbano Inmobiliaria',   'capital@demo.umbral.co',    3, '+57 601 555 0142', 'NIT', '900100002-2', true],
            ['Mariana Restrepo',              'mariana@demo.umbral.co',    2, '+57 300 555 0178', 'CC',  '1000000001',  false],
            ['Andrés Pacheco',                'andres@demo.umbral.co',     2, '+57 315 555 0199', 'CC',  '1000000002',  false],
            ['Casa Viva Colombia',            'casaviva@demo.umbral.co',   3, '+57 602 555 0166', 'NIT', '900100003-3', false],
        ];

        $ids = [];
        foreach ($vendedores as $i => [$name, $email, $rol, $tel, $td, $nd, $membresia]) {
            $u = User::unguarded(fn () => User::firstOrCreate(['email' => $email], [
                'name' => $name, 'password' => Hash::make('Umbral2026*'),
                'role_id' => $rol, 'telefono' => $tel,
                'tipo_documento' => $td, 'numero_documento' => $nd,
                'pais_residencia' => 'CO', 'estado' => 'activo',
            ]));
            $ids[$i] = $u->id;

            if ($membresia && ! DB::table('membresias')->where('user_id', $u->id)->exists()) {
                DB::table('membresias')->insert([
                    'user_id' => $u->id, 'plan' => 'mensual', 'precio' => 99000,
                    'estado' => 'activa', 'fecha_inicio' => now()->toDateString(),
                    'fecha_fin' => now()->addDays(30)->toDateString(),
                    'referencia_pago' => 'SEED', 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        // tipo, op, precio, depto, ciudad, barrio, direccion, lat, lng, hab, banos, parq, area, estrato, verificada, vendedor
        $props = [
            ['casa','venta',1850000000,'Antioquia','Medellín','El Poblado','Cra 35 # 8A-45',6.2086,-75.5659,4,4,3,320,6,true,0],
            ['apartamento','arriendo',4800000,'Cundinamarca','Bogotá D.C.','Chapinero','Cl 63 # 9-30',4.6533,-74.0626,2,2,1,85,5,true,1],
            ['apartamento','venta',980000000,'Bolívar','Cartagena','Bocagrande','Av. San Martín # 7-120',10.4010,-75.5560,3,3,1,140,6,true,2],
            ['finca','venta',2400000000,'Antioquia','Rionegro','Llanogrande','Km 4 vía Las Palmas',6.1300,-75.4200,5,5,6,1800,6,false,0],
            ['apartamento','arriendo',3200000,'Atlántico','Barranquilla','El Prado','Cra 54 # 68-80',10.9948,-74.7957,3,2,1,110,5,true,3],
            ['casa','arriendo',6500000,'Valle del Cauca','Cali','Ciudad Jardín','Cl 14 # 98-40',3.3500,-76.5350,4,3,2,240,5,false,4],
            ['local','arriendo',9000000,'Cundinamarca','Bogotá D.C.','Usaquén','Cra 6 # 119-25',4.7110,-74.0300,0,2,2,150,5,true,1],
            ['apartamento','venta',520000000,'Santander','Bucaramanga','Cabecera','Cra 33 # 52-10',7.1190,-73.1100,3,2,2,98,5,false,3],
            ['lote','venta',780000000,'Magdalena','Santa Marta','El Rodadero','Vía al Rodadero Km 2',11.2000,-74.2300,0,0,0,600,null,false,2],
            ['apartamento','venta',640000000,'Antioquia','Medellín','Laureles','Cir. 4 # 70-15',6.2442,-75.5900,3,2,1,105,5,true,4],
            ['casa','venta',1450000000,'Atlántico','Barranquilla','Alto Prado','Cl 79 # 56-20',11.0000,-74.8100,4,4,2,380,6,true,3],
            ['apartamento','arriendo',2800000,'Antioquia','Envigado','Zúñiga','Cra 47 # 38 Sur-15',6.1700,-75.5850,2,2,1,72,4,true,0],
        ];

        foreach ($props as [$tipo,$op,$precio,$dep,$ciu,$bar,$dir,$lat,$lng,$hab,$ban,$par,$area,$est,$ver,$v]) {
            Propiedad::updateOrCreate(['direccion' => $dir, 'ciudad' => $ciu], [
                'user_id' => $ids[$v], 'tipo' => $tipo, 'operacion' => $op, 'precio' => $precio,
                'departamento' => $dep, 'barrio' => $bar, 'lat' => $lat, 'lng' => $lng,
                'habitaciones' => $hab, 'banos' => $ban, 'parqueaderos' => $par,
                'area' => $area, 'estrato' => $est, 'verificada' => $ver, 'estado' => 'publicada',
            ]);
        }
    }
}
