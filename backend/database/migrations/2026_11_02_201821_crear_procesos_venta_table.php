<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Venta de una publicación a un contacto: etapa, oferta y cierre.
     */
    public function up(): void
    {
        Schema::create('procesos_venta', function (Blueprint $table) {
            $table->id();

            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();

            // Etapa de la venta. Valores por definir con el equipo (oferta, negociación, cierre...)
            $table->string('etapa', 20);

            // Valores en pesos colombianos
            $table->decimal('valor_oferta_cop', 14, 2)->nullable();
            $table->decimal('valor_cierre_cop', 14, 2)->nullable();

            $table->date('fecha_inicio')->useCurrent();
            $table->date('fecha_cierre')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procesos_venta');
    }
};