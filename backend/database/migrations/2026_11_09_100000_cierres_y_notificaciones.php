<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reporte de ventas y notificaciones de los paneles de inmobiliaria y agente.
 *
 * propiedades.cerrada_en → fecha en que se marcó vendida o arrendada (para el reporte
 *   de ventas y su PDF). Se borra si la propiedad se vuelve a publicar.
 *   Las que ya estaban cerradas toman su última fecha de actualización.
 *
 * notificaciones_lecturas → hasta cuándo vio cada usuario sus notificaciones.
 *   Las notificaciones se arman con lo que ya existe (contactos, visitas, pagos,
 *   membresías, comisiones); aquí solo se guarda la marca de "leídas".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('propiedades', function (Blueprint $table) {
            $table->timestamp('cerrada_en')->nullable()->index();
        });

        DB::table('propiedades')
            ->whereIn('estado', ['vendida', 'arrendada'])
            ->update(['cerrada_en' => DB::raw('updated_at')]);

        Schema::create('notificaciones_lecturas', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->timestamp('visto_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones_lecturas');
        Schema::table('propiedades', function (Blueprint $table) {
            $table->dropIndex(['cerrada_en']);
            $table->dropColumn('cerrada_en');
        });
    }
};
