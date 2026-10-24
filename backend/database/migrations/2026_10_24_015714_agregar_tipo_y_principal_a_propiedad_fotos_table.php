<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Permite guardar videos, planos y recorridos además de fotos,
     * y marcar cuál es la imagen principal.
     */
    public function up(): void
    {
        Schema::table('propiedad_fotos', function (Blueprint $table) {
            // foto | video | plano | recorrido
            $table->string('tipo', 20)->default('foto');

            $table->boolean('es_principal')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('propiedad_fotos', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'es_principal']);
        });
    }
};