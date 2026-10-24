<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de los cambios de estado de cada propiedad.
     */
    public function up(): void
    {
        Schema::create('historial_estado_propiedad', function (Blueprint $table) {
            $table->id();
            $table->foreignId('propiedad_id')->constrained('propiedades')->cascadeOnDelete();
            $table->foreignId('estado_id')->constrained('estados_propiedad');

            // Cuenta que hizo el cambio
            $table->foreignId('user_id')->constrained('users');

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_estado_propiedad');
    }
};