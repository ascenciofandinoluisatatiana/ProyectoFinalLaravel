<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega a los usuarios el idioma preferido y los campos de bloqueo
     * temporal por intentos fallidos de inicio de sesión.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // es | en | pt | fr; null = se usa el idioma del país del visitante
            $table->char('idioma_preferido', 2)->nullable();

            // Contraseñas incorrectas seguidas
            $table->smallInteger('intentos_fallidos')->default(0);

            // Hasta cuándo está bloqueada la cuenta; null = sin bloqueo
            $table->timestamp('bloqueado_hasta')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['idioma_preferido', 'intentos_fallidos', 'bloqueado_hasta']);
        });
    }
};