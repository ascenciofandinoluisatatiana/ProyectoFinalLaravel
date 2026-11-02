<?php

namespace App\Services\Inmobiliaria;

use App\Models\Comision;
use App\Models\Propiedad;
use App\Models\User;

/**
 * Comisiones de los agentes (RF-091): 4 % fijo del precio de venta o del canon mensual.
 * Se registran al cerrar el inmueble (vendido / arrendado) y solo si tiene un agente
 * de la misma inmobiliaria asignado.
 */
class ComisionService
{
    /** El inmueble se cerró: se crea la comisión del agente (una sola por cierre). */
    public function registrarCierre(Propiedad $propiedad, string $origen = 'panel'): ?Comision
    {
        if (! in_array($propiedad->estado, ['vendida', 'arrendada'], true) || ! $propiedad->agente_id) {
            return null;
        }

        // El agente debe pertenecer a la inmobiliaria dueña del inmueble
        $agente = User::where('id', $propiedad->agente_id)->where('inmobiliaria_id', $propiedad->user_id)->first();
        if (! $agente) {
            return null;
        }

        // Si ya hay una comisión vigente de este cierre, no se duplica
        $existente = Comision::where('propiedad_id', $propiedad->id)->whereIn('estado', ['pendiente', 'pagada'])->first();
        if ($existente) {
            return $existente;
        }

        $base = (int) $propiedad->precio;

        return Comision::create([
            'inmobiliaria_id' => $propiedad->user_id,
            'agente_id' => $agente->id,
            'propiedad_id' => $propiedad->id,
            'inmueble' => mb_substr(ucfirst($propiedad->tipo) . ' en ' . $propiedad->barrio . ', ' . $propiedad->ciudad, 0, 160),
            'operacion' => $propiedad->operacion,
            'base' => $base,
            'porcentaje' => Comision::PORCENTAJE,
            'valor' => (int) round($base * Comision::PORCENTAJE / 100),
            'estado' => 'pendiente',
            'origen' => $origen,
            'cerrada_en' => now(),
        ]);
    }

    /** El inmueble se volvió a publicar: la comisión que no se ha pagado se anula. */
    public function anularCierre(Propiedad $propiedad): void
    {
        Comision::where('propiedad_id', $propiedad->id)->where('estado', 'pendiente')->update(['estado' => 'anulada']);
    }
}
