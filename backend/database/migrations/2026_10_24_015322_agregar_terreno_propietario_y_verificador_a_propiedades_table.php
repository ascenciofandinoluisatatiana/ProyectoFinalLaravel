<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Área de terreno, propietario del inmueble y datos de quién
     * y cuándo verificó la propiedad.
     */
    public function up(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            // Metros cuadrados del terreno
            $table->decimal('area_terreno_m2', 10, 2)->nullable();

            // Dueño del inmueble; si se borra el propietario, la propiedad se conserva
            $table->foreignId('propietario_id')->nullable()
                ->constrained('propietarios')->nullOnDelete();

            // Quién verificó la propiedad (soporte o administrador)
            $table->foreignId('verificador_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamp('fecha_verificacion')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropConstrainedForeignId('propietario_id');
            $table->dropConstrainedForeignId('verificador_id');
            $table->dropColumn(['area_terreno_m2', 'fecha_verificacion']);
        });
    }
};