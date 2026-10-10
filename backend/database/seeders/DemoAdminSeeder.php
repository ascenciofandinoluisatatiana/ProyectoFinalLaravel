<?php

namespace Database\Seeders;

use App\Models\Membresia;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Datos de DEMOSTRACIÓN para el panel de administración.
 * Crea cuentas de ejemplo repartidas en los últimos 12 meses (para las
 * gráficas) y membresías con pagos históricos y vigentes (para los KPI
 * de ingresos). Es idempotente: se puede ejecutar varias veces.
 *
 * Contraseña de todas las cuentas: Umbral2026*
 */
class DemoAdminSeeder extends Seeder
{
    private const CLAVE = 'Umbral2026*';

    public function run(): void
    {
        $roles = Role::pluck('id', 'nombre');

        // [nombre, correo, rol, meses atrás del registro, estado, tipo doc, número doc]
        $usuarios = [
            ['Gerencia General UMBRAL', 'gerencia@umbral.test', 'administrador', 12, 'activo', 'CC', '1098776543'],
            ['Camila Restrepo', 'camila.restrepo@example.com', 'vendedor', 11, 'activo', 'CC', '1019004501'],
            ['Andrés Villamizar', 'andres.villamizar@example.com', 'vendedor', 11, 'activo', 'CC', '1019004502'],
            ['Inmobiliaria Casa Andina', 'casaandina@example.com', 'inmobiliaria', 10, 'activo', 'NIT', '900450101'],
            ['Sebastián Ocampo', 'sebastian.ocampo@example.com', 'agente', 10, 'activo', 'CC', '1019004503'],
            ['Valentina Prieto', 'valentina.prieto@example.com', 'vendedor', 9, 'activo', 'CC', '1019004504'],
            ['Eje Cafetero Inmobiliaria', 'ejecafetero@example.com', 'inmobiliaria', 9, 'activo', 'NIT', '900450102'],
            ['Julián Martínez', 'julian.martinez@example.com', 'agente', 8, 'activo', 'CC', '1019004505'],
            ['Laura Cadavid', 'laura.cadavid@example.com', 'vendedor', 8, 'pendiente', 'CC', '1019004506'],
            ['Hernán Suárez', 'hernan.suarez@example.com', 'vendedor', 7, 'activo', 'CC', '1019004507'],
            ['Altos del Prado S.A.S.', 'altosdelprado@example.com', 'inmobiliaria', 6, 'activo', 'NIT', '900450103'],
            ['Diana Berrío', 'diana.berrio@example.com', 'agente', 6, 'activo', 'CC', '1019004508'],
            ['Óscar Meza', 'oscar.meza@example.com', 'vendedor', 5, 'activo', 'CC', '1019004509'],
            ['Paola Guzmán', 'paola.guzman@example.com', 'vendedor', 5, 'inactivo', 'CC', '1019004510'],
            ['Ricardo Bonilla', 'ricardo.bonilla@example.com', 'agente', 4, 'activo', 'CC', '1019004511'],
            ['Marcela Arango', 'marcela.arango@example.com', 'vendedor', 4, 'activo', 'CC', '1019004512'],
            ['Grupo Inmobiliario Caribe', 'grupocaribe@example.com', 'inmobiliaria', 3, 'activo', 'NIT', '900450104'],
            ['Felipe Cárdenas', 'felipe.cardenas@example.com', 'vendedor', 3, 'activo', 'CC', '1019004513'],
            ['Natalia Quintero', 'natalia.quintero@example.com', 'agente', 2, 'activo', 'CC', '1019004514'],
            ['Iván Darío Mora', 'ivan.mora@example.com', 'vendedor', 2, 'pendiente', 'CC', '1019004515'],
            ['Sara Lozano', 'sara.lozano@example.com', 'vendedor', 1, 'activo', 'CC', '1019004516'],
            ['Mauricio Torres', 'mauricio.torres@example.com', 'agente', 1, 'activo', 'CC', '1019004517'],
            ['Estefanía Buitrago', 'estefania.buitrago@example.com', 'vendedor', 0, 'activo', 'CC', '1019004518'],
        ];

        $creados = [];

        foreach ($usuarios as $indice => [$nombre, $correo, $rol, $mesesAtras, $estado, $tipoDoc, $numeroDoc]) {
            $usuario = User::firstOrCreate(
                ['email' => $correo],
                [
                    'name' => $nombre,
                    'password' => self::CLAVE,
                    'role_id' => $roles[$rol],
                    'estado' => $estado,
                    'telefono' => '30' . str_pad((string) (52000000 + $indice * 137), 8, '0', STR_PAD_LEFT),
                    'tipo_documento' => $tipoDoc,
                    'numero_documento' => $numeroDoc,
                    'email_verified_at' => now(),
                    'created_at' => now()->subMonths($mesesAtras)->subDays($indice % 20),
                ]
            );

            $creados[] = $usuario;
        }

        $this->sembrarMembresias($creados, $roles);
    }

    /**
     * Para cada vendedor e inmobiliaria deja:
     * - una membresía histórica ya vencida (historial de pagos)
     * - una membresía vigente (las que alimentan el KPI de ingresos)
     * - en algunos casos, una cancelada para variedad en los reportes.
     */
    private function sembrarMembresias(array $usuarios, $roles): void
    {
        $publicantes = array_values(array_filter($usuarios, function (User $usuario) use ($roles) {
            return in_array($usuario->role_id, [$roles['vendedor'], $roles['inmobiliaria']], true);
        }));

        $planes = array_keys(Membresia::PRECIOS_PLAN);
        $numeroPago = 1;

        foreach ($publicantes as $indice => $usuario) {
            $plan = $planes[$indice % count($planes)];

            // ----- Membresía histórica (ya vencida) -----
            $inicioHistorica = $usuario->created_at->copy()->addDays(2);
            $this->crearMembresia($usuario, $plan, 'vencida', $inicioHistorica, $numeroPago++);

            // ----- Membresía vigente (empezó hace pocos días) -----
            $inicioVigente = now()->subDays($indice * 2);
            $cancelada = $indice % 7 === 5; // una que otra cancelada para variedad
            $this->crearMembresia($usuario, $plan, $cancelada ? 'cancelada' : 'activa', $inicioVigente, $numeroPago++);
        }
    }

    private function crearMembresia(User $usuario, string $plan, string $estado, $inicio, int $numeroPago): void
    {
        Membresia::firstOrCreate(
            [
                'user_id' => $usuario->id,
                'referencia_pago' => 'PSE-' . str_pad((string) $numeroPago, 5, '0', STR_PAD_LEFT),
            ],
            [
                'plan' => $plan,
                'precio' => Membresia::PRECIOS_PLAN[$plan],
                'estado' => $estado,
                'fecha_inicio' => $inicio->toDateString(),
                'fecha_fin' => Membresia::calcularFin($plan, $inicio)->toDateString(),
                'created_at' => $inicio,
                'updated_at' => $inicio,
            ]
        );
    }
}
