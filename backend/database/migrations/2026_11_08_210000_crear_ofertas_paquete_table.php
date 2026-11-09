<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Paquetes de publicaciones que el administrador ofrece a las inmobiliarias.
 * El precio no se guarda: se calcula con el precio del plan, las publicaciones y el descuento.
 * Los días de vigencia los define el plan (semanal 7, quincenal 15, mensual 30).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ofertas_paquete', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 60)->unique();
            $table->string('plan', 10);                              // semanal | quincenal | mensual
            $table->unsignedSmallInteger('publicaciones');
            $table->unsignedTinyInteger('descuento')->default(0);    // porcentaje 0-90
            $table->string('dirigido_a', 20)->default('inmobiliaria');
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        // Paquetes iniciales: el administrador los puede editar o borrar desde su panel
        $ahora = now();
        DB::table('ofertas_paquete')->insert([
            ['nombre' => 'Bronce', 'plan' => 'semanal',   'publicaciones' => 10, 'descuento' => 15, 'dirigido_a' => 'inmobiliaria', 'activa' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['nombre' => 'Plata',  'plan' => 'quincenal', 'publicaciones' => 10, 'descuento' => 20, 'dirigido_a' => 'inmobiliaria', 'activa' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['nombre' => 'Oro',    'plan' => 'mensual',   'publicaciones' => 10, 'descuento' => 25, 'dirigido_a' => 'inmobiliaria', 'activa' => true, 'created_at' => $ahora, 'updated_at' => $ahora],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('ofertas_paquete');
    }
};
