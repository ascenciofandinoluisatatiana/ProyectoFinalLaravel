<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Plan nuevo que crea el administrador:
 *  - normal: publicación normal por tiempo (7, 15 o 30 días y vuelve a borrador).
 *  - posicionamiento: posiciona una propiedad normal por 7, 15 o 30 días.
 */
class PlanPublicacion extends Model
{
    protected $table = 'planes_publicacion';

    public const TIPOS = [
        'normal' => 'Publicación normal por tiempo',
        'posicionamiento' => 'Posicionamiento de normales',
    ];

    protected $guarded = [];

    protected function casts(): array
    {
        return ['dias' => 'integer', 'precio' => 'integer', 'activo' => 'boolean'];
    }
}
