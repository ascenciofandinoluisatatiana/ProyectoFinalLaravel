<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guarda en cada documento lo que respondió la IA (DeepSeek) al revisarlo:
     *   ia_estado: aprobado | rechazado | no_disponible (la IA falló y quedó para el administrador)
     */
    public function up(): void
    {
        Schema::table('documentos_identidad', function (Blueprint $table) {
            $table->string('ia_estado', 15)->nullable();
            $table->decimal('ia_puntaje', 5, 2)->nullable();
            $table->text('ia_motivo')->nullable();
            $table->json('ia_detalle')->nullable();
            $table->timestamp('ia_revisado_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('documentos_identidad', function (Blueprint $table) {
            $table->dropColumn(['ia_estado', 'ia_puntaje', 'ia_motivo', 'ia_detalle', 'ia_revisado_en']);
        });
    }
};
