<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Solo lo usan las inmobiliarias (RF-011); en una persona queda vacío.
            $table->string('representante_legal')->nullable();

            // País de residencia declarado al registrarse (RF-031). Hoy solo se acepta CO.
            // Las cuentas que ya existían quedan como CO.
            $table->string('pais_residencia', 2)->default('CO');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['representante_legal', 'pais_residencia']);
        });
    }
};
