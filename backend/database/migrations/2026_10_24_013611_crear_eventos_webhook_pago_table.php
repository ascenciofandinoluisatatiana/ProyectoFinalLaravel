<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Avisos (webhooks) que envía el proveedor de pagos, para no
     * procesar dos veces el mismo y conservar la prueba de su firma.
     */
    public function up(): void
    {
        Schema::create('eventos_webhook_pago', function (Blueprint $table) {
            $table->id();

            // Identificador que el proveedor le dio al aviso; no se repite
            $table->string('id_evento_proveedor', 80)->unique();

            // Pago al que corresponde; si el pago se borra, el aviso se conserva
            $table->foreignId('pago_id')->nullable()->constrained('pagos')->nullOnDelete();

            // Contenido completo del aviso
            $table->jsonb('payload');

            $table->boolean('firma_valida')->default(false);
            $table->boolean('procesado')->default(false);

            $table->timestamp('fecha_recepcion')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_webhook_pago');
    }
};