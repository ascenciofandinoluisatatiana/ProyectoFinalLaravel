<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Calificación (1 a 5 estrellas) y comentario de un visitante sobre un vendedor o inmobiliaria. */
class CalificacionVendedor extends Model
{
    protected $table = 'calificaciones_vendedor';

    protected $guarded = [];

    protected $hidden = ['huella'];

    protected function casts(): array
    {
        return ['estrellas' => 'integer'];
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }

    public function propiedad(): BelongsTo
    {
        return $this->belongsTo(Propiedad::class);
    }
}
