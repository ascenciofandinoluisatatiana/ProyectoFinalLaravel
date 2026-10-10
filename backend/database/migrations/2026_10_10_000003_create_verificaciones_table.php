<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de verificaciones de cuentas: guarda quién decidió,
     * cuándo y por qué. Sirve hoy para el administrador y mañana para
     * la IA de soporte (origen = 'ia', decidido_por = null).
     */
    public function up(): void
    {
        Schema::create('verificaciones', function (Blueprint $table) {
            $table->id();

            // Cuenta que se revisó (vendedor, inmobiliaria o agente)
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Quién decidió. Queda en null cuando decida la IA
            // o si luego se elimina la cuenta de ese administrador.
            $table->foreignId('decidido_por')->nullable()->constrained('users')->nullOnDelete();

            // administrador | ia
            $table->string('origen', 15)->default('administrador');

            // aprobada | rechazada
            $table->string('decision', 10)->index();

            // Por qué (obligatorio al rechazar, opcional al aprobar)
            $table->text('motivo')->nullable();

            // Estado de la cuenta antes y después de la decisión
            $table->string('estado_anterior', 15);
            $table->string('estado_nuevo', 15);

            // created_at = cuándo se tomó la decisión
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verificaciones');
    }
};