<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Visita programada a una propiedad (RF-085). */
class Visita extends Model
{
    public const ESTADOS = ['pendiente', 'confirmada', 'realizada', 'cancelada'];

    protected $table = 'visitas';

    protected $fillable = ['propiedad_id', 'lead_id', 'agente_id', 'nombre', 'contacto', 'fecha', 'estado', 'nota'];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    public function propiedad(): BelongsTo
    {
        return $this->belongsTo(Propiedad::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function agente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agente_id');
    }
}
