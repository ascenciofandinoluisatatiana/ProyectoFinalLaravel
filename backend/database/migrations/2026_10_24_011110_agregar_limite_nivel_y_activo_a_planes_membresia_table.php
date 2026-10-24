<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Beneficios configurables de cada plan de membresía.
     */
    public function up(): void
    {
        Schema::table('planes_membresia', function (Blueprint $table) {
            // Publicaciones activas permitidas; null = aún sin límite definido
            $table->unsignedInteger('limite_publicaciones')->nullable();

            // Mayor número = mejor posición en los resultados; 0 = sin prioridad extra
            $table->smallInteger('nivel_posicionamiento')->default(0);

            // Si el plan se puede contratar
            $table->boolean('activo')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('planes_membresia', function (Blueprint $table) {
            $table->dropColumn(['limite_publicaciones', 'nivel_posicionamiento', 'activo']);
        });
    }
};