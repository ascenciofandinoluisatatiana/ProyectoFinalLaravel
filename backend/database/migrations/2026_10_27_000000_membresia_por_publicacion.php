<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Membresía por publicación (vendedor).
 *   - propiedad_id con valor → la membresía posiciona SOLO ese inmueble.
 *   - propiedad_id vacío     → membresía de cuenta (inmobiliarias y membresías anteriores);
 *                              sigue posicionando todos los inmuebles de la cuenta.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membresias', function (Blueprint $table) {
            // Si el inmueble se elimina, el registro del pago se conserva (queda sin inmueble)
            $table->foreignId('propiedad_id')->nullable()->after('user_id')
                ->constrained('propiedades')->nullOnDelete();
            $table->index(['propiedad_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::table('membresias', function (Blueprint $table) {
            $table->dropIndex(['propiedad_id', 'estado']);
            $table->dropConstrainedForeignId('propiedad_id');
        });
    }
};