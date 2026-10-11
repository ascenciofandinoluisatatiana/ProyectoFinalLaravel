<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * El historial de verificaciones es un registro de auditoría: debe
     * sobrevivir aunque se elimine la cuenta revisada o la administradora
     * que decidió.
     *
     *  - Se guarda una "foto" del nombre, correo y rol de la cuenta y del
     *    nombre de quien decidió, tomada en el momento de la decisión.
     *  - La relación con la cuenta pasa de "borrar en cascada" a
     *    "dejar en blanco" (user_id = null) cuando la cuenta se elimina.
     */
    public function up(): void
    {
        Schema::table('verificaciones', function (Blueprint $table) {
            $table->string('cuenta_nombre')->nullable();
            $table->string('cuenta_email')->nullable();
            $table->string('cuenta_rol', 30)->nullable();
            $table->string('decisor_nombre')->nullable();
        });

        // Relleno de las decisiones que ya existen con los datos actuales
        DB::statement(
            'UPDATE verificaciones v
                SET cuenta_nombre = u.name, cuenta_email = u.email, cuenta_rol = r.nombre
               FROM users u
          LEFT JOIN roles r ON r.id = u.role_id
              WHERE u.id = v.user_id'
        );
        DB::statement(
            'UPDATE verificaciones v
                SET decisor_nombre = u.name
               FROM users u
              WHERE u.id = v.decidido_por'
        );

        // user_id puede quedar vacío y ya no se borra en cascada
        Schema::table('verificaciones', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('verificaciones', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Sin cuenta no hay a quién apuntar: esas filas no caben en el esquema anterior
        DB::table('verificaciones')->whereNull('user_id')->delete();

        Schema::table('verificaciones', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('verificaciones', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->dropColumn(['cuenta_nombre', 'cuenta_email', 'cuenta_rol', 'decisor_nombre']);
        });
    }
};
