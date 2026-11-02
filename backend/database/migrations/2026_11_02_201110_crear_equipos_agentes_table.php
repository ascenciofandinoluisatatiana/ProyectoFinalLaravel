<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Equipos en los que una inmobiliaria organiza a sus agentes.
     */
    public function up(): void
    {
        Schema::create('equipos_agentes', function (Blueprint $table) {
            $table->id();

            // Inmobiliaria dueña del equipo (una cuenta de la tabla users).
            // Si la cuenta se borra, sus equipos se borran con ella.
            $table->foreignId('inmobiliaria_id')->constrained('users')->cascadeOnDelete();

            $table->string('nombre', 100);

            // Un equipo se puede desactivar sin borrarlo
            $table->boolean('activo')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipos_agentes');
    }
};