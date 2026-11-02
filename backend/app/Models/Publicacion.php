<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Publicación: el anuncio de venta o arriendo de una propiedad.
 * Una propiedad puede tener varias publicaciones a lo largo del tiempo.
 */
class Publicacion extends Model
{
    protected $table = 'publicaciones';

    protected $guarded = [];

    // La tabla solo tiene created_at, que la base llena sola
    public $timestamps = false;

    public function propiedad(): BelongsTo
    {
        return $this->belongsTo(Propiedad::class);
    }

    public function historial(): HasMany
    {
        return $this->hasMany(HistorialPublicacion::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }
}