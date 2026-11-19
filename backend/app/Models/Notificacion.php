<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Una notificación = un aviso guardado para un usuario (tabla "notificaciones").
 *
 * Cómo guardar una, en una sola línea, justo cuando ocurre el evento:
 *
 *     Notificacion::crear($userId, 'contacto-15', 'contacto', 'Nuevo contacto: Ana',
 *         'Casa en El Poblado', '/vendedor/contactos.html', 'fa-comments');
 *
 * Es seguro repetirla: si ya existe la misma (user_id + clave) no se duplica.
 * Nunca rompe la acción original: si algo falla, solo lo anota en el log.
 */
class Notificacion extends Model
{
    public $timestamps = false;

    protected $table = 'notificaciones';

    protected $fillable = ['user_id', 'tipo', 'clave', 'titulo', 'mensaje', 'icono', 'url', 'tono', 'leida', 'leida_en', 'fecha'];

    protected $casts = [
        'leida' => 'boolean',
        'fecha' => 'datetime',
        'leida_en' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Arma una fila lista para guardar. */
    public static function fila(int $userId, string $clave, string $tipo, string $titulo, string $mensaje,
        ?string $url = null, string $icono = 'fa-bell', string $tono = 'normal', $fecha = null): array
    {
        return [
            'user_id' => $userId,
            'clave' => mb_substr($clave, 0, 100),
            'tipo' => mb_substr($tipo, 0, 40),
            'titulo' => mb_substr($titulo, 0, 150),
            'mensaje' => $mensaje,
            'icono' => $icono,
            'url' => $url,
            'tono' => $tono,
            'leida' => false,
            'fecha' => $fecha ?? now(),
        ];
    }

    /** Guarda una notificación (si ya existe la misma clave para ese usuario, no hace nada). */
    public static function crear(int $userId, string $clave, string $tipo, string $titulo, string $mensaje,
        ?string $url = null, string $icono = 'fa-bell', string $tono = 'normal', $fecha = null): void
    {
        self::crearVarias([self::fila($userId, $clave, $tipo, $titulo, $mensaje, $url, $icono, $tono, $fecha)]);
    }

    /** Guarda varias de una vez (ON CONFLICT DO NOTHING: no duplica y no rompe transacciones en Postgres). */
    public static function crearVarias(array $filas): void
    {
        if (! $filas) {
            return;
        }

        try {
            DB::table('notificaciones')->insertOrIgnore($filas);
        } catch (\Throwable $e) {
            Log::warning('No se pudo guardar la notificación: ' . $e->getMessage());
        }
    }

    /** ¿Este usuario es un vendedor? (por ahora solo ellos reciben notificaciones guardadas) */
    public static function esVendedor(int $userId): bool
    {
        return User::whereKey($userId)->whereHas('role', fn ($q) => $q->where('nombre', 'vendedor'))->exists();
    }

    /** "Casa en El Poblado, Medellín" */
    public static function tituloPropiedad(?Propiedad $p): string
    {
        return $p ? ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : 'Propiedad';
    }
}
