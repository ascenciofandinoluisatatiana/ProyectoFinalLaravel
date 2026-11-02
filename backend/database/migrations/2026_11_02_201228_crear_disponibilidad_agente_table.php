<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Horarios en los que atiende cada agente.
     * Cada fila es un tramo: por ejemplo, lunes de 08:00 a 12:00.
     */
    public function up(): void
    {
        Schema::create('disponibilidad_agente', function (Blueprint $table) {
            $table->id();

            // Agente al que pertenece el horario (una cuenta de la tabla users).
            // Si la cuenta se borra, sus horarios se borran con ella.
            $table->foreignId('agente_id')->constrained('users')->cascadeOnDelete();

            // Día de la semana. Valor por definir con el equipo (sugerido: 1 = lunes ... 7 = domingo)
            $table->smallInteger('dia_semana');

            $table->time('hora_inicio');
            $table->time('hora_fin');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disponibilidad_agente');
    }
};