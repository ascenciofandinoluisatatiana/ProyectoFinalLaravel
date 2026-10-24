<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bitácora de eventos de seguridad y de acceso.
     */
    public function up(): void
    {
        Schema::create('eventos_seguridad', function (Blueprint $table) {
            $table->id();

            // Null si el evento no corresponde a una cuenta existente;
            // si la cuenta se borra, el evento se conserva
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Por ejemplo: inicio_sesion | intento_fallido | bloqueo
            $table->string('tipo', 40);

            $table->string('ip', 45)->nullable();
            $table->string('dispositivo', 150)->nullable();

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_seguridad');
    }
};