<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Conecta cada propiedad con las listas fijas de tipo, municipio
     * y estado, copiando lo que hoy está escrito como texto.
     */
    public function up(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            // Vacías mientras el código no las llene
            $table->foreignId('tipo_id')->nullable()->constrained('tipos_propiedad');
            $table->foreignId('municipio_id')->nullable()->constrained('municipios');
            $table->foreignId('estado_id')->nullable()->constrained('estados_propiedad');
        });

        // Tipo: por nombre
        DB::statement("
            UPDATE propiedades
            SET tipo_id = tp.id
            FROM tipos_propiedad tp
            WHERE LOWER(tp.nombre) = LOWER(propiedades.tipo)
        ");

        // Municipio: por nombre de ciudad y de departamento juntos
        DB::statement("
            UPDATE propiedades
            SET municipio_id = m.id
            FROM municipios m
            JOIN departamentos d ON d.id = m.departamento_id
            WHERE LOWER(m.nombre) = LOWER(propiedades.ciudad)
              AND LOWER(d.nombre) = LOWER(propiedades.departamento)
        ");

        // Estado: vendida y arrendada se conservan; el resto queda disponible
        DB::statement("
            UPDATE propiedades
            SET estado_id = e.id
            FROM estados_propiedad e
            WHERE LOWER(e.nombre) = CASE propiedades.estado
                WHEN 'vendida' THEN 'vendida'
                WHEN 'arrendada' THEN 'arrendada'
                ELSE 'disponible'
            END
        ");
    }

    public function down(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tipo_id');
            $table->dropConstrainedForeignId('municipio_id');
            $table->dropConstrainedForeignId('estado_id');
        });
    }
};