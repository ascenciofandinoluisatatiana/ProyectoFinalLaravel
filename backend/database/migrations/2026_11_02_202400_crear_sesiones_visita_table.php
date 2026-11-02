<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cada visitante del portal (con o sin cuenta), para las estadísticas.
     * No guarda datos personales.
     */
    public function up(): void
    {
        Schema::create('sesiones_visita', function (Blueprint $table) {
            $table->id();

            // País desde el que visita (código de 2 letras, por ejemplo CO)
            $table->char('pais', 2)->nullable();

            // Idioma en el que ve el portal. Si el idioma se borra, la sesión se conserva.
            $table->char('idioma', 2)->nullable();
            $table->foreign('idioma')->references('codigo')->on('idiomas')->nullOnDelete();

            // Tipo de dispositivo. Valores por definir con el equipo (celular, computador, tableta...)
            $table->string('dispositivo', 20)->nullable();

            $table->timestamp('fecha_inicio')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sesiones_visita');
    }
};