<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Textos fijos del portal (botones, títulos, mensajes) en cada idioma.
     */
    public function up(): void
    {
        Schema::create('textos_traduccion', function (Blueprint $table) {
            $table->id();

            // Nombre del texto (por ejemplo: boton_ingresar)
            $table->string('clave', 120);

            // Idioma del texto
            $table->char('codigo_idioma', 2);
            $table->foreign('codigo_idioma')->references('codigo')->on('idiomas');

            $table->text('texto');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('textos_traduccion');
    }
};