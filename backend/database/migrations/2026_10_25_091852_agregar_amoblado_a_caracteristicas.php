<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Agrega "Amoblado", que el formulario de propiedades ya ofrece
     * pero no estaba en la lista fija de características.
     */
    public function up(): void
    {
        if (! DB::table('caracteristicas')->where('nombre', 'Amoblado')->exists()) {
            DB::table('caracteristicas')->insert([
                'nombre' => 'Amoblado',
                'categoria' => 'general',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('caracteristicas')->where('nombre', 'Amoblado')->delete();
    }
};