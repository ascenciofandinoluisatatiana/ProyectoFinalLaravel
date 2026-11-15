<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guía de Object Storage: junto a la clave del archivo se guarda su nombre original,
 * peso, tipo y disco. Solo agrega columnas (no borra ni cambia nada existente).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('propiedad_fotos', function (Blueprint $table) {
            if (! Schema::hasColumn('propiedad_fotos', 'nombre_original')) {
                $table->string('nombre_original', 255)->nullable();
            }
            if (! Schema::hasColumn('propiedad_fotos', 'peso')) {
                $table->unsignedInteger('peso')->nullable();
            }
            if (! Schema::hasColumn('propiedad_fotos', 'mime')) {
                $table->string('mime', 60)->nullable();
            }
            if (! Schema::hasColumn('propiedad_fotos', 'disco')) {
                $table->string('disco', 30)->nullable();
            }
        });

        // Foto principal: sigue en propiedades.imagen (la clave); sus datos van en imagen_meta
        Schema::table('propiedades', function (Blueprint $table) {
            if (! Schema::hasColumn('propiedades', 'imagen_meta')) {
                $table->json('imagen_meta')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('propiedad_fotos', function (Blueprint $table) {
            $table->dropColumn(['nombre_original', 'peso', 'mime', 'disco']);
        });
        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropColumn('imagen_meta');
        });
    }
};
