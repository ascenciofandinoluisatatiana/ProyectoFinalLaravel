<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Qué avisos quiere recibir cada usuario y por qué canal.
     */
    public function up(): void
    {
        Schema::create('preferencias_comunicacion', function (Blueprint $table) {
            $table->id();

            // Si la cuenta se borra, sus preferencias se borran con ella
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Canal por el que recibe el aviso. Valores por definir con el equipo (correo, portal...)
            $table->string('canal', 10);

            // Tipo de mensaje. Valores por definir con el equipo
            $table->string('tipo_mensaje', 40);

            $table->boolean('activa')->default(true);

            // Cuándo dio su consentimiento para recibir este aviso
            $table->timestamp('consentimiento_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preferencias_comunicacion');
    }
};