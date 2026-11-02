<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Textos de los correos y avisos del portal, uno por cada idioma.
     */
    public function up(): void
    {
        Schema::create('plantillas_mensaje', function (Blueprint $table) {
            $table->id();

            // Nombre interno de la plantilla (por ejemplo: bienvenida)
            $table->string('codigo', 60);

            // Idioma del texto
            $table->char('codigo_idioma', 2);
            $table->foreign('codigo_idioma')->references('codigo')->on('idiomas');

            $table->string('asunto', 200)->nullable();
            $table->text('cuerpo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plantillas_mensaje');
    }
};