<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de lo que se hace con cada contacto (lead):
     * una nota, una llamada, una tarea con fecha, etc.
     */
    public function up(): void
    {
        Schema::create('seguimiento_lead', function (Blueprint $table) {
            $table->id();

            // Contacto al que pertenece el seguimiento
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();

            // Quien hizo la anotación. Si la cuenta se borra, el historial se conserva.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Tipo de seguimiento. Valores por definir con el equipo (nota, llamada, tarea...)
            $table->string('tipo', 20);

            $table->text('nota');

            // Si es una tarea pendiente, para cuándo
            $table->timestamp('fecha_tarea')->nullable();

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seguimiento_lead');
    }
};