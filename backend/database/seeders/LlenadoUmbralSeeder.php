<?php

namespace Database\Seeders;

use App\Models\PlanMembresia;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Llena Umbral con cuentas y publicaciones de demostración:
 *   - 1 administrador (adminumbral87@gmail.com), solo si no existe
 *   - 20 inmobiliarias ficticias con 2 agentes cada una
 *   - 50 vendedores ficticios
 *   - 1 inmobiliaria real (Gómez Yola) con su agente real (Heidy) y 1 vendedora real (Luz)
 *   - más de 1000 publicaciones con fotos y membresías Oro / Plata / Bronce
 *
 * Contraseña de todas las cuentas: Umbral2026*
 * Las cuentas ficticias usan correos @demo.umbral.co (no reciben correo).
 *
 *   php artisan db:seed --class=LlenadoUmbralSeeder
 *   php artisan db:seed --class=QuitarLlenadoUmbralSeeder   (deshace las publicaciones)
 */
class LlenadoUmbralSeeder extends Seeder
{
    private const CLAVE = 'Umbral2026*';
    private const DOM = 'demo.umbral.co';

    private string $hash;
    private array $roles = [];
    private array $fotos = [];

    private array $nombres = ['Camila', 'Andrés', 'Valentina', 'Sebastián', 'Laura', 'Julián', 'Daniela', 'Santiago', 'Natalia', 'Felipe', 'Paola', 'Mauricio', 'Diana', 'Ricardo', 'Marcela', 'Hernán', 'Sara', 'Iván', 'Estefanía', 'Óscar', 'Juliana', 'Carlos', 'Mónica', 'Alejandro', 'Luisa', 'Jorge', 'Catalina', 'David', 'Liliana', 'Camilo', 'Angélica', 'Esteban', 'Carolina', 'Nicolás', 'Viviana', 'Jhon', 'Yesenia', 'Wilmer', 'Tatiana', 'Gustavo'];
    private array $apellidos = ['Restrepo', 'Villamizar', 'Prieto', 'Ocampo', 'Cadavid', 'Martínez', 'Suárez', 'Berrío', 'Meza', 'Guzmán', 'Bonilla', 'Arango', 'Cárdenas', 'Quintero', 'Mora', 'Lozano', 'Torres', 'Buitrago', 'Gómez', 'Rodríguez', 'Ramírez', 'Herrera', 'Castaño', 'Londoño', 'Zapata', 'Giraldo', 'Ospina', 'Salazar', 'Vargas', 'Rincón', 'Pardo', 'Mejía', 'Cortés', 'Jaramillo', 'Duque', 'Navarro', 'Peña', 'Valencia', 'Acosta', 'Benítez'];
    private array $agencias = ['Horizonte Inmobiliaria', 'Capital Urbano', 'Casa Viva Colombia', 'Altos del Prado', 'Eje Cafetero Propiedades', 'Grupo Inmobiliario Caribe', 'Andina Bienes Raíces', 'Llanogrande Real Estate', 'Pacífico Inmuebles', 'Torre Norte S.A.S.', 'Hogar Seguro', 'Mirador Propiedades', 'Ciudad Jardín Inmobiliaria', 'Cumbre Inmuebles', 'Aurora Bienes Raíces', 'Sabana Propiedades', 'Montaña Real', 'Bahía Inmobiliaria', 'Nogal Inmuebles', 'Vértice Propiedades'];

    /** [DANE, lat, lng, factor de precio, [[barrio, estrato], ...]] */
    private array $ciudades = [
        ['11001', 4.6097, -74.0817, 1.15, [['Chapinero', 5], ['Usaquén', 5], ['Suba', 3], ['Cedritos', 5], ['Chicó', 6], ['Teusaquillo', 4], ['Kennedy', 3], ['Fontibón', 4]]],
        ['05001', 6.2442, -75.5812, 1.10, [['El Poblado', 6], ['Laureles', 5], ['Belén', 4], ['Robledo', 3], ['Buenos Aires', 3], ['Estadio', 5], ['La América', 4]]],
        ['76001', 3.4516, -76.5320, 0.95, [['Ciudad Jardín', 5], ['San Fernando', 4], ['Granada', 5], ['Pance', 6], ['Tequendama', 4], ['Versalles', 5]]],
        ['08001', 10.9685, -74.7813, 1.00, [['Alto Prado', 6], ['El Prado', 5], ['Riomar', 6], ['Villa Country', 5], ['El Recreo', 3]]],
        ['13001', 10.3910, -75.4794, 1.20, [['Bocagrande', 6], ['Castillogrande', 6], ['Manga', 5], ['Crespo', 4], ['Getsemaní', 4], ['El Laguito', 6]]],
        ['68001', 7.1193, -73.1227, 0.90, [['Cabecera', 5], ['Cañaveral', 5], ['San Alonso', 4], ['Mutis', 3], ['La Aurora', 3], ['Provenza', 4]]],
        ['66001', 4.8133, -75.6961, 0.85, [['Pinares', 5], ['Cerritos', 6], ['Álamos', 4], ['Cuba', 3], ['Centro', 3]]],
        ['17001', 5.0703, -75.5138, 0.85, [['Palermo', 5], ['Chipre', 4], ['Milán', 4], ['Cable', 5], ['La Enea', 5]]],
        ['47001', 11.2408, -74.1990, 1.00, [['El Rodadero', 5], ['Bello Horizonte', 4], ['Pozos Colorados', 5], ['Taganga', 3], ['Mamatoco', 3]]],
        ['54001', 7.8939, -72.5078, 0.80, [['Caobos', 5], ['La Riviera', 5], ['Quinta Vélez', 4], ['Atalaya', 3], ['Centro', 3]]],
        ['73001', 4.4389, -75.2322, 0.80, [['Ricaurte', 3], ['Cádiz', 4], ['Picaleña', 4], ['La Pola', 4], ['Interlaken', 5]]],
        ['50001', 4.1420, -73.6266, 0.85, [['Barzal', 5], ['Centro', 3], ['La Grama', 4], ['Kirpas', 4]]],
        ['63001', 4.5339, -75.6811, 0.85, [['Centenario', 4], ['Norte', 5], ['La Castellana', 4]]],
        ['05615', 6.1550, -75.3740, 1.05, [['Llanogrande', 6], ['Centro', 4], ['San Antonio', 4], ['Los Pinos', 5]]],
        ['05266', 6.1759, -75.5917, 1.00, [['Zúñiga', 4], ['Alcalá', 5], ['Primavera', 5], ['Las Vegas', 6]]],
        ['25175', 4.8587, -74.0586, 1.05, [['Samaria', 5], ['La Lorena', 5], ['Yerbabuena', 6], ['Fonquetá', 4]]],
        ['41001', 2.9273, -75.2819, 0.80, [['Cándido', 4], ['Calixto', 4], ['Altico', 5], ['Santa Inés', 3]]],
        ['20001', 10.4631, -73.2532, 0.80, [['Los Mayales', 5], ['Novalito', 4], ['Los Álamos', 4]]],
    ];

    private array $veredas = ['Vereda El Retiro', 'Vereda La Playa', 'Vereda San José', 'Vereda Alto Bonito', 'Vereda La Cabaña', 'Vereda Santa Elena', 'Vereda El Carmen', 'Vereda La Esperanza', 'Vereda El Chuscal'];

    private array $m2 = [1 => 1800000, 2 => 2400000, 3 => 3200000, 4 => 4500000, 5 => 6500000, 6 => 9500000];

    private array $carPorTipo = [
        'apartamento' => ['ascensor', 'porteria', 'gimnasio', 'salon_comunal', 'balcon', 'parque_infantil', 'zona_bbq', 'gas_natural', 'internet', 'deposito', 'amoblado', 'mascotas', 'terraza'],
        'casa' => ['jardin', 'terraza', 'chimenea', 'gas_natural', 'internet', 'mascotas', 'deposito', 'zona_bbq', 'piscina', 'balcon'],
        'finca' => ['piscina', 'zona_bbq', 'jardin', 'chimenea', 'terraza', 'mascotas', 'deposito', 'internet'],
        'lote' => ['gas_natural', 'internet'],
        'oficina' => ['ascensor', 'porteria', 'internet', 'deposito', 'salon_comunal', 'gas_natural'],
        'local' => ['internet', 'deposito', 'gas_natural', 'porteria'],
    ];

    private function aleatorio(): float
    {
        return mt_rand() / mt_getrandmax();
    }

    private function elegir(array $lista)
    {
        return $lista[array_rand($lista)];
    }

    private function cargarFotos(): bool
    {
        foreach (['apartamento', 'interior', 'oficina', 'finca', 'lote'] as $c) {
            $lista = glob(base_path('objects/propiedades/umbral/' . $c . '/*.jpg')) ?: [];
            sort($lista);
            $this->fotos[$c] = array_map(fn ($f) => 'propiedades/umbral/' . $c . '/' . basename($f), $lista);
            if (! $this->fotos[$c]) {
                $this->command->error("No hay fotos en backend/objects/propiedades/umbral/{$c}. Copia primero la carpeta 'umbral'.");

                return false;
            }
        }

        return true;
    }

    private function usuario(array $d): User
    {
        $d += ['pais_residencia' => 'CO', 'estado' => 'activo'];

        return User::unguarded(fn () => User::updateOrCreate(
            ['email' => $d['email']],
            $d + ['password' => $this->hash, 'email_verified_at' => now()]
        ));
    }

    private function nombrePersona(): string
    {
        return $this->elegir($this->nombres) . ' ' . $this->elegir($this->apellidos) . ' ' . $this->elegir($this->apellidos);
    }

    private function telefono(): string
    {
        return '+57 3' . mt_rand(0, 2) . mt_rand(0, 9) . ' ' . mt_rand(100, 999) . ' ' . mt_rand(1000, 9999);
    }

    public function run(): void
    {
        if (! $this->cargarFotos()) {
            return;
        }
        // Solo cuentas de ESTE llenado (inmobiliariaNN, vendedorNN y las reales); las demo viejas @demo.umbral.co no cuentan
        $yaHay = Propiedad::whereHas('vendedor', fn ($q) => $q->where(
            fn ($w) => $w->where('email', 'like', 'inmobiliaria__@' . self::DOM)->orWhere('email', 'like', 'vendedor__@' . self::DOM)
                ->orWhereIn('email', ['gomezoyolajorge12@gmail.com', 'luzenidloaizagonzalez6@gmail.com'])
        ))->exists();
        if ($yaHay) {
            $this->command->error('Ya hay publicaciones del llenado. Corre antes QuitarLlenadoUmbralSeeder.');

            return;
        }

        mt_srand(2026);
        $this->hash = Hash::make(self::CLAVE);
        $this->roles = Role::pluck('id', 'nombre')->all();

        // ---------- Cuentas ----------
        $admin = User::where('email', 'adminumbral87@gmail.com')->first()
            ?? $this->usuario(['name' => 'Administrador UMBRAL', 'email' => 'adminumbral87@gmail.com', 'role_id' => $this->roles['administrador'],
                'telefono' => '+57 300 555 0087', 'tipo_documento' => 'CC', 'numero_documento' => '1098000087']);

        // Reales (correos de verdad: reciben códigos y enlaces)
        $yola = $this->usuario(['name' => 'Yola Jorge Gómez', 'email' => 'gomezoyolajorge12@gmail.com', 'role_id' => $this->roles['inmobiliaria'],
            'telefono' => '+57 300 555 0901', 'tipo_documento' => 'NIT', 'numero_documento' => '901234567-1', 'representante_legal' => 'Yola Jorge Gómez']);
        $heidy = $this->usuario(['name' => 'Heidy', 'email' => 'heidygr5821@gmail.com', 'role_id' => $this->roles['agente'],
            'telefono' => '+57 300 555 0902', 'tipo_documento' => 'CC', 'numero_documento' => '1000000902', 'inmobiliaria_id' => $yola->id]);

        $luz = $this->usuario(['name' => 'Luz Enid Loaiza González', 'email' => 'luzenidloaizagonzalez6@gmail.com', 'role_id' => $this->roles['vendedor'],
            'telefono' => '+57 300 555 0903', 'tipo_documento' => 'CC', 'numero_documento' => '1000000903']);

        $duenos = [];   // [user, agentes[], cantidad de publicaciones]
        $duenos[] = [$yola, [$heidy], 30];
        $duenos[] = [$luz, [], 10];

        $cc = 1030000000;
        for ($i = 1; $i <= 20; $i++) {
            $n = sprintf('%02d', $i);
            $inmo = $this->usuario(['name' => $this->agencias[$i - 1], 'email' => "inmobiliaria{$n}@" . self::DOM, 'role_id' => $this->roles['inmobiliaria'],
                'telefono' => $this->telefono(), 'tipo_documento' => 'NIT', 'numero_documento' => '9002' . sprintf('%05d', $i) . '-' . (($i % 9) + 1),
                'representante_legal' => $this->nombrePersona()]);
            $agentes = [];
            foreach (['a', 'b'] as $l) {
                $agentes[] = $this->usuario(['name' => $this->nombrePersona(), 'email' => "agente{$n}{$l}@" . self::DOM, 'role_id' => $this->roles['agente'],
                    'telefono' => $this->telefono(), 'tipo_documento' => 'CC', 'numero_documento' => (string) $cc++, 'inmobiliaria_id' => $inmo->id]);
            }
            $duenos[] = [$inmo, $agentes, mt_rand(24, 36)];
        }
        $cc = 1040000000;
        for ($i = 1; $i <= 50; $i++) {
            $v = $this->usuario(['name' => $this->nombrePersona(), 'email' => 'vendedor' . sprintf('%02d', $i) . '@' . self::DOM, 'role_id' => $this->roles['vendedor'],
                'telefono' => $this->telefono(), 'tipo_documento' => 'CC', 'numero_documento' => (string) $cc++]);
            $duenos[] = [$v, [], mt_rand(5, 11)];
        }
        $this->command->info('Cuentas listas: ' . count($duenos) . ' publicadores (+ agentes).');

        // ---------- Publicaciones ----------
        $ids = [];        // propiedades de cuentas ficticias (candidatas a membresía)
        $idsYola = [];
        $idsLuz = [];
        DB::transaction(function () use ($duenos, $yola, $luz, $admin, &$ids, &$idsYola, &$idsLuz) {
            foreach ($duenos as [$dueno, $agentes, $cantidad]) {
                for ($k = 0; $k < $cantidad; $k++) {
                    $id = $this->crearPropiedad($dueno, $agentes, $admin);
                    if ($id === null) {
                        continue;
                    }
                    if ($dueno->id === $yola->id) {
                        $idsYola[] = $id;
                    } elseif ($dueno->id === $luz->id) {
                        $idsLuz[] = $id;
                    } else {
                        $ids[] = $id;
                    }
                }
            }
        });
        $this->command->info('Publicaciones creadas: ' . (count($ids) + count($idsYola) + count($idsLuz)));

        // ---------- Membresías ----------
        shuffle($ids);
        shuffle($idsYola);
        shuffle($idsLuz);
        $this->membresias(array_merge(array_splice($ids, 0, 30), array_splice($idsYola, 0, 2), array_splice($idsLuz, 0, 1)), 'mensual');
        $this->membresias(array_merge(array_splice($ids, 0, 60), array_splice($idsYola, 0, 3), array_splice($idsLuz, 0, 1)), 'quincenal');
        $this->membresias(array_merge(array_splice($ids, 0, 120), array_splice($idsYola, 0, 5), array_splice($idsLuz, 0, 2)), 'semanal');
        $this->command->info('Membresías: Oro (mensual), Plata (quincenal) y Bronce (semanal) repartidas.');
        $this->command->info('Listo. Contraseña de todas las cuentas: ' . self::CLAVE);
    }

    private function crearPropiedad(User $dueno, array $agentes, User $admin): ?int
    {
        // ----- ubicación
        [$dane, $lat0, $lng0, $factor, $barrios] = $this->elegir($this->ciudades);
        $ub = DB::table('municipios as m')->join('departamentos as d', 'd.id', '=', 'm.departamento_id')
            ->where('m.codigo_dane', $dane)->first(['m.nombre as ciudad', 'd.nombre as departamento']);
        if (! $ub) {
            return null;
        }
        [$barrio, $estrato] = $this->elegir($barrios);

        // ----- tipo y operación
        $r = mt_rand(1, 100);
        $tipo = $r <= 45 ? 'apartamento' : ($r <= 69 ? 'casa' : ($r <= 77 ? 'oficina' : ($r <= 84 ? 'local' : ($r <= 93 ? 'lote' : 'finca'))));
        $operacion = in_array($tipo, ['lote', 'finca'], true) ? (mt_rand(1, 100) <= 92 ? 'venta' : 'arriendo') : (mt_rand(1, 100) <= 55 ? 'venta' : 'arriendo');
        $cuad = $this->aleatorio() ** 2;
        $jit = fn (float $a, float $b) => $a + ($b - $a) * $this->aleatorio();

        // ----- medidas, precio
        $rural = in_array($tipo, ['lote', 'finca'], true) && mt_rand(1, 100) <= 60;
        if ($rural) {
            $barrio = $this->elegir($this->veredas);
            $estrato = $tipo === 'finca' ? mt_rand(4, 6) : null;
        } elseif ($tipo === 'lote') {
            $estrato = null;
        }
        $m2 = $this->m2[$estrato ?? 4] * $factor;
        switch ($tipo) {
            case 'apartamento':
                $area = (int) (35 + $cuad * 185);
                $venta = $area * $m2 * $jit(0.9, 1.15);
                break;
            case 'casa':
                $area = (int) (70 + $cuad * 380);
                $venta = $area * $m2 * $jit(0.85, 1.1);
                break;
            case 'oficina':
                $area = (int) (25 + $cuad * 275);
                $venta = $area * $m2 * $jit(0.95, 1.2);
                break;
            case 'local':
                $area = (int) (18 + $cuad * 230);
                $venta = $area * $m2 * $jit(1.0, 1.3);
                break;
            case 'lote':
                $area = (int) (150 + $cuad * 5850);
                $venta = $rural ? $area * $jit(60000, 300000) * $factor : $area * $m2 * $jit(0.12, 0.2);
                break;
            default: // finca
                $area = (int) (3000 + $cuad * 57000);
                $venta = 300000000 + $area * $jit(40000, 150000) * $factor;
        }
        if ($operacion === 'venta') {
            $precio = $venta >= 100000000 ? (int) (round($venta / 1000000) * 1000000) : (int) (round($venta / 100000) * 100000);
        } else {
            $precio = max(450000, (int) (round($venta * 0.0055 * $jit(0.85, 1.2) / 50000) * 50000));
        }

        // ----- habitaciones, baños, parqueaderos, pisos
        switch ($tipo) {
            case 'apartamento':
                $hab = $area < 40 ? 1 : ($area < 60 ? 2 : ($area < 90 ? 3 : ($area < 140 ? 4 : 5)));
                $ban = max(1, $hab - mt_rand(0, 1));
                $par = $estrato >= 4 ? mt_rand(1, 2) : mt_rand(0, 1);
                $pisos = mt_rand(1, 28);
                break;
            case 'casa':
                $hab = min(6, max(2, (int) round($area / 65)));
                $ban = max(1, $hab - mt_rand(0, 1));
                $par = mt_rand(1, 3);
                $pisos = mt_rand(1, 3);
                break;
            case 'finca':
                $hab = mt_rand(3, 8);
                $ban = mt_rand(2, 6);
                $par = mt_rand(2, 8);
                $pisos = mt_rand(1, 2);
                break;
            case 'lote':
                $hab = $ban = $par = 0;
                $pisos = null;
                break;
            default: // oficina, local
                $hab = 0;
                $ban = mt_rand(1, 3);
                $par = mt_rand(0, 4);
                $pisos = $tipo === 'local' ? 1 : mt_rand(1, 25);
        }
        $antig = $tipo === 'lote' ? null : mt_rand(0, 35);

        // ----- fotos (no se repiten dentro de la misma publicación)
        $principales = match ($tipo) {
            'apartamento' => $this->fotos['apartamento'],
            'casa', 'finca' => $this->fotos['finca'],
            'lote' => array_merge($this->fotos['lote'], $this->fotos['finca']),
            default => $this->fotos['oficina'],
        };
        $extras = match ($tipo) {
            'apartamento' => array_merge($this->fotos['apartamento'], $this->fotos['interior']),
            'casa' => array_merge($this->fotos['interior'], $this->fotos['finca']),
            'finca' => $this->fotos['finca'],
            'lote' => array_merge($this->fotos['lote'], $this->fotos['finca']),
            default => array_merge($this->fotos['oficina'], $this->fotos['interior']),
        };
        $principal = $this->elegir($principales);
        $otras = array_values(array_diff($extras, [$principal]));
        shuffle($otras);
        $otras = array_slice($otras, 0, mt_rand(4, 8));

        // ----- características y descripción
        $pool = $this->carPorTipo[$tipo];
        shuffle($pool);
        $car = array_slice($pool, 0, min(count($pool), mt_rand(3, 8)));

        $dir = $rural
            ? 'Km ' . mt_rand(1, 25) . ' vía ' . $barrio . ', lote ' . mt_rand(1, 60)
            : $this->elegir(['Cra', 'Cl', 'Av.', 'Dg.']) . ' ' . mt_rand(1, 120) . ' # ' . mt_rand(1, 99) . '-' . mt_rand(1, 99);
        $descripcion = $this->descripcion($tipo, $operacion, $barrio, $ub->ciudad, $hab, $ban, $par, $area, $estrato);

        $creada = now()->subDays(mt_rand(0, 110))->subMinutes(mt_rand(0, 1400));
        $verificada = mt_rand(1, 100) <= 70;
        $agente = $agentes && mt_rand(1, 100) <= 70 ? $this->elegir($agentes)->id : null;

        $p = Propiedad::unguarded(fn () => Propiedad::create([
            'user_id' => $dueno->id, 'agente_id' => $agente,
            'tipo' => $tipo, 'operacion' => $operacion, 'precio' => $precio,
            'departamento' => $ub->departamento, 'ciudad' => $ub->ciudad, 'barrio' => $barrio, 'direccion' => $dir,
            'lat' => round($lat0 + ($this->aleatorio() - 0.5) * 0.06, 7), 'lng' => round($lng0 + ($this->aleatorio() - 0.5) * 0.06, 7),
            'habitaciones' => $hab, 'banos' => $ban, 'parqueaderos' => $par, 'area' => $area, 'estrato' => $estrato,
            'pisos' => $pisos, 'antiguedad' => $antig,
            'area_terreno_m2' => in_array($tipo, ['casa', 'finca', 'lote'], true) ? ($tipo === 'casa' ? round($area * $jit(1.0, 1.6), 2) : $area) : null,
            'estado' => 'publicada', 'verificada' => $verificada,
            'verificador_id' => $verificada ? $admin->id : null, 'fecha_verificacion' => $verificada ? $creada : null,
            'imagen' => $principal, 'descripcion' => $descripcion, 'caracteristicas' => $car,
            'created_at' => $creada, 'updated_at' => $creada->copy()->addDays(mt_rand(0, 20)),
        ]));

        $filas = [];
        foreach ($otras as $i => $ruta) {
            $filas[] = ['propiedad_id' => $p->id, 'ruta' => $ruta, 'orden' => $i + 1, 'created_at' => now(), 'updated_at' => now()];
        }
        DB::table('propiedad_fotos')->insert($filas);

        return $p->id;
    }

    private function descripcion(string $tipo, string $op, string $barrio, string $ciudad, int $hab, int $ban, int $par, int $area, ?int $estrato): string
    {
        $en = $op === 'venta' ? 'en venta' : 'en arriendo';
        $apertura = [
            'apartamento' => ['Apartamento', 'Cómodo apartamento', 'Moderno apartamento', 'Apartamento remodelado'],
            'casa' => ['Casa', 'Amplia casa', 'Casa familiar', 'Casa con excelente distribución'],
            'oficina' => ['Oficina', 'Oficina lista para ocupar', 'Oficina moderna'],
            'local' => ['Local comercial', 'Local con excelente flujo peatonal', 'Local esquinero'],
            'lote' => ['Lote', 'Terreno plano', 'Lote con vista despejada'],
            'finca' => ['Finca', 'Finca de recreo', 'Hermosa finca'],
        ][$tipo];
        $frases = [
            'Ubicado en una zona tranquila, cerca de comercio, transporte y vías principales.',
            'Muy buena iluminación y ventilación natural en todos los espacios.',
            'Excelente valorización y fácil acceso desde las principales avenidas.',
            'Sector con buena oferta de colegios, restaurantes y servicios.',
            'Documentación al día y lista para negociar de inmediato.',
            'Entorno seguro, con portería y vigilancia en el sector.',
        ];
        shuffle($frases);
        $detalle = match ($tipo) {
            'lote' => "Cuenta con {$area} m² y servicios públicos cercanos.",
            'finca' => "Cuenta con {$hab} habitaciones, {$ban} baños, {$par} parqueaderos y {$area} m² de terreno.",
            'oficina', 'local' => "Tiene {$area} m², {$ban} baños y {$par} parqueaderos.",
            default => "Tiene {$area} m², {$hab} habitaciones, {$ban} baños y {$par} parqueaderos" . ($estrato ? ", estrato {$estrato}." : '.'),
        };

        return $this->elegir($apertura) . " {$en} en {$barrio}, {$ciudad}. " . $frases[0] . ' ' . $detalle . ' ' . $frases[1];
    }

    /** Membresía vigente HOY para cada propiedad de la lista. */
    private function membresias(array $propiedadIds, string $plan): void
    {
        $dias = ['mensual' => 30, 'quincenal' => 15, 'semanal' => 7][$plan];
        $precio = PlanMembresia::precios()[$plan] ?? 0;
        $hoy = now('America/Bogota')->startOfDay();
        $duenos = DB::table('propiedades')->whereIn('id', $propiedadIds)->pluck('user_id', 'id');

        $filas = [];
        foreach ($propiedadIds as $id) {
            $inicio = $hoy->copy()->subDays(mt_rand(0, max(0, $dias - 4)));
            $filas[] = [
                'user_id' => $duenos[$id], 'propiedad_id' => $id, 'plan' => $plan, 'precio' => $precio,
                'estado' => 'activa', 'fecha_inicio' => $inicio->toDateString(), 'fecha_fin' => $inicio->copy()->addDays($dias)->toDateString(),
                'referencia_pago' => 'SEED', 'created_at' => now(), 'updated_at' => now(),
            ];
        }
        foreach (array_chunk($filas, 200) as $lote) {
            DB::table('membresias')->insert($lote);
        }
    }
}
