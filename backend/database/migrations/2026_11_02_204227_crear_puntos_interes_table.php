<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lugares cercanos a una zona (colegios, parques, estaciones...)
     * con su ubicación en el mapa.
     */
    public function up(): void
    {
        Schema::create('puntos_interes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('municipio_id')->constrained('municipios')->cascadeOnDelete();

            $table->string('nombre', 150);

            // Categoría del lugar. Valores por definir con el equipo (colegio, parque, transporte...)
            $table->string('categoria', 20);

            $table->decimal('latitud', 9, 6);
            $table->decimal('longitud', 9, 6);

            // De dónde salió el dato (por ejemplo: OpenStreetMap)
            $table->string('fuente', 60)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('puntos_interes');
    }
};