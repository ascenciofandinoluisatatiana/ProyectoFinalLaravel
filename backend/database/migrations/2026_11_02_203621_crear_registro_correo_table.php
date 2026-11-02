<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro de cada correo que envía el portal.
     */
    public function up(): void
    {
        Schema::create('registro_correo', function (Blueprint $table) {
            $table->id();

            // Usuario al que se le envió, si tiene cuenta. Si la cuenta se borra, el registro se conserva.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('destinatario', 150);

            // Plantilla usada (el código de plantillas_mensaje)
            $table->string('plantilla', 60);

            // Resultado del envío. Valores por definir con el equipo (enviado, fallido...)
            $table->string('estado', 10);

            // Mensaje de error si el envío falló
            $table->text('error')->nullable();

            $table->timestamp('fecha')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registro_correo');
    }
};