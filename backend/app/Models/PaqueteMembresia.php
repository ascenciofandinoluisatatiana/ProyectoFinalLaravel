<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Paquete mensual de la inmobiliaria: destaca hasta 10 publicaciones con descuento.
 * Las publicaciones elegidas son filas de membresias con paquete_id = este paquete.
 */
class PaqueteMembresia extends Model
{
    protected $table = 'paquetes_membresia';

    /** Clave del plan en la tabla pagos. */
    public const PLAN = 'paquete10';

    public const PUBLICACIONES = 10;

    public const DIAS = 30;

    /** Descuento frente a pagar 10 planes mensuales sueltos. */
    public const DESCUENTO = 25;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'cupos' => 'integer',
        ];
    }

    /** Precio del paquete: 10 planes mensuales al precio vigente, menos el descuento. */
    public static function precio(): int
    {
        $mensual = (float) (PlanMembresia::precios()['mensual'] ?? Membresia::PRECIOS_PLAN['mensual']);

        return (int) round($mensual * self::PUBLICACIONES * (100 - self::DESCUENTO) / 100);
    }

    /** Paquete vigente hoy de una inmobiliaria, o null. */
    public static function vigenteDe(int $userId): ?self
    {
        $hoy = Carbon::now('America/Bogota')->toDateString();

        return static::where('user_id', $userId)
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->whereDate('fecha_fin', '>=', $hoy)
            ->orderByDesc('fecha_fin')
            ->first();
    }

    /** Membresías activas (publicaciones elegidas) de este paquete. */
    public function membresiasActivas()
    {
        return Membresia::where('paquete_id', $this->id)->where('estado', 'activa');
    }
}
