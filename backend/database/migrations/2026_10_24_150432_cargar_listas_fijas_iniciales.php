<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $operaciones = ['Venta', 'Arriendo'];

    private array $tipos = ['Apartamento', 'Casa', 'Finca', 'Local', 'Lote', 'Oficina'];

    private array $estados = ['Disponible', 'Vendida', 'Arrendada'];

    private array $caracteristicas = [
        'Ascensor', 'Balcón', 'Chimenea', 'Depósito', 'Gas natural',
        'Gimnasio', 'Internet', 'Jardín', 'Mascotas', 'Parque infantil',
        'Piscina', 'Portería', 'Salón comunal', 'Terraza', 'Zona BBQ',
    ];

    /**
     * Carga los valores iniciales de las listas fijas que usan
     * las propiedades y las publicaciones.
     */
    public function up(): void
    {
        DB::table('tipos_operacion')->insert(
            array_map(fn ($n) => ['nombre' => $n], $this->operaciones)
        );

        DB::table('tipos_propiedad')->insert(
            array_map(fn ($n) => ['nombre' => $n], $this->tipos)
        );

        DB::table('estados_propiedad')->insert(
            array_map(fn ($n) => ['nombre' => $n], $this->estados)
        );

        // La categoría exacta de cada una aún no está definida: todas "general"
        DB::table('caracteristicas')->insert(
            array_map(fn ($n) => ['nombre' => $n, 'categoria' => 'general'], $this->caracteristicas)
        );
    }

    public function down(): void
    {
        DB::table('caracteristicas')->whereIn('nombre', $this->caracteristicas)->delete();
        DB::table('estados_propiedad')->whereIn('nombre', $this->estados)->delete();
        DB::table('tipos_propiedad')->whereIn('nombre', $this->tipos)->delete();
        DB::table('tipos_operacion')->whereIn('nombre', $this->operaciones)->delete();
    }
};