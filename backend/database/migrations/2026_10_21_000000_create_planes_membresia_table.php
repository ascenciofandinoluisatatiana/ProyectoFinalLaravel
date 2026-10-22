<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Planes de membresía con su precio en COP (RF-048).
     * Hasta ahora los precios estaban fijos en el código; con esta tabla
     * el administrador los cambia desde el panel sin tocar nada.
     */
    public function up(): void
    {
        Schema::create('planes_membresia', function (Blueprint $table) {
            $table->id();
            $table->string('plan', 15)->unique();   // semanal | quincenal | mensual
            $table->string('nombre', 30);
            $table->unsignedSmallInteger('dias');   // 7 | 15 | 30
            $table->decimal('precio', 12, 2);       // COP
            $table->timestamps();
        });

        // Valores iniciales: los mismos precios que ya usaba el portal
        $ahora = now();
        DB::table('planes_membresia')->insert([
            ['plan' => 'semanal',   'nombre' => 'Semanal',   'dias' => 7,  'precio' => 19900, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['plan' => 'quincenal', 'nombre' => 'Quincenal', 'dias' => 15, 'precio' => 34900, 'created_at' => $ahora, 'updated_at' => $ahora],
            ['plan' => 'mensual',   'nombre' => 'Mensual',   'dias' => 30, 'precio' => 59900, 'created_at' => $ahora, 'updated_at' => $ahora],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('planes_membresia');
    }
};
