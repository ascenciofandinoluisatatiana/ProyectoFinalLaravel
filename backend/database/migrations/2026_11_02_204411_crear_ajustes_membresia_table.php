<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajustes que un administrador hace a una membresía
     * (por ejemplo, extenderla unos días), con su motivo.
     */
    public function up(): void
    {
        Schema::create('ajustes_membresia', function (Blueprint $table) {
            $table->id();

            $table->foreignId('membresia_id')->constrained('membresias')->cascadeOnDelete();

            // Administrador que hizo el ajuste. Si su cuenta se borra, el registro se conserva.
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();

            // Tipo de ajuste. Valores por definir con el equipo (extensión, corrección...)
            $table->string('tipo', 20);

            $table->integer('dias_extendidos')->nullable();

            $table->text('motivo');

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ajustes_membresia');
    }
};