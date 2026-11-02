<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Contrato de arriendo de una publicación.
     * Puede venir de una solicitud de alquiler, pero no es obligatorio.
     */
    public function up(): void
    {
        Schema::create('contratos_arriendo', function (Blueprint $table) {
            $table->id();

            // Si la solicitud se borra, el contrato se conserva
            $table->foreignId('solicitud_id')->nullable()->constrained('solicitudes_alquiler')->nullOnDelete();

            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();

            // Valores en pesos colombianos
            $table->decimal('canon_cop', 14, 2);
            $table->decimal('deposito_cop', 14, 2)->nullable();
            $table->decimal('administracion_cop', 14, 2)->nullable();

            $table->date('fecha_inicio');
            $table->date('fecha_fin');

            // Estado del contrato. Valores por definir con el equipo (vigente, vencido, terminado...)
            $table->string('estado', 20);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contratos_arriendo');
    }
};