<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Características que tiene cada propiedad.
     */
    public function up(): void
    {
        Schema::create('propiedad_caracteristica', function (Blueprint $table) {
            $table->foreignId('propiedad_id')->constrained('propiedades')->cascadeOnDelete();
            $table->foreignId('caracteristica_id')->constrained('caracteristicas');
            $table->primary(['propiedad_id', 'caracteristica_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('propiedad_caracteristica');
    }
};