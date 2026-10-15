<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Foto adicional de una propiedad (RF-044). La foto principal sigue en propiedades.imagen. */
class PropiedadFoto extends Model
{
    protected $table = 'propiedad_fotos';

    protected $fillable = ['propiedad_id', 'ruta', 'orden'];

    public function propiedad(): BelongsTo
    {
        return $this->belongsTo(Propiedad::class);
    }

    /** Ruta pública relativa (/storage/...), igual que la foto principal. */
    public function getUrlAttribute(): string
    {
        return str_starts_with($this->ruta, '/') || str_starts_with($this->ruta, 'http')
            ? $this->ruta
            : '/storage/' . $this->ruta;
    }
}
