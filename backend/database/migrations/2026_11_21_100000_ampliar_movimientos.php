<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->foreignId('inmobiliaria_id')->nullable()->constrained('users')->nullOnDelete();   // a qué inmobiliaria pertenece
            $table->string('entidad', 30)->nullable();          // propiedad | visita | contacto | venta | pago | agente ...
            $table->unsignedBigInteger('entidad_id')->nullable();
            $table->string('titulo', 150)->nullable();          // frase legible: "Creó propiedad #36"
            $table->unsignedBigInteger('valor')->nullable();    // pesos, si hay dinero
            $table->string('resultado', 10)->default('correcto');   // correcto | error
            $table->unsignedSmallInteger('codigo')->nullable(); // código HTTP

            $table->index(['inmobiliaria_id', 'fecha']);
            $table->index(['entidad', 'entidad_id']);
            $table->index('resultado');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropIndex(['inmobiliaria_id', 'fecha']);
            $table->dropIndex(['entidad', 'entidad_id']);
            $table->dropIndex(['resultado']);
            $table->dropConstrainedForeignId('inmobiliaria_id');
            $table->dropColumn(['entidad', 'entidad_id', 'titulo', 'valor', 'resultado', 'codigo']);
        });
    }
};
