<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comisiones de los agentes y paquete de membresías de la inmobiliaria.
 *
 * comisiones (RF-081, RF-091): cuando la inmobiliaria marca un inmueble como vendido o
 *   arrendado (o lo compran por el portal), el agente asignado gana el 4 % del precio.
 *   Si el inmueble se vuelve a publicar, la comisión pendiente se anula.
 *
 * paquetes_membresia (RF-048): paquete mensual con descuento para destacar hasta 10
 *   publicaciones; la inmobiliaria elige cuáles y puede cambiarlas mientras esté vigente.
 *   Cada publicación elegida tiene su fila en membresias con paquete_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comisiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inmobiliaria_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('agente_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('propiedad_id')->nullable()->constrained('propiedades')->nullOnDelete();
            // Copia de los datos del cierre: si la propiedad se borra, la comisión conserva su detalle
            $table->string('inmueble', 160);
            $table->string('operacion', 10);                  // venta | arriendo
            $table->unsignedBigInteger('base');               // precio de venta o canon mensual (COP)
            $table->decimal('porcentaje', 5, 2);
            $table->unsignedBigInteger('valor');              // comisión en COP
            $table->string('estado', 15)->default('pendiente')->index();   // pendiente | pagada | anulada
            $table->string('origen', 15)->default('panel');   // panel | portal (pago en línea)
            $table->timestamp('cerrada_en');
            $table->timestamp('pagada_en')->nullable();
            $table->timestamps();

            $table->index(['inmobiliaria_id', 'estado']);
            $table->index(['agente_id', 'estado']);
        });

        Schema::create('paquetes_membresia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('pago_id')->nullable()->constrained('pagos')->nullOnDelete();
            $table->unsignedSmallInteger('cupos');
            $table->decimal('precio', 12, 2);                 // lo que se pagó (RF-058)
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('referencia_pago', 60)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'fecha_fin']);
        });

        Schema::table('membresias', function (Blueprint $table) {
            $table->foreignId('paquete_id')->nullable()->after('propiedad_id')
                ->constrained('paquetes_membresia')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('membresias', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paquete_id');
        });
        Schema::dropIfExists('paquetes_membresia');
        Schema::dropIfExists('comisiones');
    }
};
