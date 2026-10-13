<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    /** Estados del seguimiento de un contacto (RF-083). */
    public const ESTADOS = ['nuevo', 'en_seguimiento', 'cerrado', 'descartado'];

    protected $guarded = [];

    public function propiedad(): BelongsTo
    {
        return $this->belongsTo(Propiedad::class);
    }

    public function agente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agente_id');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visita::class);
    }
}
