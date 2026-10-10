<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Membresías del portal (Fase 7 del SRS): suscripción semanal,
     * quincenal o mensual que paga el vendedor o la inmobiliaria por PSE
     * para mantener sus publicaciones visibles.
     */
    public function up(): void
    {
        Schema::create('membresias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // semanal | quincenal | mensual
            $table->string('plan', 15);

            // Precio pagado en pesos colombianos (COP, sin decimales reales)
            $table->decimal('precio', 12, 2);

            // activa | vencida | cancelada
            $table->string('estado', 15)->default('activa')->index();

            $table->date('fecha_inicio');
            $table->date('fecha_fin');

            // Identificador de la transacción PSE (comprobante del pago)
            $table->string('referencia_pago', 60)->nullable();

            $table->timestamps();

            $table->index(['user_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membresias');
    }
};
