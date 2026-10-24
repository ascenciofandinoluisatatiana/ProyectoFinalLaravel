<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Banco del pago y datos del comprobante entregado a la persona.
     */
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            // Banco con el que se pagó por PSE
            $table->string('banco', 80)->nullable();

            // Número del comprobante; no se repite (varios null sí se permiten)
            $table->string('numero_comprobante', 40)->nullable()->unique();

            // Ubicación del archivo del comprobante
            $table->string('comprobante_url', 300)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropUnique(['numero_comprobante']);
            $table->dropColumn(['banco', 'numero_comprobante', 'comprobante_url']);
        });
    }
};