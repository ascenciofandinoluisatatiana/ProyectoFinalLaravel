<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Paquete (plan) que el administrador ofrece a los vendedores: N propiedades
 * destacadas durante X días por un precio fijo.
 */
class OfertaVendedor extends Model
{
    protected $table = 'ofertas_vendedor';

    /** Zona del portal según el plan con el que se posiciona. */
    public const ZONAS = ['semanal' => 'Bronce', 'quincenal' => 'Plata', 'mensual' => 'Oro'];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'dias' => 'integer',
            'precio' => 'integer',
            'propiedades' => 'integer',
            'activa' => 'boolean',
        ];
    }

    public function nombreZona(): string
    {
        return self::ZONAS[$this->zona] ?? 'Oro';
    }

    /** Los 3 planes de origen no cambian sus días ni sus propiedades (el sistema aún los usa así). */
    public function esBase(): bool
    {
        return $this->plan_base !== null;
    }
}
