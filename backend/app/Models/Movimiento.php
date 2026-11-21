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
 * Con datos extra (todos opcionales):
 *
 *     Movimiento::registrar($usuario, 'pago_aprobado', 'Pago UMB-123', [
 *         'entidad' => 'pago', 'entidad_id' => 7, 'titulo' => 'Pago aprobado', 'valor' => 29900,
 *     ]);
 *
 * Nunca rompe la acción original: si algo falla al guardar, solo lo anota en el log.
 */
class Movimiento extends Model
{
    public $timestamps = false;

    protected $table = 'movimientos';

    protected $fillable = [
        'user_id', 'rol', 'accion', 'detalle', 'ip', 'dispositivo', 'fecha',
        'inmobiliaria_id', 'entidad', 'entidad_id', 'titulo', 'valor', 'resultado', 'codigo',
    ];

    protected $casts = ['fecha' => 'datetime'];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @param  User|int|null  $usuario  quien hizo la acción
     * @param  string         $accion   nombre corto en minúsculas con guion bajo (ej: 'propiedad_publicada')
     * @param  string|null    $detalle  frase corta que explique (ej: 'Casa en El Poblado')
     * @param  array          $extra    entidad, entidad_id, titulo, valor, resultado ('correcto'|'error'), codigo, inmobiliaria_id
     */
    public static function registrar(User|int|null $usuario, string $accion, ?string $detalle = null, array $extra = []): void
    {
        try {
            if (is_int($usuario)) {
                $usuario = User::with('role')->find($usuario);
            } elseif ($usuario) {
                $usuario->loadMissing('role');
            }

            $rol = $usuario?->role?->nombre;

            // A qué inmobiliaria pertenece: ella misma, o la de su agente
            $inmobiliariaId = $extra['inmobiliaria_id'] ?? match ($rol) {
                'inmobiliaria' => $usuario->id,
                'agente' => $usuario->inmobiliaria_id,
                default => null,
            };

            self::create([
                'user_id'         => $usuario?->id,
                'rol'             => $rol,
                'accion'          => mb_substr($accion, 0, 60),
                'detalle'         => $detalle !== null ? mb_substr($detalle, 0, 255) : null,
                'ip'              => request()->ip(),
                'dispositivo'     => mb_substr((string) request()->userAgent(), 0, 150),
                'fecha'           => now(),
                'inmobiliaria_id' => $inmobiliariaId,
                'entidad'         => isset($extra['entidad']) ? mb_substr((string) $extra['entidad'], 0, 30) : null,
                'entidad_id'      => $extra['entidad_id'] ?? null,
                'titulo'          => isset($extra['titulo']) ? mb_substr((string) $extra['titulo'], 0, 150) : null,
                'valor'           => $extra['valor'] ?? null,
                'resultado'       => $extra['resultado'] ?? 'correcto',
                'codigo'          => $extra['codigo'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('No se pudo guardar el movimiento: ' . $e->getMessage(), ['accion' => $accion]);
        }
    }
}
