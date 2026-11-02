<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Comisión de una venta o de un contrato de arriendo.
     * Normalmente es de una u otra, por eso las dos conexiones son opcionales.
     */
    public function up(): void
    {
        Schema::create('comisiones', function (Blueprint $table) {
            $table->id();

            // Si la venta o el contrato se borran, la comisión se conserva
            $table->foreignId('venta_id')->nullable()->constrained('procesos_venta')->nullOnDelete();
            $table->foreignId('contrato_id')->nullable()->constrained('contratos_arriendo')->nullOnDelete();

            // Agente al que corresponde (una cuenta de la tabla users)
            $table->foreignId('agente_id')->nullable()->constrained('users')->nullOnDelete();

            $table->decimal('porcentaje', 5, 2);

            // Valor en pesos colombianos
            $table->decimal('valor_cop', 14, 2);

            // Estado de la comisión. Valores por definir con el equipo (pendiente, pagada...)
            $table->string('estado', 20);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comisiones');
    }
};