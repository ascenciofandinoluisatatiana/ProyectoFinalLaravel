<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Planes nuevos: publicación normal por tiempo y posicionamiento de normales.
        Schema::create('planes_publicacion', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 20);                       // normal | posicionamiento
            $table->unsignedSmallInteger('dias');             // 7 | 15 | 30
            $table->unsignedBigInteger('precio');             // COP
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->unique(['tipo', 'dias']);
        });

        // Precios iniciales de ejemplo (el administrador los cambia desde su panel).
        $ahora = now();
        $filas = [];
        foreach (['normal' => [7 => 9900, 15 => 17900, 30 => 29900],
                  'posicionamiento' => [7 => 14900, 15 => 26900, 30 => 44900]] as $tipo => $plazos) {
            foreach ($plazos as $dias => $precio) {
                $filas[] = ['tipo' => $tipo, 'dias' => $dias, 'precio' => $precio, 'activo' => true,
                            'created_at' => $ahora, 'updated_at' => $ahora];
            }
        }
        DB::table('planes_publicacion')->insert($filas);

        // Fechas en que vence cada cosa en la propiedad (vacío = no aplica / sin vencimiento).
        Schema::table('propiedades', function (Blueprint $table) {
            $table->timestamp('publicada_hasta')->nullable();
            $table->timestamp('posicionada_hasta')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropColumn(['publicada_hasta', 'posicionada_hasta']);
        });
        Schema::dropIfExists('planes_publicacion');
    }
};
