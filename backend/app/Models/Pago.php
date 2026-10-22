<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Transacción de pago (ver migración create_pagos_table). */
class Pago extends Model
{
    public const ESTADOS = ['pendiente', 'aprobado', 'rechazado', 'anulado', 'error'];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'monto_centavos' => 'integer',
            'pagado_en' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function propiedad(): BelongsTo
    {
        return $this->belongsTo(Propiedad::class);
    }

    public function membresia(): BelongsTo
    {
        return $this->belongsTo(Membresia::class);
    }

    /** Valor en pesos (la pasarela trabaja en centavos). */
    public function getMontoAttribute(): int
    {
        return intdiv($this->monto_centavos, 100);
    }
}
