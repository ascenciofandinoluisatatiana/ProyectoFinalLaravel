<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'propiedad_id', 'plan', 'precio', 'estado', 'fecha_inicio', 'fecha_fin', 'referencia_pago'])]
class Membresia extends Model
{
    /** Etiquetas en español de cada plan. */
    public const NOMBRES_PLAN = [
        'semanal' => 'Semanal',
        'quincenal' => 'Quincenal',
        'mensual' => 'Mensual',
    ];

    /** Precio de cada plan en COP (el administrador los define en el panel). */
    public const PRECIOS_PLAN = [
        'semanal' => 19900,
        'quincenal' => 34900,
        'mensual' => 59900,
    ];

    /**
     * Publicaciones gratis: al contratar una membresía para una propiedad que quedó "en espera
     * de pago", esa propiedad se publica sola.
     */
    protected static function booted(): void
    {
        static::created(function (Membresia $membresia) {
            if (! $membresia->propiedad_id) {
                return;
            }
            $propiedad = Propiedad::find($membresia->propiedad_id);
            if ($propiedad && $propiedad->en_espera_pago) {
                $propiedad->estado = 'publicada';
                $propiedad->en_espera_pago = false;
                $propiedad->save();
            }
        });
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function propiedad(): BelongsTo
{
    return $this->belongsTo(Propiedad::class, 'propiedad_id');
}

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
        ];
    }

    /** Fin de la membresía según el plan y la fecha de inicio. */
    public static function calcularFin(string $plan, $inicio): \Carbon\CarbonInterface
    {
        return match ($plan) {
            'semanal' => $inicio->copy()->addWeek(),
            'quincenal' => $inicio->copy()->addDays(15),
            default => $inicio->copy()->addMonth(),
        };
    }
}

