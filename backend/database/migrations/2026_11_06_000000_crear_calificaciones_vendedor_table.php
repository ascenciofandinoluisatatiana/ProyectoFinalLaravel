<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Calificaciones y comentarios que los visitantes dejan a un vendedor o inmobiliaria. */
    public function up(): void
    {
        Schema::create('calificaciones_vendedor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendedor_id')->constrained('users')->cascadeOnDelete();
            // Propiedad desde la que se dejó la reseña (opcional; si se borra, la reseña se conserva)
            $table->foreignId('propiedad_id')->nullable()->constrained('propiedades')->nullOnDelete();
            $table->string('nombre', 60);
            $table->unsignedTinyInteger('estrellas');
            $table->text('comentario')->nullable();
            // SHA-256 del identificador anónimo del dispositivo: una reseña por dispositivo y vendedor
            $table->string('huella', 64);
            $table->timestamps();

            $table->unique(['vendedor_id', 'huella']);
            $table->index(['vendedor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calificaciones_vendedor');
    }
};
