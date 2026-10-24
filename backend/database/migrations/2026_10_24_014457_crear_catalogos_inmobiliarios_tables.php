<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Listas fijas (catálogos) del portal inmobiliario.
     */
    public function up(): void
    {
        Schema::create('tipos_identificacion', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 10)->unique();
            $table->string('nombre', 60);
        });

        Schema::create('tipos_propiedad', function (Blueprint $table) {
            $table->id();
            // Para subtipos: apunta al tipo del que depende
            $table->foreignId('tipo_padre_id')->nullable()->constrained('tipos_propiedad');
            $table->string('nombre', 80);
            $table->boolean('activo')->default(true);
        });

        Schema::create('caracteristicas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 80);
            $table->string('categoria', 30);
            $table->boolean('activo')->default(true);
        });

        Schema::create('estados_propiedad', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50);
            $table->boolean('activo')->default(true);
        });

        Schema::create('tipos_operacion', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 30);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tipos_operacion');
        Schema::dropIfExists('estados_propiedad');
        Schema::dropIfExists('caracteristicas');
        Schema::dropIfExists('tipos_propiedad');
        Schema::dropIfExists('tipos_identificacion');
    }
};