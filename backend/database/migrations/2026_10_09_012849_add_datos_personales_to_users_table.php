<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('telefono', 20)->nullable();
            $table->string('tipo_documento', 10)->nullable();
            $table->string('numero_documento', 30)->nullable();

            // No puede haber dos usuarios con el mismo tipo y número de documento
            $table->unique(['tipo_documento', 'numero_documento']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['tipo_documento', 'numero_documento']);
            $table->dropColumn(['telefono', 'tipo_documento', 'numero_documento']);
        });
    }
};