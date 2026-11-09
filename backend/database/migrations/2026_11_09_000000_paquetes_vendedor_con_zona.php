<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Los paquetes de vendedor ahora se COMPRAN como los de inmobiliaria.
 * - ofertas_vendedor.zona: en qué zona del portal se posicionan sus propiedades
 *   (semanal = Bronce, quincenal = Plata, mensual = Oro). La elige el administrador.
 *   Los 3 planes base conservan la suya; los demás se acomodan según sus días.
 * - paquetes_membresia.oferta_vendedor_id: de qué oferta de vendedor salió la compra.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ofertas_vendedor', function (Blueprint $table) {
            $table->string('zona', 10)->default('mensual')->after('propiedades');
        });

        DB::table('ofertas_vendedor')->whereNotNull('plan_base')->update(['zona' => DB::raw('plan_base')]);
        DB::table('ofertas_vendedor')->whereNull('plan_base')->where('dias', '<=', 7)->update(['zona' => 'semanal']);
        DB::table('ofertas_vendedor')->whereNull('plan_base')->where('dias', '>', 7)->where('dias', '<=', 15)->update(['zona' => 'quincenal']);

        Schema::table('paquetes_membresia', function (Blueprint $table) {
            $table->foreignId('oferta_vendedor_id')->nullable()->after('oferta_id')
                ->constrained('ofertas_vendedor')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('paquetes_membresia', function (Blueprint $table) {
            $table->dropConstrainedForeignId('oferta_vendedor_id');
        });
        Schema::table('ofertas_vendedor', function (Blueprint $table) {
            $table->dropColumn('zona');
        });
    }
};
