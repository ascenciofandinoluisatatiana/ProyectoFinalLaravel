<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Avisos que ve cada usuario dentro del portal.
     */
    public function up(): void
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();

            // Usuario que recibe el aviso. Si la cuenta se borra, sus avisos se borran con ella.
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Tipo de aviso. Valores por definir con el equipo
            $table->string('tipo', 40);

            $table->string('titulo', 150);
            $table->text('mensaje');

            $table->boolean('leida')->default(false);

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};