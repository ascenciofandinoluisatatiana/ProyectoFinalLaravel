<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La tabla comisiones ya la crea 2026_10_29_000000_comisiones_y_paquetes (la usa el código
 * de comisiones de agentes). Aquí solo se le agrega lo que el modelo de la base de datos
 * pide y esa tabla no tenía: el vínculo con el proceso de venta o con el contrato de arriendo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comisiones', function (Blueprint $table) {
            if (! Schema::hasColumn('comisiones', 'venta_id')) {
                $table->foreignId('venta_id')->nullable()->constrained('procesos_venta')->nullOnDelete();
            }
            if (! Schema::hasColumn('comisiones', 'contrato_id')) {
                $table->foreignId('contrato_id')->nullable()->constrained('contratos_arriendo')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('comisiones', function (Blueprint $table) {
            if (Schema::hasColumn('comisiones', 'contrato_id')) {
                $table->dropConstrainedForeignId('contrato_id');
            }
            if (Schema::hasColumn('comisiones', 'venta_id')) {
                $table->dropConstrainedForeignId('venta_id');
            }
        });
    }
};