<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Solicitud de alguien que quiere arrendar una publicación.
     */
    public function up(): void
    {
        Schema::create('solicitudes_alquiler', function (Blueprint $table) {
            $table->id();

            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();

            // Estado de la solicitud. Valores por definir con el equipo (pendiente, aprobada, rechazada...)
            $table->string('estado', 20);

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_alquiler');
    }
};