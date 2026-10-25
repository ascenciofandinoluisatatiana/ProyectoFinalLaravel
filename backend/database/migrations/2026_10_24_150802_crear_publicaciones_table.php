<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crea las publicaciones (anuncios de venta o arriendo) y crea una
     * por cada propiedad existente, con los datos que ya tiene.
     */
    public function up(): void
    {
        Schema::create('publicaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('propiedad_id')->constrained('propiedades')->cascadeOnDelete();
            $table->foreignId('operacion_id')->constrained('tipos_operacion');
            $table->foreignId('publicador_id')->constrained('users');
            $table->string('titulo', 200);
            $table->text('descripcion');
            $table->decimal('precio_cop', 14, 2);
            $table->string('estado', 20);
            $table->smallInteger('nivel_posicionamiento')->default(0);
            $table->string('motivo_suspension', 20)->nullable();
            $table->timestamp('publicar_desde')->nullable();
            $table->timestamp('retirar_en')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Una publicación por cada propiedad existente.
        // El título provisional se arma con tipo, operación, barrio y ciudad.
        DB::statement("
            INSERT INTO publicaciones
                (propiedad_id, operacion_id, publicador_id, titulo, descripcion,
                 precio_cop, estado, nivel_posicionamiento, created_at)
            SELECT
                p.id,
                o.id,
                p.user_id,
                LEFT(INITCAP(p.tipo) || ' en ' || p.operacion || ' en ' || p.barrio || ', ' || p.ciudad, 200),
                COALESCE(p.descripcion, ''),
                p.precio,
                p.estado,
                0,
                COALESCE(p.created_at, NOW())
            FROM propiedades p
            JOIN tipos_operacion o ON LOWER(o.nombre) = LOWER(p.operacion)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('publicaciones');
    }
};