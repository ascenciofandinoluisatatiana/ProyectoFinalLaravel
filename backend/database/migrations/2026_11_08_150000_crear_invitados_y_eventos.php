<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro de visitantes sin cuenta (invitados), para el historial del administrador.
 * No se guarda la IP completa (se enmascara) ni nada que identifique a la persona
 * salvo que ella misma deje su nombre y contacto en el formulario "Contactar al vendedor".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitados', function (Blueprint $table) {
            $table->id();
            $table->string('huella', 64)->unique();           // código anónimo que guarda el navegador
            $table->string('ip', 45)->nullable();             // enmascarada: 190.25.x.x
            $table->string('idioma', 10)->nullable();
            $table->string('zona_horaria', 60)->nullable();
            $table->string('dispositivo', 150)->nullable();
            $table->unsignedInteger('visitas')->default(1);   // veces que entró (sesiones de 30 min)
            $table->timestamp('primera_visita')->useCurrent();
            $table->timestamp('ultima_visita')->useCurrent();
            $table->timestamp('ultima_actividad')->useCurrent();
            $table->string('nombre', 120)->nullable();        // solo si dejó sus datos
            $table->string('contacto', 150)->nullable();      // correo o teléfono, solo si lo dejó
            $table->index('ultima_visita');
        });

        Schema::create('invitado_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitado_id')->constrained('invitados')->cascadeOnDelete();
            $table->string('tipo', 30);                       // visita | ver_publicacion | favorito_agregado | favorito_quitado | contacto
            $table->unsignedBigInteger('propiedad_id')->nullable();
            $table->string('nombre', 120)->nullable();       // solo en tipo "contacto": lo que la persona escribió
            $table->string('contacto', 150)->nullable();     // solo en tipo "contacto": correo o teléfono
            $table->timestamp('fecha')->useCurrent();
            $table->index(['invitado_id', 'tipo']);
            $table->index('fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitado_eventos');
        Schema::dropIfExists('invitados');
    }
};
