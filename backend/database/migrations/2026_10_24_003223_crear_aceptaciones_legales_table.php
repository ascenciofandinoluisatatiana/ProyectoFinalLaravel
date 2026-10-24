<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Constancia de aceptación de términos y política de datos personales.
     */
    public function up(): void
    {
        Schema::create('aceptaciones_legales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Por ejemplo: terminos | datos_personales
            $table->string('tipo', 30);

            // Versión del texto que se aceptó
            $table->string('version', 20);

            $table->timestamp('fecha')->useCurrent();

            // Dirección IP desde la que se aceptó (IPv4 o IPv6)
            $table->string('ip', 45)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aceptaciones_legales');
    }
};