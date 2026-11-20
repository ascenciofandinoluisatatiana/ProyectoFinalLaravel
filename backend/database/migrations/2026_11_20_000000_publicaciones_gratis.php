<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Publicaciones gratis (paso 6.1).
 *
 *   users.publicaciones_gratis  → cuántas propiedades puede tener publicadas una cuenta
 *                                 sin pagar (0 a 5, por defecto 1). El administrador lo cambia.
 *   propiedades.en_espera_pago  → la propiedad se guardó como borrador porque la cuenta ya usó
 *                                 sus publicaciones gratis; se publica sola al pagar.
 *
 * No cambia ningún dato existente: las propiedades que ya están publicadas siguen publicadas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('publicaciones_gratis')->default(1);
        });
        DB::statement('ALTER TABLE users ADD CONSTRAINT users_publicaciones_gratis_rango CHECK (publicaciones_gratis BETWEEN 0 AND 5)');

        Schema::table('propiedades', function (Blueprint $table) {
            $table->boolean('en_espera_pago')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropColumn('en_espera_pago');
        });
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_publicaciones_gratis_rango');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('publicaciones_gratis');
        });
    }
};
