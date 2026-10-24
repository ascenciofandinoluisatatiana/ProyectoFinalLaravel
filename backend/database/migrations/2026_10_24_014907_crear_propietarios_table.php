<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Propietarios de los inmuebles (pueden ser distintos de quien publica).
     */
    public function up(): void
    {
        Schema::create('propietarios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->foreignId('tipo_identificacion_id')->nullable()
                ->constrained('tipos_identificacion');
            $table->string('numero_documento', 30)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('correo', 150)->nullable();

            // Cuenta que registró al propietario
            $table->foreignId('registrado_por')->constrained('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('propietarios');
    }
};