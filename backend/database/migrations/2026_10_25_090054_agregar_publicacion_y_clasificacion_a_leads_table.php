<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Conecta cada contacto (lead) con su publicación y agrega la
     * clasificación del interés.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Null mientras el código no la llene; si la publicación se borra, el contacto se conserva
            $table->foreignId('publicacion_id')->nullable()
                ->constrained('publicaciones')->nullOnDelete();

            // Interés de la persona; sin valores definidos aún
            $table->string('clasificacion', 20)->nullable();
        });

        // A cada contacto existente, la publicación de su propiedad
        DB::statement("
            UPDATE leads
            SET publicacion_id = publicaciones.id
            FROM publicaciones
            WHERE publicaciones.propiedad_id = leads.propiedad_id
        ");
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('publicacion_id');
            $table->dropColumn('clasificacion');
        });
    }
};