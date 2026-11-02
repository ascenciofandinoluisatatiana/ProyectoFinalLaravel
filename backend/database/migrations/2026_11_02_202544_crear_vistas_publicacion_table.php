<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cada vez que alguien ve una publicación, para contar las vistas.
     */
    public function up(): void
    {
        Schema::create('vistas_publicacion', function (Blueprint $table) {
            $table->id();

            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();

            // Sesión del visitante. Si la sesión se borra, la vista se conserva.
            $table->foreignId('sesion_id')->nullable()->constrained('sesiones_visita')->nullOnDelete();

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vistas_publicacion');
    }
};