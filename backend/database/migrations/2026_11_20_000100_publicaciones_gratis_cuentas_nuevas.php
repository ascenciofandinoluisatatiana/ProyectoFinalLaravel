<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Publicaciones gratis para las CUENTAS NUEVAS (paso 6.1).
 *
 * El número se guarda en configuracion_general (clave "publicaciones_gratis_nuevas").
 * Cada cuenta nueva copia ese número a users.publicaciones_gratis al crearse; cambiarlo
 * después NO toca las cuentas que ya existen.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('configuracion_general')) {
            Schema::create('configuracion_general', function (Blueprint $table) {
                $table->string('clave', 80)->primary();
                $table->text('valor');
                $table->string('descripcion', 200)->nullable();
            });
        }

        $existe = DB::table('configuracion_general')->where('clave', 'publicaciones_gratis_nuevas')->exists();
        if (! $existe) {
            DB::table('configuracion_general')->insert([
                'clave' => 'publicaciones_gratis_nuevas',
                'valor' => '1',
                'descripcion' => 'Publicaciones gratis que recibe cada cuenta nueva (vendedor e inmobiliaria)',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('configuracion_general')->where('clave', 'publicaciones_gratis_nuevas')->delete();
    }
};
