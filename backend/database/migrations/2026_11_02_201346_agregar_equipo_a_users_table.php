<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Equipo al que pertenece un agente (opcional).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Si el equipo se borra, el agente queda sin equipo pero no se pierde
            $table->foreignId('equipo_id')->nullable()->constrained('equipos_agentes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('equipo_id');
        });
    }
};