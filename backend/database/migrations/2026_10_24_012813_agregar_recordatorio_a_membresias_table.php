<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guarda cuándo se envió el recordatorio de vencimiento de la membresía.
     */
    public function up(): void
    {
        Schema::table('membresias', function (Blueprint $table) {
            // Null = todavía no se ha enviado el recordatorio
            $table->timestamp('recordatorio_enviado_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('membresias', function (Blueprint $table) {
            $table->dropColumn('recordatorio_enviado_en');
        });
    }
};