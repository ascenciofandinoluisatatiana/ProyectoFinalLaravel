<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\Propiedad;
use App\Models\Visita;
use Illuminate\Support\Carbon;

/**
 * Piezas comunes de las visitas para el panel de la inmobiliaria y el del agente.
 * Las fechas llegan en hora de Colombia ("2026-10-20T10:00") y se guardan en UTC (RF-007).
 */
trait ManejaVisitas
{
    protected static string $zonaColombia = 'America/Bogota';

    /** Regla de validación: la fecha (hora de Colombia) debe ser futura. */
    protected function reglaFutura(): \Closure
    {
        return function (string $atributo, $valor, \Closure $falla) {
            try {
                if ($this->aUtc((string) $valor)->lte(now())) {
                    $falla('La visita debe ser en una fecha y hora futuras.');
                }
            } catch (\Throwable $e) {
                $falla('La fecha no es válida.');
            }
        };
    }

    protected function aUtc(string $fecha): Carbon
    {
        return Carbon::parse($fecha, self::$zonaColombia)->utc();
    }

    protected function tituloInmueble(?Propiedad $p): string
    {
        return $p ? ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : 'Propiedad eliminada';
    }

    protected function formatoVisita(Visita $v): array
    {
        return [
            'id' => $v->id,
            'nombre' => $v->nombre,
            'contacto' => $v->contacto,
            'fecha' => $v->fecha->toIso8601String(),
            // Para rellenar el campo datetime-local del formulario (hora de Colombia)
            'fecha_local' => $v->fecha->copy()->setTimezone(self::$zonaColombia)->format('Y-m-d\TH:i'),
            'estado' => $v->estado,
            'nota' => $v->nota,
            'lead_id' => $v->lead_id,
            'propiedad' => [
                'id' => $v->propiedad_id,
                'titulo' => $this->tituloInmueble($v->propiedad),
                'direccion' => $v->propiedad?->direccion,
            ],
            'agente' => $v->agente ? ['id' => $v->agente->id, 'nombre' => $v->agente->name] : null,
        ];
    }
}
