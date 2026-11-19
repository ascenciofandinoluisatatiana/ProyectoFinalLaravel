<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Se quita el pago de propiedades por invitados (solo se paga la suscripción con Wompi).
 * El documento del pagador solo lo usaba ese pago, por eso se elimina esa columna.
 * pagador_nombre y pagador_correo se quedan: las suscripciones también los usan.
 * Los pagos viejos de invitados que ya estén guardados no se borran.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('pagos', 'pagador_documento')) {
            Schema::table('pagos', function (Blueprint $table) {
                $table->dropColumn('pagador_documento');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('pagos', 'pagador_documento')) {
            Schema::table('pagos', function (Blueprint $table) {
                $table->string('pagador_documento', 30)->nullable();
            });
        }
    }
};
