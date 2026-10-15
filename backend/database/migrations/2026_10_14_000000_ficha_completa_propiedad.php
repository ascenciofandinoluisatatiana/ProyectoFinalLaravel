<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ficha completa de la propiedad (RF-040, RF-042, RF-043, RF-044).
 * - propiedades.descripcion      → texto que escribe quien publica
 * - propiedades.pisos            → número de pisos o niveles
 * - propiedades.antiguedad       → años de construida (0 = nueva)
 * - propiedades.caracteristicas  → lista de características y servicios (JSON)
 * - propiedad_fotos              → fotos adicionales (la principal sigue en propiedades.imagen)
 * Todos los campos son opcionales: lo que ya existe sigue funcionando igual.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            $table->text('descripcion')->nullable();
            $table->unsignedSmallInteger('pisos')->nullable();
            $table->unsignedSmallInteger('antiguedad')->nullable();
            $table->json('caracteristicas')->nullable();
        });

        Schema::create('propiedad_fotos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('propiedad_id')->constrained('propiedades')->cascadeOnDelete();
            $table->string('ruta', 255);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();

            $table->index(['propiedad_id', 'orden']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('propiedad_fotos');

        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropColumn(['descripcion', 'pisos', 'antiguedad', 'caracteristicas']);
        });
    }
};
