<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('propiedades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');   // vendedor o inmobiliaria
            $table->string('tipo');                               // casa, apartamento, finca, local, lote
            $table->string('operacion');                          // venta | arriendo
            $table->unsignedBigInteger('precio');                 // COP
            $table->string('departamento');
            $table->string('ciudad');
            $table->string('barrio');
            $table->string('direccion');
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->unsignedSmallInteger('habitaciones')->default(0);
            $table->unsignedSmallInteger('banos')->default(0);
            $table->unsignedSmallInteger('parqueaderos')->default(0);
            $table->unsignedInteger('area');                      // m²
            $table->unsignedTinyInteger('estrato')->nullable();
            $table->boolean('verificada')->default(false);
            $table->string('estado')->default('publicada');       // moderación RF-065
            $table->string('imagen')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('propiedades');
    }
};