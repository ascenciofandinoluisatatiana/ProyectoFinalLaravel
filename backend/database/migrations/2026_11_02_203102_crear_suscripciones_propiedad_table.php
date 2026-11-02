<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Alguien deja su correo para recibir avisos de una publicación concreta.
     */
    public function up(): void
    {
        Schema::create('suscripciones_propiedad', function (Blueprint $table) {
            $table->id();

            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();

            $table->string('correo', 150);

            // Tipo de aviso. Valores por definir con el equipo (cambio de precio, cambio de estado...)
            $table->string('tipo_alerta', 10);

            // Se puede pausar sin borrarla
            $table->boolean('activa')->default(true);

            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suscripciones_propiedad');
    }
};