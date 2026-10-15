<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\Membresia;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Datos de PRUEBA del panel de la inmobiliaria.
 * Usa la cuenta inmobiliaria@umbral.test (UsuariosPruebaSeeder) y le agrega:
 * agentes, propiedades asignadas, contactos (leads), visitas y una membresía vigente.
 * Contraseña de todos: Umbral2026*
 * Se puede correr varias veces sin duplicar datos.
 */
class InmobiliariaDemoSeeder extends Seeder
{
    private const CLAVE = 'Umbral2026*';

    public function run(): void
    {
        $inmobiliaria = User::where('email', 'inmobiliaria@umbral.test')->first();
        if (! $inmobiliaria) {
            $this->command?->error('No existe inmobiliaria@umbral.test. Corre antes UsuariosPruebaSeeder.');

            return;
        }

        $inmobiliaria->forceFill([
            'estado' => 'activo',
            'representante_legal' => $inmobiliaria->representante_legal ?: 'Carolina Méndez',
            'pais_residencia' => 'CO',
        ])->save();

        // ---------- Agentes ----------
        $rolAgente = Role::where('nombre', 'agente')->value('id');
        $agentes = [];
        $datosAgentes = [
            ['agente@umbral.test', 'Agente de Prueba', '1000000002', 'activo'],
            ['laura.agente@umbral.test', 'Laura Castillo', '1000000201', 'activo'],
            ['diego.agente@umbral.test', 'Diego Ramírez', '1000000202', 'activo'],
            ['paula.agente@umbral.test', 'Paula Herrera', '1000000203', 'inactivo'],
        ];

        foreach ($datosAgentes as $i => [$correo, $nombre, $documento, $estado]) {
            $agente = User::firstOrNew(['email' => $correo]);
            $agente->forceFill([
                'name' => $agente->name ?: $nombre,
                'password' => $agente->exists ? $agente->password : self::CLAVE,
                'role_id' => $rolAgente,
                'inmobiliaria_id' => $inmobiliaria->id,
                'telefono' => $agente->telefono ?: '30055500' . str_pad((string) ($i + 10), 2, '0', STR_PAD_LEFT),
                'tipo_documento' => $agente->tipo_documento ?: 'CC',
                'numero_documento' => $agente->numero_documento ?: $documento,
                'estado' => $estado,
                'email_verified_at' => $agente->email_verified_at ?: now(),
            ])->save();
            $agentes[] = $agente;
        }

        // ---------- Membresía vigente ----------
        if (! Membresia::where('user_id', $inmobiliaria->id)->where('referencia_pago', 'PSE-INMO-DEMO')->exists()) {
            $inicio = now()->subDays(5);
            Membresia::create([
                'user_id' => $inmobiliaria->id,
                'plan' => 'mensual',
                'precio' => Membresia::PRECIOS_PLAN['mensual'],
                'estado' => 'activa',
                'fecha_inicio' => $inicio->toDateString(),
                'fecha_fin' => Membresia::calcularFin('mensual', $inicio)->toDateString(),
                'referencia_pago' => 'PSE-INMO-DEMO',
            ]);
        }

        // ---------- Propiedades ----------
        // tipo, operación, precio, cód. DANE, barrio, dirección, lat, lng, hab, baños, parq, área, estrato, estado, agente (índice o null)
        $propiedades = [
            ['apartamento', 'venta', 420000000, '73001', 'Belén', 'Cra 4 # 12-30 Ibagué', 4.4380, -75.2050, 3, 2, 1, 92, 4, 'publicada', 0],
            ['casa', 'venta', 690000000, '73001', 'El Vergel', 'Cl 103 # 9-45 Ibagué', 4.4450, -75.1820, 4, 3, 2, 210, 5, 'publicada', 1],
            ['apartamento', 'arriendo', 1800000, '73001', 'Cádiz', 'Cra 5 # 39-20 Ibagué', 4.4400, -75.2150, 2, 2, 1, 68, 4, 'publicada', 1],
            ['local', 'arriendo', 3500000, '73001', 'Centro', 'Cl 15 # 3-40 Ibagué', 4.4390, -75.2400, 0, 1, 0, 80, null, 'publicada', 2],
            ['apartamento', 'venta', 560000000, '11001', 'Cedritos', 'Cl 140 # 15-22 Bogotá', 4.7230, -74.0450, 3, 2, 1, 88, 4, 'publicada', 2],
            ['finca', 'venta', 1250000000, '73001', 'Vereda Chucuní', 'Km 6 vía Ibagué-Rovira', 4.4100, -75.1700, 5, 4, 4, 2500, null, 'borrador', null],
            ['casa', 'arriendo', 3200000, '73001', 'Piedra Pintada', 'Cra 8 # 72-10 Ibagué', 4.4470, -75.1950, 3, 3, 2, 160, 5, 'pausada', null],
        ];

        // Ficha completa de cada propiedad (mismo orden): descripción, pisos, antigüedad, características
        $fichas = [
            ['Apartamento iluminado en piso alto con vista a la cordillera. Sala-comedor amplia, cocina integral abierta, estudio y balcón. A dos cuadras de la Universidad del Tolima y cerca de supermercados y transporte público.', 1, 8, ['ascensor', 'porteria', 'balcon', 'gimnasio', 'gas_natural', 'internet']],
            ['Casa de dos niveles en conjunto cerrado, con jardín, patio de ropas independiente y estudio. Acabados en porcelanato y madera, cocina remodelada y zonas verdes con parque infantil.', 2, 12, ['porteria', 'piscina', 'jardin', 'parque_infantil', 'zona_bbq', 'deposito', 'mascotas', 'gas_natural']],
            ['Apartamento para estrenar remodelación en Cádiz, cerca de la Calle 60 y centros comerciales. Dos alcobas con closet, cocina abierta y parqueadero cubierto.', 1, 15, ['ascensor', 'porteria', 'salon_comunal', 'gas_natural', 'internet']],
            ['Local comercial esquinero en pleno centro, con alto flujo peatonal, vitrina de 6 metros, baño privado y mezanine para bodega.', 1, 25, ['deposito', 'internet']],
            ['Apartamento en Cedritos, a pasos de la Autopista Norte y de TransMilenio. Tres alcobas, estudio, chimenea y terraza privada.', 1, 10, ['ascensor', 'porteria', 'chimenea', 'terraza', 'gimnasio', 'deposito', 'gas_natural']],
            ['Finca de recreo con casa principal, kiosco, piscina y zonas verdes. Clima templado a 15 minutos de Ibagué por vía pavimentada.', 1, 20, ['piscina', 'jardin', 'zona_bbq', 'mascotas']],
            ['Casa amplia en Piedra Pintada con patio, terraza y garaje para dos carros. Sector residencial tranquilo cerca de colegios.', 2, 18, ['terraza', 'jardin', 'mascotas', 'gas_natural']],
        ];

        $creadas = [];
        foreach ($propiedades as $i => [$tipo, $op, $precio, $dane, $barrio, $dir, $lat, $lng, $hab, $ban, $par, $area, $estrato, $estado, $agente]) {
            [$descripcion, $pisos, $antiguedad, $caracteristicas] = $fichas[$i];
            $ubicacion = DB::table('municipios as m')
                ->join('departamentos as d', 'd.id', '=', 'm.departamento_id')
                ->where('m.codigo_dane', $dane)
                ->first(['m.nombre as ciudad', 'd.nombre as departamento']);

            if (! $ubicacion) {
                $this->command?->error("No existe el municipio {$dane}. Corre antes DepartamentoSeeder y MunicipioSeeder.");
                continue;
            }

            $creadas[] = Propiedad::updateOrCreate(['direccion' => $dir], [
                'user_id' => $inmobiliaria->id,
                'agente_id' => $agente === null ? null : $agentes[$agente]->id,
                'tipo' => $tipo, 'operacion' => $op, 'precio' => $precio,
                'departamento' => $ubicacion->departamento, 'ciudad' => $ubicacion->ciudad, 'barrio' => $barrio,
                'lat' => $lat, 'lng' => $lng,
                'habitaciones' => $hab, 'banos' => $ban, 'parqueaderos' => $par,
                'area' => $area, 'estrato' => $estrato, 'verificada' => $estado === 'publicada', 'estado' => $estado,
                'descripcion' => $descripcion, 'pisos' => $pisos, 'antiguedad' => $antiguedad, 'caracteristicas' => $caracteristicas,
            ]);
        }

        if (count($creadas) < 5) {
            return;
        }

        // ---------- Contactos (leads) ----------
        // propiedad (índice), nombre, contacto, mensaje, días atrás, estado, ¿con agente?
        $contactos = [
            [0, 'Camila Rojas', '3104567890', 'Hola, ¿el precio es negociable? Me gustaría conocerlo esta semana.', 0, 'nuevo', true],
            [1, 'Andrés Gómez', 'andres.gomez@correo.co', '¿La casa tiene escrituras al día?', 1, 'en_seguimiento', true],
            [2, 'Laura Becerra', '3015550123', 'Busco arrendar desde el mes entrante. ¿Aceptan mascotas?', 1, 'nuevo', true],
            [3, 'Felipe Castaño', '3023334455', '¿El local tiene baño propio y bodega?', 2, 'nuevo', false],
            [4, 'Valentina Muñoz', '3118821144', '¿Se puede visitar el sábado en la mañana?', 3, 'en_seguimiento', true],
            [0, 'Julián Herrera', '3206677889', 'Quisiera más fotos de la cocina.', 4, 'cerrado', true],
            [2, 'Mariana Duque', '3149990011', '¿La administración está incluida en el canon?', 5, 'descartado', true],
            [1, 'Sebastián Ortiz', 'sebas.ortiz@correo.co', 'Me interesa, ¿podemos coordinar una visita?', 6, 'nuevo', false],
        ];

        $leads = [];
        foreach ($contactos as [$p, $nombre, $contacto, $mensaje, $dias, $estado, $conAgente]) {
            $propiedad = $creadas[$p];
            $lead = Lead::firstOrNew(['propiedad_id' => $propiedad->id, 'nombre' => $nombre]);
            $lead->forceFill([
                'contacto' => $contacto,
                'mensaje' => $mensaje,
                'consentimiento' => true,
                'estado' => $estado,
                'agente_id' => $conAgente ? $propiedad->agente_id : null,
                'created_at' => now()->subDays($dias)->subHours($p + 1),
            ])->save();
            $leads[] = $lead;
        }

        // ---------- Visitas ----------
        // lead (índice), días desde hoy (negativo = pasada), hora, estado
        $visitas = [
            [0, 1, 10, 'pendiente'],
            [1, 2, 15, 'confirmada'],
            [2, 1, 16, 'pendiente'],
            [4, 3, 9, 'confirmada'],
            [5, -2, 11, 'realizada'],
        ];

        foreach ($visitas as [$l, $dias, $hora, $estado]) {
            $lead = $leads[$l];
            Visita::updateOrCreate(['lead_id' => $lead->id], [
                'propiedad_id' => $lead->propiedad_id,
                'agente_id' => $lead->agente_id,
                'nombre' => $lead->nombre,
                'contacto' => $lead->contacto,
                // La hora se piensa en Colombia y se guarda en UTC (RF-007)
                'fecha' => now('America/Bogota')->startOfDay()->addDays($dias)->setTime($hora, 0)->utc(),
                'estado' => $estado,
            ]);
        }
    }
}
