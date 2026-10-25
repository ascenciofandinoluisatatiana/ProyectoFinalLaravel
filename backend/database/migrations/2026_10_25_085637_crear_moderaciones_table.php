<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Revisión (moderación) de las publicaciones antes de mostrarse.
     */
    public function up(): void
    {
        Schema::create('moderaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();

            // Cuenta (administrador o soporte) que hizo la revisión
            $table->foreignId('moderador_id')->constrained('users');

            // Por ejemplo: aprobada | rechazada
            $table->string('resultado', 20);

            $table->text('motivo')->nullable();
            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderaciones');
    }
};