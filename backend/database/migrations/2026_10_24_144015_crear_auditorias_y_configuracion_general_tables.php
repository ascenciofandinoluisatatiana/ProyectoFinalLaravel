<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Auditoría de operaciones críticas y configuración general del portal.
     */
    public function up(): void
    {
        Schema::create('auditorias', function (Blueprint $table) {
            $table->id();

            // Null si lo hizo el sistema; si la cuenta se borra, el registro se conserva
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('entidad', 60);
            $table->string('id_entidad', 40);

            // crear | modificar | eliminar
            $table->string('accion', 20);

            $table->jsonb('valor_anterior')->nullable();
            $table->jsonb('valor_nuevo')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('fecha')->useCurrent();
        });

        Schema::create('configuracion_general', function (Blueprint $table) {
            $table->string('clave', 80)->primary();
            $table->text('valor');
            $table->string('descripcion', 200)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_general');
        Schema::dropIfExists('auditorias');
    }
};