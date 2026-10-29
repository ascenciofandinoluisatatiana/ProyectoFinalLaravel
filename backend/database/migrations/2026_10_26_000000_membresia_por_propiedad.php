<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Membresía por publicación (RF-048, RF-053).
 * membresias.propiedad_id → la propiedad que se destaca con ese plan.
 *   - Con propiedad_id: solo esa publicación sube en el portal.
 *   - Sin propiedad_id (las que ya existían y las del vendedor): aplica a toda la cuenta,
 *     como funcionaba antes, hasta que venzan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membresias', function (Blueprint $table) {
            $table->foreignId('propiedad_id')->nullable()->after('user_id')
                ->constrained('propiedades')->cascadeOnDelete();
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
