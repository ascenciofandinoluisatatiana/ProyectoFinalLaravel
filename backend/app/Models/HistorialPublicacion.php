<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Cada cambio de precio o de estado de una publicación.
 */
class HistorialPublicacion extends Model
{
    protected $table = 'historial_publicacion';

    protected $guarded = [];

    // La tabla usa la columna "fecha", que la base llena sola
    public $timestamps = false;

    public function publicacion(): BelongsTo
    {
        return $this->belongsTo(Publicacion::class);
    }
}