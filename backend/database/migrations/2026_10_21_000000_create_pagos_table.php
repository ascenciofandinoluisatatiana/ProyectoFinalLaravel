<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Transacciones de pago (RF-050, RF-051, RF-056).
 * Un registro por cada intento de pago, sin importar el resultado:
 *   concepto = membresia  → membresía de una inmobiliaria o un vendedor
 *   concepto = propiedad  → compra o arriendo de un inmueble desde el portal
 * Cuando la pasarela confirma el pago como aprobado, se aplica lo que se compró.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->string('referencia', 60)->unique();          // la que se le envía a la pasarela
            $table->string('concepto', 20)->index();              // membresia | propiedad
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();      // quien paga (si tiene cuenta)
            $table->foreignId('propiedad_id')->nullable()->constrained('propiedades')->nullOnDelete();
            $table->foreignId('membresia_id')->nullable()->constrained('membresias')->nullOnDelete();
            $table->string('plan', 15)->nullable();
            $table->unsignedBigInteger('monto_centavos');
            $table->string('moneda', 3)->default('COP');
            // pendiente | aprobado | rechazado | anulado | error
            $table->string('estado', 15)->default('pendiente')->index();
            $table->string('proveedor', 20);                       // wompi | simulado
            $table->string('transaccion_id', 80)->nullable()->index();
            $table->string('metodo', 30)->nullable();              // PSE, CARD, NEQUI...
            // Datos de quien paga cuando no tiene cuenta (invitado)
            $table->string('pagador_nombre', 120)->nullable();
            $table->string('pagador_correo', 120)->nullable();
            $table->string('pagador_documento', 30)->nullable();
            $table->timestamp('pagado_en')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
