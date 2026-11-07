<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

/**
 * Un movimiento = una acción que hizo alguien en su panel
 * (inmobiliaria, agente o vendedor). El administrador los ve en "Movimientos".
 *
 * Cómo registrar uno, en una sola línea, justo después de que la acción salió bien:
 *
 *     Movimiento::registrar($usuario, 'propiedad_publicada', 'Casa en El Poblado');
 *
 * Nunca rompe la acción original: si algo falla al guardar, solo lo anota en el log.
 */
class Movimiento extends Model
{
    public $timestamps = false;

    protected $table = 'movimientos';

    protected $fillable = ['user_id', 'rol', 'accion', 'detalle', 'ip', 'dispositivo', 'fecha'];

    protected $casts = ['fecha' => 'datetime'];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @param  User|int|null  $usuario  quien hizo la acción
     * @param  string         $accion   nombre corto en minúsculas con guion bajo (ej: 'propiedad_publicada')
     * @param  string|null    $detalle  frase corta que explique (ej: 'Casa en El Poblado')
     */
    public static function registrar(User|int|null $usuario, string $accion, ?string $detalle = null): void
    {
        try {
            if (is_int($usuario)) {
                $usuario = User::with('role')->find($usuario);
            } elseif ($usuario) {
                $usuario->loadMissing('role');
            }

            self::create([
                'user_id'     => $usuario?->id,
                'rol'         => $usuario?->role?->nombre,
                'accion'      => mb_substr($accion, 0, 60),
                'detalle'     => $detalle !== null ? mb_substr($detalle, 0, 255) : null,
                'ip'          => request()->ip(),
                'dispositivo' => mb_substr((string) request()->userAgent(), 0, 150),
                'fecha'       => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo guardar el movimiento: ' . $e->getMessage(), ['accion' => $accion]);
        }
    }
}
