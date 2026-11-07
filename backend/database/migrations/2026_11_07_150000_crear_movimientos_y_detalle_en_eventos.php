<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de movimientos del portal.
     *  - movimientos: lo que hacen inmobiliarias, agentes y vendedores (lo registra cada panel).
     *  - eventos_seguridad.detalle: texto opcional, por ejemplo "Enviado por <administradora>".
     */
    public function up(): void
    {
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();

            // Si la cuenta se borra, el movimiento se conserva
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Rol de quien hizo la acción, guardado aquí para filtrar aunque la cuenta ya no exista
            $table->string('rol', 30)->nullable();

            // Por ejemplo: propiedad_publicada | agente_agregado | visita_agendada
            $table->string('accion', 60);

            $table->string('detalle', 255)->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('dispositivo', 150)->nullable();

            $table->timestamp('fecha')->useCurrent();

            $table->index(['rol', 'fecha']);
            $table->index('accion');
        });

        Schema::table('eventos_seguridad', function (Blueprint $table) {
            $table->string('detalle', 255)->nullable()->after('dispositivo');
        });
    }

    public function down(): void
    {
        Schema::table('eventos_seguridad', function (Blueprint $table) {
            $table->dropColumn('detalle');
        });

        Schema::dropIfExists('movimientos');
    }
};
