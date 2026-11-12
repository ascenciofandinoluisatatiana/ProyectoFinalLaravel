<?php

namespace Database\Seeders;

use App\Models\Comision;
use App\Models\Propiedad;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Fase 2 del llenado de Umbral: da movimiento a las cuentas y publicaciones que creó LlenadoUmbralSeeder.
 *   - contactos (leads) y su seguimiento
 *   - visitas (pasadas, próximas y algunas en las próximas 24 horas)
 *   - pagos de membresías (aprobados, rechazados, pendientes...)
 *   - calificaciones de vendedores
 *   - cierres (propiedades vendidas / arrendadas) con su comisión del 4 %
 *   - movimientos de ejemplo para la bitácora del administrador
 *
 * Las notificaciones de la campana NO se guardan: se arman solas con estos datos (últimos 30 días).
 *
 *   php artisan db:seed --class=Fase2UmbralSeeder
 *   php artisan db:seed --class=QuitarFase2UmbralSeeder   (lo deshace)
 */
class Fase2UmbralSeeder extends Seeder
{
    public const YOLA = 'gomezoyolajorge12@gmail.com';
    public const LUZ = 'luzenidloaizagonzalez6@gmail.com';
    public const HEIDY = 'heidygr5821@gmail.com';
    public const ADMIN = 'adminumbral87@gmail.com';

    /** Las IP de ejemplo de la bitácora usan estos rangos de documentación; así se pueden quitar sin tocar movimientos reales. */
    public const IPS = ['203.0.113.', '198.51.100.'];

    private array $nombres = ['Camila', 'Andrés', 'Valentina', 'Sebastián', 'Laura', 'Julián', 'Daniela', 'Santiago', 'Natalia', 'Felipe', 'Paola', 'Mauricio', 'Diana', 'Ricardo', 'Marcela', 'Hernán', 'Sara', 'Iván', 'Estefanía', 'Óscar', 'Juliana', 'Carlos', 'Mariana', 'Esteban', 'Luisa', 'Jorge'];
    private array $apellidos = ['Restrepo', 'Villamizar', 'Prieto', 'Ocampo', 'Cadavid', 'Martínez', 'Suárez', 'Berrío', 'Meza', 'Guzmán', 'Bonilla', 'Arango', 'Cárdenas', 'Quintero', 'Mora', 'Lozano', 'Torres', 'Buitrago', 'Gómez', 'Rojas', 'Pérez', 'Castaño'];

    /** Ids de las cuentas que publican en el llenado (inmobiliariaNN, vendedorNN y las reales). */
    public static function duenosIds(): array
    {
        return DB::table('users')->where(function ($q) {
            $q->where('email', 'like', 'inmobiliaria__@demo.umbral.co')
                ->orWhere('email', 'like', 'vendedor__@demo.umbral.co')
                ->orWhereIn('email', [self::YOLA, self::LUZ]);
        })->pluck('id')->all();
    }

    private function elegir(array $lista)
    {
        return $lista[array_rand($lista)];
    }

    private function persona(): string
    {
        return $this->elegir($this->nombres) . ' ' . $this->elegir($this->apellidos);
    }

    private function telefono(): string
    {
        return '+57 3' . mt_rand(0, 2) . mt_rand(0, 9) . ' ' . mt_rand(100, 999) . ' ' . mt_rand(1000, 9999);
    }

    /** Elige una clave según pesos: ['a' => 50, 'b' => 30, ...] */
    private function pesos(array $mapa): string
    {
        $total = array_sum($mapa);
        $r = mt_rand(1, $total);
        foreach ($mapa as $clave => $peso) {
            if (($r -= $peso) <= 0) {
                return (string) $clave;
            }
        }

        return (string) array_key_first($mapa);
    }

    private function titulo(object $p): string
    {
        return ucfirst($p->tipo) . ' en ' . $p->barrio;
    }

    public function run(): void
    {
        $duenos = self::duenosIds();
        if (! $duenos) {
            $this->command->error('No hay cuentas del llenado. Corre primero LlenadoUmbralSeeder.');

            return;
        }
        $yaHay = DB::table('leads')->whereIn('propiedad_id', fn ($q) => $q->select('id')->from('propiedades')->whereIn('user_id', $duenos))->exists();
        if ($yaHay) {
            $this->command->error('Ya hay datos de la fase 2. Corre antes QuitarFase2UmbralSeeder.');

            return;
        }

        $yola = (int) DB::table('users')->where('email', self::YOLA)->value('id');
        $luz = (int) DB::table('users')->where('email', self::LUZ)->value('id');
        $heidy = (int) DB::table('users')->where('email', self::HEIDY)->value('id');
        $admin = (int) DB::table('users')->where('email', self::ADMIN)->value('id');

        $props = DB::table('propiedades')->whereIn('user_id', $duenos)->where('estado', 'publicada')
            ->get(['id', 'user_id', 'agente_id', 'tipo', 'barrio', 'ciudad', 'precio', 'operacion'])->keyBy('id');

        // Las cuentas reales reciben más movimiento, para que se vean llenas cuando entren
        $bolsa = [];
        foreach ($props as $p) {
            $peso = in_array((int) $p->user_id, [$yola, $luz], true) ? 4 : 1;
            for ($i = 0; $i < $peso; $i++) {
                $bolsa[] = $p->id;
            }
        }

        $leads = $this->contactos($props, $bolsa);
        $this->visitas($props, $leads, $yola);
        $this->pagos($duenos, $yola, $luz);
        $this->calificaciones($duenos, $props, $luz);
        $this->cierres($props, $yola);
        $this->movimientos($duenos, $props, $heidy, $admin);

        $this->command->info('Fase 2 lista. Las notificaciones de la campana se arman solas con estos datos.');
    }

    /* ---------------- Contactos y seguimiento ---------------- */

    private function contactos($props, array $bolsa): array
    {
        $mensajes = [
            'Hola, me interesa este inmueble. ¿Sigue disponible?',
            'Buenos días, quisiera más información y saber si puedo agendar una visita.',
            '¿Cuál es el valor final? ¿Aceptan negociación?',
            'Me gustaría conocerlo este fin de semana, ¿es posible?',
            '¿Incluye parqueadero y depósito? Quedo atento.',
            'Estoy interesado, ¿qué documentos necesito para avanzar?',
            '¿Aceptan mascotas? Tengo un perro pequeño.',
            'Hola, ¿pueden enviarme más fotos y la ubicación exacta?',
        ];
        $notas = [
            'nota' => ['Cliente interesado, pide más fotos.', 'Quiere negociar el precio.', 'Prefiere que lo llamen en la tarde.', 'Ya conoce la zona, busca algo similar.'],
            'llamada' => ['Se llamó, no contestó. Reintentar mañana.', 'Hablamos 10 minutos, quedó en confirmar visita.', 'Llamada realizada, enviará documentos.'],
            'tarea' => ['Enviar fotos adicionales por WhatsApp.', 'Confirmar disponibilidad con el propietario.', 'Enviar propuesta de precio.'],
        ];

        $publicaciones = DB::table('publicaciones')->whereIn('propiedad_id', $props->keys())->pluck('id', 'propiedad_id');
        $creados = [];

        DB::transaction(function () use ($props, $bolsa, $mensajes, $notas, $publicaciones, &$creados) {
            for ($i = 0; $i < 450; $i++) {
                $p = $props[$bolsa[array_rand($bolsa)]];
                $dias = mt_rand(1, 100) <= 65 ? mt_rand(0, 29) : mt_rand(30, 90);
                $fecha = now()->subDays($dias)->subMinutes(mt_rand(0, 1300));
                $estado = $dias < 10
                    ? $this->pesos(['nuevo' => 55, 'en_seguimiento' => 35, 'descartado' => 10])
                    : $this->pesos(['nuevo' => 15, 'en_seguimiento' => 35, 'cerrado' => 25, 'descartado' => 25]);
                $nombre = $this->persona();
                $contacto = mt_rand(0, 1) ? $this->telefono() : Str::slug($nombre, '.') . mt_rand(1, 99) . '@ejemplo.co';

                $id = DB::table('leads')->insertGetId([
                    'propiedad_id' => $p->id,
                    'agente_id' => $p->agente_id,
                    'publicacion_id' => $publicaciones[$p->id] ?? null,
                    'nombre' => $nombre,
                    'contacto' => $contacto,
                    'mensaje' => $this->elegir($mensajes),
                    'consentimiento' => true,
                    'clasificacion' => null,
                    'estado' => $estado,
                    'created_at' => $fecha->toDateTimeString(),
                    'updated_at' => $fecha->copy()->addHours(mt_rand(1, 48))->min(now())->toDateTimeString(),
                ]);
                $creados[] = ['id' => $id, 'p' => $p, 'estado' => $estado, 'fecha' => $fecha, 'nombre' => $nombre, 'contacto' => $contacto];

                if ($estado !== 'nuevo') {
                    $cuantos = $estado === 'en_seguimiento' ? mt_rand(1, 3) : mt_rand(2, 3);
                    for ($k = 0; $k < $cuantos; $k++) {
                        $tipo = $this->pesos(['nota' => 40, 'llamada' => 40, 'tarea' => 20]);
                        $cuando = $fecha->copy()->addHours(($k + 1) * mt_rand(3, 30))->min(now());
                        DB::table('seguimiento_lead')->insert([
                            'lead_id' => $id,
                            'user_id' => $p->agente_id ?: $p->user_id,
                            'tipo' => $tipo,
                            'nota' => $this->elegir($notas[$tipo]),
                            'fecha_tarea' => $tipo === 'tarea' ? $cuando->copy()->addDays(mt_rand(1, 7))->toDateTimeString() : null,
                            'fecha' => $cuando->toDateTimeString(),
                        ]);
                    }
                }
            }
        });
        $this->command->info('Contactos: ' . count($creados));

        return $creados;
    }

    /* ---------------- Visitas ---------------- */

    private function visitas($props, array $leads, int $yola): void
    {
        $candidatos = array_values(array_filter($leads, fn ($l) => $l['estado'] !== 'descartado'));
        shuffle($candidatos);
        $candidatos = array_slice($candidatos, 0, 220);
        $total = 0;

        $crear = function (array $l, $fecha, string $estado, $actualizada) use (&$total) {
            DB::table('visitas')->insert([
                'propiedad_id' => $l['p']->id,
                'lead_id' => $l['id'],
                'agente_id' => $l['p']->agente_id,
                'nombre' => $l['nombre'],
                'contacto' => $l['contacto'],
                'fecha' => $fecha->toDateTimeString(),
                'estado' => $estado,
                'nota' => null,
                'created_at' => $l['fecha']->copy()->addHours(mt_rand(2, 40))->min(now())->toDateTimeString(),
                'updated_at' => $actualizada->toDateTimeString(),
            ]);
            $total++;
        };

        DB::transaction(function () use ($candidatos, $crear, $yola) {
            foreach ($candidatos as $l) {
                if (mt_rand(1, 100) <= 60) {   // pasada
                    $fecha = $l['fecha']->copy()->addDays(mt_rand(1, 10))->setTime(mt_rand(9, 17), [0, 30][mt_rand(0, 1)]);
                    if ($fecha->gt(now()->subHours(2))) {
                        $fecha = now()->subDays(mt_rand(1, 5))->setTime(mt_rand(9, 17), 0);
                    }
                    $estado = $this->pesos(['realizada' => 70, 'cancelada' => 30]);
                    $crear($l, $fecha, $estado, $estado === 'cancelada' ? now()->subDays(mt_rand(0, 20)) : $fecha);
                } else {                         // próxima
                    $fecha = now()->addDays(mt_rand(1, 14))->setTime(mt_rand(9, 17), [0, 30][mt_rand(0, 1)]);
                    $estado = $this->pesos(['pendiente' => 50, 'confirmada' => 50]);
                    $crear($l, $fecha, $estado, $estado === 'confirmada' ? now()->subDays(mt_rand(0, 8)) : now()->subDays(mt_rand(0, 3)));
                }
            }

            // Visitas dentro de las próximas 24 horas en la inmobiliaria real (para ver el aviso "visita próxima")
            $deYola = array_values(array_filter($candidatos, fn ($l) => (int) $l['p']->user_id === $yola));
            foreach (array_slice($deYola, 0, 4) as $i => $l) {
                $crear($l, now()->addHours(3 + $i * 5), $i % 2 ? 'confirmada' : 'pendiente', now()->subHours(mt_rand(1, 30)));
            }
        });
        $this->command->info('Visitas: ' . $total);
    }

    /* ---------------- Pagos ---------------- */

    private function pagos(array $duenos, int $yola, int $luz): void
    {
        $membresias = DB::table('membresias')->where('referencia_pago', 'SEED')->get(['id', 'user_id', 'propiedad_id', 'plan', 'precio', 'fecha_inicio']);
        $reales = $membresias->filter(fn ($m) => in_array((int) $m->user_id, [$yola, $luz], true));
        $resto = $membresias->reject(fn ($m) => in_array((int) $m->user_id, [$yola, $luz], true))->shuffle()->take(120);
        $bancos = ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA Colombia', 'Banco de Occidente', 'Nequi', 'Banco Popular'];
        $metodos = ['PSE', 'CARD', 'NEQUI'];
        $n = 0;

        DB::transaction(function () use ($duenos, $reales, $resto, $bancos, $metodos, &$n) {
            foreach ($reales->concat($resto) as $m) {
                $n++;
                $metodo = $this->elegir($metodos);
                $cuando = \Illuminate\Support\Carbon::parse($m->fecha_inicio)->setTime(mt_rand(7, 21), mt_rand(0, 59));
                if ($cuando->gt(now())) {
                    $cuando = now()->subMinutes(mt_rand(5, 600));
                }
                DB::table('pagos')->insert([
                    'referencia' => sprintf('UMB-F2-%05d', $n),
                    'concepto' => 'membresia',
                    'user_id' => $m->user_id,
                    'propiedad_id' => $m->propiedad_id,
                    'membresia_id' => $m->id,
                    'plan' => $m->plan,
                    'monto_centavos' => (int) round($m->precio * 100),
                    'moneda' => 'COP',
                    'estado' => 'aprobado',
                    'proveedor' => 'wompi',
                    'transaccion_id' => 'WMP-' . strtoupper(Str::random(12)),
                    'metodo' => $metodo,
                    'banco' => $metodo === 'PSE' ? $this->elegir($bancos) : null,
                    'numero_comprobante' => sprintf('CMP-F2-%06d', $n),
                    'comprobante_url' => null,
                    'pagado_en' => $cuando->toDateTimeString(),
                    'created_at' => $cuando->copy()->subMinutes(mt_rand(1, 6))->toDateTimeString(),
                    'updated_at' => $cuando->toDateTimeString(),
                ]);
            }

            // Pagos que no se completaron (sin membresía asociada)
            $precios = ['semanal' => 29900, 'quincenal' => 49900, 'mensual' => 79900];
            $props = DB::table('propiedades')->whereIn('user_id', $duenos)->inRandomOrder()->limit(40)->get(['id', 'user_id']);
            foreach ($props as $p) {
                $n++;
                $estado = $this->pesos(['rechazado' => 40, 'pendiente' => 25, 'error' => 20, 'anulado' => 15]);
                $plan = $this->elegir(array_keys($precios));
                $cuando = now()->subDays(mt_rand(0, 28))->subMinutes(mt_rand(0, 900));
                DB::table('pagos')->insert([
                    'referencia' => sprintf('UMB-F2-%05d', $n),
                    'concepto' => 'membresia',
                    'user_id' => $p->user_id,
                    'propiedad_id' => $p->id,
                    'membresia_id' => null,
                    'plan' => $plan,
                    'monto_centavos' => $precios[$plan] * 100,
                    'moneda' => 'COP',
                    'estado' => $estado,
                    'proveedor' => 'wompi',
                    'transaccion_id' => 'WMP-' . strtoupper(Str::random(12)),
                    'metodo' => $this->elegir($metodos),
                    'banco' => null,
                    'numero_comprobante' => null,
                    'comprobante_url' => null,
                    'pagado_en' => null,
                    'created_at' => $cuando->toDateTimeString(),
                    'updated_at' => $cuando->copy()->addMinutes(mt_rand(1, 10))->toDateTimeString(),
                ]);
            }
        });
        $this->command->info('Pagos: ' . $n);
    }

    /* ---------------- Calificaciones ---------------- */

    private function calificaciones(array $duenos, $props, int $luz): void
    {
        $comentarios = [
            5 => ['Excelente atención, muy puntual y claro con la información.', 'Súper recomendado, nos ayudó en todo el proceso.', 'Muy amable y profesional. Volvería a contactarlo.', 'Respondió rápido y el inmueble era tal cual las fotos.'],
            4 => ['Buena atención, solo tardó un poco en responder.', 'Todo bien, el trato fue cordial y la visita muy útil.', 'Buen servicio, información clara.'],
            3 => ['Atención normal, esperaba un poco más de seguimiento.', 'El inmueble estaba bien, pero la comunicación fue regular.'],
            2 => ['Demoró varios días en responder.', 'La información no coincidía del todo con la publicación.'],
            1 => ['No respondió a mis mensajes.', 'Mala experiencia, no recomendado.'],
        ];
        $vendedores = DB::table('users')->whereIn('id', $duenos)->where('email', 'like', 'vendedor__@demo.umbral.co')->pluck('id')->all();
        $vendedores[] = $luz;
        $propsPorUsuario = $props->groupBy('user_id');
        $total = 0;

        DB::transaction(function () use ($vendedores, $luz, $comentarios, $propsPorUsuario, &$total) {
            foreach ($vendedores as $v) {
                $cuantos = $v === $luz ? 8 : mt_rand(3, 7);
                for ($i = 1; $i <= $cuantos; $i++) {
                    $est = (int) $this->pesos(['5' => 45, '4' => 30, '3' => 13, '2' => 7, '1' => 5]);
                    $propia = isset($propsPorUsuario[$v]) ? $propsPorUsuario[$v]->random()->id : null;
                    $fecha = now()->subDays(mt_rand(0, 120))->subMinutes(mt_rand(0, 1200));
                    DB::table('calificaciones_vendedor')->insert([
                        'vendedor_id' => $v,
                        'propiedad_id' => $propia,
                        'nombre' => mb_substr($this->persona(), 0, 60),
                        'estrellas' => $est,
                        'comentario' => mt_rand(1, 100) <= 85 ? $this->elegir($comentarios[$est]) : null,
                        'huella' => hash('sha256', "fase2-{$v}-{$i}"),
                        'created_at' => $fecha->toDateTimeString(),
                        'updated_at' => $fecha->toDateTimeString(),
                    ]);
                    $total++;
                }
            }
        });
        $this->command->info('Calificaciones: ' . $total);
    }

    /* ---------------- Cierres y comisiones ---------------- */

    private function cierres($props, int $yola): void
    {
        $conPosicion = DB::table('membresias')->where('referencia_pago', 'SEED')->pluck('propiedad_id')->filter()->flip();
        $inmobiliarias = DB::table('users')->where(function ($q) {
            $q->where('email', 'like', 'inmobiliaria__@demo.umbral.co')->orWhere('email', self::YOLA);
        })->pluck('id')->all();
        $total = 0;

        foreach ($inmobiliarias as $inmo) {
            $candidatas = $props->filter(fn ($p) => (int) $p->user_id === $inmo && $p->agente_id && ! isset($conPosicion[$p->id]))->shuffle();
            $cuantos = $inmo === $yola ? 6 : 3;
            foreach ($candidatas->take($cuantos) as $c) {
                $cierre = now()->subDays(mt_rand(0, 40))->subMinutes(mt_rand(0, 1000));
                // Con Eloquent, para que la publicación se sincronice con el nuevo estado
                $propiedad = Propiedad::find($c->id);
                $propiedad->estado = $c->operacion === 'venta' ? 'vendida' : 'arrendada';
                $propiedad->forceFill(['cerrada_en' => $cierre->toDateTimeString()])->save();

                $base = (int) $c->precio;
                $pagada = mt_rand(1, 100) <= 40;
                Comision::create([
                    'inmobiliaria_id' => $inmo,
                    'agente_id' => $c->agente_id,
                    'propiedad_id' => $c->id,
                    'inmueble' => mb_substr(ucfirst($c->tipo) . ' en ' . $c->barrio . ', ' . $c->ciudad, 0, 160),
                    'operacion' => $c->operacion,
                    'base' => $base,
                    'porcentaje' => Comision::PORCENTAJE,
                    'valor' => (int) round($base * Comision::PORCENTAJE / 100),
                    'estado' => $pagada ? 'pagada' : 'pendiente',
                    'origen' => 'panel',
                    'cerrada_en' => $cierre->toDateTimeString(),
                    'pagada_en' => $pagada ? $cierre->copy()->addDays(mt_rand(1, 6))->min(now())->toDateTimeString() : null,
                ]);
                $total++;
            }
        }
        $this->command->info('Cierres con comisión: ' . $total);
    }

    /* ---------------- Bitácora (movimientos) ---------------- */

    private function movimientos(array $duenos, $props, int $heidy, int $admin): void
    {
        $roles = DB::table('users')->join('roles', 'roles.id', '=', 'users.role_id')
            ->whereIn('users.id', array_merge($duenos, [$heidy, $admin]))->pluck('roles.nombre', 'users.id');
        $agentes = DB::table('users')->where('email', 'like', 'agente__%@demo.umbral.co')->pluck('id')->all();
        foreach ($agentes as $a) {
            $roles[$a] = 'agente';
        }
        $roles[$heidy] = 'agente';
        $ids = array_keys($roles->toArray());
        $propsPorUsuario = $props->groupBy('user_id');
        $dispositivos = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
        ];
        $campos = ['teléfono', 'foto de perfil', 'dirección', 'nombre', 'descripción'];
        $filas = [];

        $fila = function (int $usuario, string $accion, ?string $detalle, $fecha) use (&$filas, $roles, $dispositivos) {
            $filas[] = [
                'user_id' => $usuario,
                'rol' => $roles[$usuario] ?? null,
                'accion' => $accion,
                'detalle' => $detalle !== null ? mb_substr($detalle, 0, 255) : null,
                'ip' => $this->elegir(self::IPS) . mt_rand(2, 250),
                'dispositivo' => $this->elegir($dispositivos),
                'fecha' => $fecha->toDateTimeString(),
            ];
        };

        for ($i = 0; $i < 850; $i++) {
            $u = $ids[array_rand($ids)];
            if ($u === $admin) {
                continue;
            }
            $fecha = now()->subDays(mt_rand(0, 29))->subMinutes(mt_rand(0, 1400));
            $propia = isset($propsPorUsuario[$u]) ? $this->titulo($propsPorUsuario[$u]->random()) : null;
            $rol = $roles[$u];
            $accion = $this->pesos(['inicio_sesion' => 40, 'propiedad_publicada' => 18, 'visita_agendada' => 14, 'perfil_editado' => 10, 'membresia_comprada' => 10, 'contacto_atendido' => 8]);
            if ($rol === 'agente' && in_array($accion, ['propiedad_publicada', 'membresia_comprada'], true)) {
                $accion = 'contacto_atendido';
            }
            $detalle = match ($accion) {
                'inicio_sesion' => 'Inició sesión como ' . $rol,
                'propiedad_publicada' => $propia ?? 'Nueva propiedad',
                'visita_agendada' => 'Visita para ' . ($propia ?? 'una propiedad'),
                'perfil_editado' => 'Cambió: ' . $this->elegir($campos),
                'membresia_comprada' => 'Plan ' . $this->elegir(['semanal', 'quincenal', 'mensual']) . ($propia ? ' · ' . $propia : ''),
                default => 'Contacto de ' . $this->persona(),
            };
            $fila($u, $accion, $detalle, $fecha);
        }

        // Acciones del administrador
        $cuentas = DB::table('users')->whereIn('id', $duenos)->inRandomOrder()->limit(25)->get(['id', 'name', 'email']);
        foreach ($cuentas as $c) {
            $fecha = now()->subDays(mt_rand(0, 29))->subMinutes(mt_rand(0, 1400));
            $fila($admin, 'cuenta_creada', $c->name . ' (' . $c->email . ')', $fecha);
            if (mt_rand(1, 100) <= 30) {
                $fila($admin, 'enlace_clave_enviado', $c->name . ' (' . $c->email . ')', $fecha->copy()->addHours(mt_rand(1, 40))->min(now()));
            }
        }
        for ($i = 0; $i < 25; $i++) {
            $fila($admin, 'inicio_sesion', 'Inició sesión como administrador', now()->subDays(mt_rand(0, 29))->subMinutes(mt_rand(0, 1400)));
        }

        foreach (array_chunk($filas, 200) as $lote) {
            DB::table('movimientos')->insert($lote);
        }
        $this->command->info('Movimientos: ' . count($filas));
    }
}
