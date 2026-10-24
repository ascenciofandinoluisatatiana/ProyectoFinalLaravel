<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Documentos de identificación (cédula, NIT) que sube cada usuario.
     */
    public function up(): void
    {
        Schema::create('documentos_identidad', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Por ejemplo: cedula | nit
            $table->string('tipo', 30);

            // Ruta del archivo guardado
            $table->string('archivo_url', 300);

            // Si el archivo está cifrado
            $table->boolean('cifrado')->default(false);

            $table->timestamp('fecha_carga')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documentos_identidad');
    }
};