<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Paquete comprado por una inmobiliaria: N publicaciones destacadas durante unos días.
 * Sale de una oferta del administrador (ofertas_paquete), pero guarda una copia de lo
 * comprado (nombre, plan, días, descuento) para que el historial no cambie.
 * Las publicaciones elegidas son filas de membresias con paquete_id = este paquete, y se
 * posicionan en el portal según el plan del paquete (semanal, quincenal o mensual).
 */
class PaqueteMembresia extends Model
{
    protected $table = 'paquetes_membresia';

    /** Clave del plan en la tabla pagos. */
    public const PLAN = 'paquete10';

    /* Valores de los paquetes comprados antes de que el administrador creara ofertas */
    public const PUBLICACIONES = 10;

    public const DIAS = 30;

    public const DESCUENTO = 25;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'cupos' => 'integer',
            'dias' => 'integer',
            'descuento' => 'integer',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Plan con el que se posicionan sus publicaciones (los paquetes viejos eran mensuales). */
    public function planPortal(): string
    {
        return $this->plan ?: 'mensual';
    }

    public function nombreVisible(): string
    {
        return $this->nombre ?: 'Paquete mensual';
    }

    /** Paquetes vigentes hoy de una inmobiliaria (puede tener varios a la vez). */
    public static function vigentesDe(int $userId): Collection
    {
        $hoy = Carbon::now('America/Bogota')->toDateString();

        return static::where('user_id', $userId)
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->whereDate('fecha_fin', '>=', $hoy)
            ->orderBy('fecha_fin')
            ->orderBy('id')
            ->get();
    }

    /** Pone una propiedad en este paquete (usa un cupo). Quien llama ya validó que hay cupo. */
    public function asignarPropiedad(int $propiedadId): Membresia
    {
        $hoy = Carbon::now('America/Bogota')->toDateString();

        // forceCreate: propiedad_id y paquete_id no están en el $fillable del modelo (que es de otro módulo)
        return Membresia::forceCreate([
            'user_id' => $this->user_id,
            'propiedad_id' => $propiedadId,
            'paquete_id' => $this->id,
            'plan' => $this->planPortal(),          // se posiciona según el plan (zona) del paquete
            'precio' => 0,                          // lo pagado está en el paquete
            'estado' => 'activa',
            'fecha_inicio' => $hoy,
            'fecha_fin' => $this->fecha_fin->toDateString(),
            'referencia_pago' => $this->referencia_pago,
        ]);
    }

    /** Membresías activas (publicaciones elegidas) de este paquete. */
    public function membresiasActivas()
    {
        return Membresia::where('paquete_id', $this->id)->where('estado', 'activa');
    }
}
