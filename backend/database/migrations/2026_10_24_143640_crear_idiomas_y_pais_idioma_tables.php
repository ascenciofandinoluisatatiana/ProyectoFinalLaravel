<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Idiomas del portal, idioma que corresponde a cada país
     * y relación con el idioma preferido de los usuarios.
     */
    public function up(): void
    {
        Schema::create('idiomas', function (Blueprint $table) {
            $table->char('codigo', 2)->primary();
            $table->string('nombre', 40);
            $table->boolean('activo')->default(true);
        });

        Schema::create('pais_idioma', function (Blueprint $table) {
            $table->char('codigo_pais', 2)->primary();
            $table->char('codigo_idioma', 2);
            $table->foreign('codigo_idioma')->references('codigo')->on('idiomas');
        });

        // Idiomas del portal (RF-026)
        DB::table('idiomas')->insert([
            ['codigo' => 'es', 'nombre' => 'Español'],
            ['codigo' => 'en', 'nombre' => 'English'],
            ['codigo' => 'pt', 'nombre' => 'Português'],
            ['codigo' => 'fr', 'nombre' => 'Français'],
        ]);

        // Países que el documento de requerimientos menciona (Apéndice C)
        DB::table('pais_idioma')->insert([
            ['codigo_pais' => 'CO', 'codigo_idioma' => 'es'],
            ['codigo_pais' => 'US', 'codigo_idioma' => 'en'],
            ['codigo_pais' => 'GB', 'codigo_idioma' => 'en'],
            ['codigo_pais' => 'CA', 'codigo_idioma' => 'en'],
            ['codigo_pais' => 'BR', 'codigo_idioma' => 'pt'],
            ['codigo_pais' => 'PT', 'codigo_idioma' => 'pt'],
            ['codigo_pais' => 'FR', 'codigo_idioma' => 'fr'],
        ]);

        // Conecta el idioma preferido de cada usuario con la tabla de idiomas
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('idioma_preferido')->references('codigo')->on('idiomas');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['idioma_preferido']);
        });

        Schema::dropIfExists('pais_idioma');
        Schema::dropIfExists('idiomas');
    }
};