<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Panel de la inmobiliaria (RF-079, RF-080, RF-083, RF-085).
 * - users.inmobiliaria_id     → a qué inmobiliaria pertenece cada agente
 * - propiedades.agente_id     → agente asignado a la propiedad
 * - leads.agente_id / estado  → asignación y seguimiento de cada contacto
 * - visitas                   → visitas programadas a las propiedades
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('inmobiliaria_id')->nullable()->after('role_id')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('propiedades', function (Blueprint $table) {
            $table->foreignId('agente_id')->nullable()->after('user_id')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('agente_id')->nullable()->after('propiedad_id')
                ->constrained('users')->nullOnDelete();
            // nuevo | en_seguimiento | cerrado | descartado
            $table->string('estado', 20)->default('nuevo')->index();
        });

        Schema::create('visitas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('propiedad_id')->constrained('propiedades')->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->foreignId('agente_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nombre', 120);               // quien visita
            $table->string('contacto', 120);             // teléfono o correo
            $table->dateTime('fecha');
            // pendiente | confirmada | realizada | cancelada
            $table->string('estado', 20)->default('pendiente')->index();
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitas');

        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('agente_id');
            $table->dropIndex(['estado']);
            $table->dropColumn('estado');
        });

        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropConstrainedForeignId('agente_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inmobiliaria_id');
        });
    }
};
