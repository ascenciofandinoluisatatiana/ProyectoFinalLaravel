<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Endurece la base de datos antes de las pruebas de carga y seguridad:
 *   1. Índices en las columnas que se buscan y se unen (búsquedas y borrados en cascada rápidos).
 *   2. Reglas de validación en la base (precios, áreas, estrellas, estados...), además de las del código.
 *   3. Correo único sin distinguir mayúsculas.
 *
 * No borra ni cambia datos, salvo pasar los correos a minúsculas.
 * Las reglas se crean con NOT VALID: se aplican a todo lo nuevo, y si los datos actuales
 * las cumplen, se validan también (si no, quedan solo para lo nuevo).
 */
return new class extends Migration
{
    /** tabla => lista de columnas (cada elemento es un índice; arreglo = índice compuesto) */
    private function indices(): array
    {
        return [
            'propiedades' => [['estado', 'operacion'], ['estado', 'tipo'], ['ciudad'], ['precio'], ['user_id'], ['agente_id'],
                ['propietario_id'], ['verificador_id'], ['tipo_id'], ['municipio_id'], ['estado_id']],
            'publicaciones' => [['propiedad_id'], ['publicador_id'], ['operacion_id'], ['estado', 'nivel_posicionamiento']],
            'leads' => [['propiedad_id'], ['agente_id'], ['publicacion_id']],
            'visitas' => [['propiedad_id'], ['lead_id'], ['agente_id']],
            'users' => [['role_id'], ['inmobiliaria_id'], ['equipo_id'], ['role_id', 'estado']],
            'pagos' => [['user_id'], ['propiedad_id'], ['membresia_id'], ['oferta_id']],
            'paquetes_membresia' => [['pago_id'], ['oferta_id'], ['oferta_vendedor_id']],
            'membresias' => [['paquete_id']],
            'notificaciones' => [['user_id', 'leida', 'fecha']],
            'historial_publicacion' => [['publicacion_id']],
            'historial_estado_propiedad' => [['propiedad_id'], ['user_id']],
            'moderaciones' => [['publicacion_id'], ['moderador_id']],
            'procesos_venta' => [['publicacion_id'], ['lead_id']],
            'contratos_arriendo' => [['publicacion_id'], ['lead_id']],
            'solicitudes_alquiler' => [['publicacion_id'], ['lead_id']],
            'seguimiento_lead' => [['lead_id']],
            'vistas_publicacion' => [['publicacion_id'], ['sesion_id']],
            'comisiones' => [['propiedad_id'], ['venta_id'], ['contrato_id']],
            'calificaciones_vendedor' => [['propiedad_id']],
            'propietarios' => [['registrado_por']],
            'registro_correo' => [['user_id']],
            'eventos_seguridad' => [['user_id'], ['fecha']],
            'auditorias' => [['user_id'], ['fecha']],
            'movimientos' => [['user_id'], ['fecha']],
            'documentos_identidad' => [['user_id']],
            'verificaciones' => [['decidido_por'], ['documento_id']],
        ];
    }

    /** tabla => [nombre de la regla => condición] */
    private function reglas(): array
    {
        return [
            'propiedades' => [
                'precio_positivo' => 'precio > 0',
                'area_positiva' => 'area > 0',
                'cuartos_no_negativos' => 'habitaciones >= 0 AND banos >= 0 AND parqueaderos >= 0',
                'estrato_valido' => 'estrato IS NULL OR estrato BETWEEN 1 AND 6',
                'coordenadas_validas' => 'lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180',
                'tipo_valido' => "tipo IN ('apartamento','casa','finca','local','lote','oficina')",
                'operacion_valida' => "operacion IN ('venta','arriendo')",
                'estado_valido' => "estado IN ('borrador','publicada','pausada','vendida','arrendada')",
            ],
            'publicaciones' => [
                'precio_no_negativo' => 'precio_cop >= 0',
                'nivel_valido' => 'nivel_posicionamiento BETWEEN 0 AND 3',
            ],
            'calificaciones_vendedor' => ['estrellas_validas' => 'estrellas BETWEEN 1 AND 5'],
            'planes_membresia' => ['plan_valido' => 'precio >= 0 AND dias > 0'],
            'ofertas_paquete' => ['oferta_valida' => 'descuento BETWEEN 0 AND 100 AND publicaciones > 0'],
            'ofertas_vendedor' => ['oferta_valida' => 'precio >= 0 AND dias > 0 AND propiedades > 0'],
            'pagos' => ['monto_no_negativo' => 'monto_centavos >= 0'],
            'comisiones' => ['comision_valida' => 'porcentaje BETWEEN 0 AND 100 AND valor >= 0 AND base >= 0'],
            'membresias' => ['membresia_valida' => 'precio >= 0 AND fecha_fin >= fecha_inicio'],
            'users' => [
                'estado_valido' => "estado IN ('activo','inactivo','pendiente')",
                'intentos_validos' => 'intentos_fallidos >= 0',
            ],
        ];
    }

    public function up(): void
    {
        // 1) Índices (sirven igual en PostgreSQL y en SQLite de las pruebas)
        foreach ($this->indices() as $tabla => $lista) {
            if (! Schema::hasTable($tabla)) {
                continue;
            }
            foreach ($lista as $columnas) {
                if (! Schema::hasColumns($tabla, $columnas)) {
                    continue;
                }
                $nombre = 'idx_' . $tabla . '_' . implode('_', $columnas);
                DB::statement('CREATE INDEX IF NOT EXISTS ' . $nombre . ' ON ' . $tabla . ' (' . implode(', ', $columnas) . ')');
            }
        }

        // Lo que sigue es solo de PostgreSQL (las pruebas automáticas usan SQLite)
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // 2) Reglas de validación
        foreach ($this->reglas() as $tabla => $reglas) {
            if (! Schema::hasTable($tabla)) {
                continue;
            }
            foreach ($reglas as $nombre => $condicion) {
                $regla = 'ck_' . $tabla . '_' . $nombre;
                try {
                    DB::statement("ALTER TABLE {$tabla} DROP CONSTRAINT IF EXISTS {$regla}");
                    DB::statement("ALTER TABLE {$tabla} ADD CONSTRAINT {$regla} CHECK ({$condicion}) NOT VALID");

                    // Solo se valida si ninguna fila actual la rompe (así la migración nunca se cae)
                    $malas = DB::selectOne("SELECT count(*) AS n FROM {$tabla} WHERE NOT COALESCE(({$condicion}), true)")->n;
                    if ((int) $malas === 0) {
                        DB::statement("ALTER TABLE {$tabla} VALIDATE CONSTRAINT {$regla}");
                    } else {
                        Log::warning("La regla {$regla} queda solo para datos nuevos: {$malas} fila(s) actuales no la cumplen.");
                    }
                } catch (\Throwable $e) {
                    Log::warning("No se pudo crear la regla {$regla}: " . $e->getMessage());
                    throw $e;
                }
            }
        }

        // 3) Correo en minúsculas y único sin distinguir mayúsculas
        $repetidos = DB::select('SELECT lower(email) AS correo FROM users GROUP BY lower(email) HAVING count(*) > 1');
        if (count($repetidos) === 0) {
            DB::statement('UPDATE users SET email = lower(email) WHERE email <> lower(email)');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS users_email_minusculas_unico ON users (lower(email))');
        } else {
            Log::warning('Hay correos repetidos que solo cambian en mayúsculas; no se creó el índice único: '
                . implode(', ', array_map(fn ($f) => $f->correo, $repetidos)));
        }
    }

    public function down(): void
    {
        foreach ($this->indices() as $tabla => $lista) {
            foreach ($lista as $columnas) {
                DB::statement('DROP INDEX IF EXISTS idx_' . $tabla . '_' . implode('_', $columnas));
            }
        }

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->reglas() as $tabla => $reglas) {
            if (! Schema::hasTable($tabla)) {
                continue;
            }
            foreach (array_keys($reglas) as $nombre) {
                DB::statement("ALTER TABLE {$tabla} DROP CONSTRAINT IF EXISTS ck_{$tabla}_{$nombre}");
            }
        }
        DB::statement('DROP INDEX IF EXISTS users_email_minusculas_unico');
    }
};
