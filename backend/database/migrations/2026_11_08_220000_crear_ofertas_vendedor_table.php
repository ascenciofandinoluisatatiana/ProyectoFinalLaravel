<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Paquetes (planes) que el administrador ofrece a los vendedores.
 * Nacen de los 3 planes por propiedad que ya existen (semanal, quincenal, mensual):
 * "plan_base" guarda cuál es, para mantener sincronizado su precio con planes_membresia
 * mientras el resto del sistema siga leyendo esa tabla.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ofertas_vendedor', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 60)->unique();
            $table->unsignedSmallInteger('dias');
            $table->unsignedBigInteger('precio');
            $table->unsignedSmallInteger('propiedades')->default(1);
            $table->string('plan_base', 10)->nullable();   // semanal | quincenal | mensual (solo los 3 de origen)
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        // Los 3 planes actuales, con los precios que tengan hoy
        $precios = Schema::hasTable('planes_membresia')
            ? DB::table('planes_membresia')->pluck('precio', 'plan')->all()
            : [];

        $base = [
            ['plan' => 'semanal',   'nombre' => 'Semanal',   'dias' => 7,  'precio' => 19900],
            ['plan' => 'quincenal', 'nombre' => 'Quincenal', 'dias' => 15, 'precio' => 34900],
            ['plan' => 'mensual',   'nombre' => 'Mensual',   'dias' => 30, 'precio' => 59900],
        ];

        $ahora = now();
        foreach ($base as $p) {
            DB::table('ofertas_vendedor')->insert([
                'nombre' => $p['nombre'],
                'dias' => $p['dias'],
                'precio' => (int) round((float) ($precios[$p['plan']] ?? $p['precio'])),
                'propiedades' => 1,
                'plan_base' => $p['plan'],
                'activa' => true,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ofertas_vendedor');
    }
};
