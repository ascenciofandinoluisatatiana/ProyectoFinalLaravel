<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Traducciones automáticas del título y la descripción de cada
     * publicación. El texto original en español no se modifica.
     */
    public function up(): void
    {
        Schema::create('traducciones_publicacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();

            // Idioma al que se tradujo
            $table->char('codigo_idioma', 2);
            $table->foreign('codigo_idioma')->references('codigo')->on('idiomas');

            $table->string('titulo', 200);
            $table->text('descripcion');

            // Servicio que hizo la traducción
            $table->string('proveedor', 40)->nullable();

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traducciones_publicacion');
    }
};