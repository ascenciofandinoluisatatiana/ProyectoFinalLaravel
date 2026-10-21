<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

#[Fillable(['plan', 'nombre', 'dias', 'precio'])]
class PlanMembresia extends Model
{
    protected $table = 'planes_membresia';

    protected function casts(): array
    {
        return ['precio' => 'decimal:2', 'dias' => 'integer'];
    }

    /**
     * Precio vigente de cada plan: ['semanal' => 19900, ...].
     * Si la tabla aún no existe o está vacía, usa los precios por defecto
     * del modelo Membresia, así nada se rompe antes de migrar.
     */
    public static function precios(): array
    {
        if (! Schema::hasTable('planes_membresia')) {
            return Membresia::PRECIOS_PLAN;
        }

        $precios = static::query()->pluck('precio', 'plan')->map(fn ($p) => (float) $p)->all();

        return $precios ?: Membresia::PRECIOS_PLAN;
    }
}
