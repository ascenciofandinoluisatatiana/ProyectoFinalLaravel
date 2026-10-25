<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de precios y estados de cada publicación.
     */
    public function up(): void
    {
        Schema::create('historial_publicacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publicacion_id')->constrained('publicaciones')->cascadeOnDelete();

            // Valor que quedó; null si ese cambio no tocó ese dato
            $table->decimal('precio_cop', 14, 2)->nullable();
            $table->string('estado', 20)->nullable();

            // Quién hizo el cambio; si la cuenta se borra, el registro se conserva
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_publicacion');
    }
};