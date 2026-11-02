<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Comisión de un agente por un cierre (venta o arriendo). */
class Comision extends Model
{
    protected $table = 'comisiones';

    /** Porcentaje fijo que gana el agente sobre el precio de venta o el canon mensual. */
    public const PORCENTAJE = 4;

    public const ESTADOS = ['pendiente', 'pagada', 'anulada'];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'base' => 'integer',
            'valor' => 'integer',
            'porcentaje' => 'float',
            'cerrada_en' => 'datetime',
            'pagada_en' => 'datetime',
        ];
    }

    public function agente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agente_id');
    }

    public function propiedad(): BelongsTo
    {
        return $this->belongsTo(Propiedad::class);
    }
}
