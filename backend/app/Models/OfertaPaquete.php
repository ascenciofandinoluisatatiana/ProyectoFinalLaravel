<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Paquete que el administrador ofrece a las inmobiliarias: N publicaciones durante
 * los días de un plan, con un descuento. El precio se calcula, no se guarda.
 */
class OfertaPaquete extends Model
{
    protected $table = 'ofertas_paquete';

    protected $guarded = [];

    /** Días de vigencia por plan (si la tabla de planes no tiene el dato). */
    public const DIAS_PLAN = [
        'semanal' => 7,
        'quincenal' => 15,
        'mensual' => 30,
    ];

    protected function casts(): array
    {
        return [
            'publicaciones' => 'integer',
            'descuento' => 'integer',
            'activa' => 'boolean',
        ];
    }

    /** Precio: publicaciones × precio del plan × (1 − descuento). */
    public static function calcularPrecio(string $plan, int $publicaciones, int $descuento): int
    {
        $precioPlan = (float) (PlanMembresia::precios()[$plan] ?? Membresia::PRECIOS_PLAN[$plan] ?? 0);

        return (int) round($precioPlan * $publicaciones * (100 - $descuento) / 100);
    }

    public static function diasDelPlan(string $plan): int
    {
        $dias = PlanMembresia::where('plan', $plan)->value('dias');

        return (int) ($dias ?: (self::DIAS_PLAN[$plan] ?? 30));
    }

    public function precio(): int
    {
        return self::calcularPrecio($this->plan, $this->publicaciones, $this->descuento);
    }

    public function dias(): int
    {
        return self::diasDelPlan($this->plan);
    }
}
