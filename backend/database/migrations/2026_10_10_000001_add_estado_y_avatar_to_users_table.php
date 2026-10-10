<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega a los usuarios el estado de la cuenta y un avatar opcional,
     * campos que usa el panel de administración.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // activo | inactivo | pendiente (pendiente = falta verificación de documentos)
            $table->string('estado', 15)->default('activo')->index();

            // Ruta de la imagen del avatar; si es null el panel dibuja las iniciales
            $table->string('avatar')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['estado']);
            $table->dropColumn(['estado', 'avatar']);
        });
    }
};
