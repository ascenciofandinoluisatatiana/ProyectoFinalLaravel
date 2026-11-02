<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Texto de presentación del usuario y datos de la verificación en dos pasos.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Texto de presentación que ve el público
            $table->text('descripcion_publica')->nullable();

            // Verificación en dos pasos: desactivada hasta que el usuario la active
            $table->boolean('dos_factores')->default(false);
            $table->string('dos_factores_secreto', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['descripcion_publica', 'dos_factores', 'dos_factores_secreto']);
        });
    }
};