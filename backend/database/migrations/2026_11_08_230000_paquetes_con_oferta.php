<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Los paquetes de inmobiliaria salen de las ofertas que crea el administrador (ofertas_paquete).
 * Cada compra guarda una COPIA de lo que se compró (nombre, plan, días, descuento): si el
 * administrador edita o borra la oferta después, el historial no cambia.
 *
 * pagos.oferta_datos guarda lo que se le cotizó a la persona al iniciar el pago, para activar
 * exactamente eso cuando la pasarela confirme (aunque la oferta cambie mientras tanto).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->foreignId('oferta_id')->nullable()->after('membresia_id')
                ->constrained('ofertas_paquete')->nullOnDelete();
            $table->json('oferta_datos')->nullable()->after('oferta_id');
        });

        Schema::table('paquetes_membresia', function (Blueprint $table) {
            $table->foreignId('oferta_id')->nullable()->after('pago_id')
                ->constrained('ofertas_paquete')->nullOnDelete();
            $table->string('nombre', 60)->nullable()->after('oferta_id');
            $table->string('plan', 10)->nullable()->after('nombre');           // semanal | quincenal | mensual
            $table->unsignedSmallInteger('dias')->nullable()->after('plan');
            $table->unsignedTinyInteger('descuento')->nullable()->after('dias');
        });
    }

    public function down(): void
    {
        Schema::table('paquetes_membresia', function (Blueprint $table) {
            $table->dropConstrainedForeignId('oferta_id');
            $table->dropColumn(['nombre', 'plan', 'dias', 'descuento']);
        });
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('oferta_id');
            $table->dropColumn('oferta_datos');
        });
    }
};
