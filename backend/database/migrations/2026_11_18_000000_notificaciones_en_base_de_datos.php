<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Las notificaciones pasan a guardarse en la tabla "notificaciones".
 *
 * La tabla ya existía (user_id, tipo, titulo, mensaje, leida, fecha). Se le agrega lo que
 * necesita la campana:
 *   clave    → identifica el aviso (ej. "contacto-15"). Con (user_id, clave) único,
 *              el mismo aviso nunca se guarda dos veces.
 *   icono    → icono de Font Awesome (ej. "fa-comments").
 *   url      → a dónde lleva el aviso al hacer clic.
 *   tono     → normal | ok | peligro | aviso   ("aviso" se muestra como alerta).
 *   leida_en → cuándo se marcó como leída (sirve para el historial).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notificaciones', function (Blueprint $table) {
            $table->string('clave', 100)->nullable();
            $table->string('icono', 40)->default('fa-bell');
            $table->string('url', 255)->nullable();
            $table->string('tono', 20)->default('normal');
            $table->timestamp('leida_en')->nullable();

            $table->unique(['user_id', 'clave']);
        });
    }

    public function down(): void
    {
        Schema::table('notificaciones', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'clave']);
            $table->dropColumn(['clave', 'icono', 'url', 'tono', 'leida_en']);
        });
    }
};
