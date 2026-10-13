<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Propiedad extends Model
{
    protected $table = 'propiedades';

    protected $guarded = [];

    protected $casts = [
        'verificada' => 'boolean',
        'precio'     => 'integer',
        'lat'        => 'float',
        'lng'        => 'float',
    ];

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Agente de la inmobiliaria asignado a esta propiedad. */
    public function agente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agente_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visita::class);
    }
}
