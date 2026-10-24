<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vincula cada verificación con el documento revisado y guarda
     * el puntaje que dio la IA.
     */
    public function up(): void
    {
        Schema::table('verificaciones', function (Blueprint $table) {
            // Documento revisado; si luego se borra, la verificación se conserva
            $table->foreignId('documento_id')->nullable()
                ->constrained('documentos_identidad')->nullOnDelete();

            // Puntaje de la IA (solo cuando la revisión la hizo la IA)
            $table->decimal('puntaje_ia', 5, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('verificaciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('documento_id');
            $table->dropColumn('puntaje_ia');
        });
    }
};