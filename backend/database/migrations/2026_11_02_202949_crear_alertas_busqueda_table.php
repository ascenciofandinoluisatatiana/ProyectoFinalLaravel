<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Alertas de búsqueda: alguien deja su correo y lo que busca,
     * y el portal le avisa cuando aparece algo que coincide.
     */
    public function up(): void
    {
        Schema::create('alertas_busqueda', function (Blueprint $table) {
            $table->id();

            $table->string('correo', 150);

            // Lo que busca (ciudad, tipo, rango de precio...) en un solo campo
            $table->jsonb('criterios');

            // Idioma de los avisos. Si el idioma se borra, la alerta se conserva.
            $table->char('codigo_idioma', 2)->nullable();
            $table->foreign('codigo_idioma')->references('codigo')->on('idiomas')->nullOnDelete();

            // Se puede pausar sin borrarla
            $table->boolean('activa')->default(true);

            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas_busqueda');
    }
};