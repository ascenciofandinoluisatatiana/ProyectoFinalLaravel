<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Una decisión de verificación sobre una cuenta del portal.
 * Cada fila es un registro del historial: nunca se edita ni se borra.
 */
#[Fillable(['user_id', 'decidido_por', 'origen', 'decision', 'motivo', 'estado_anterior', 'estado_nuevo'])]
class Verificacion extends Model
{
    // Laravel pluralizaría "verificacions"; aquí fijamos el nombre real.
    protected $table = 'verificaciones';

    public const DECISIONES = ['aprobada', 'rechazada'];
    public const ORIGENES = ['administrador', 'ia'];

    /** La cuenta que fue revisada. */
    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** El administrador que decidió (null si decidió la IA). */
    public function decisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decidido_por');
    }
}