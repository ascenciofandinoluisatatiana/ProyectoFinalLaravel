<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}