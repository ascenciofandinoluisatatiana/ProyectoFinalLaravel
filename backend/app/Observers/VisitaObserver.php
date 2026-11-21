<?php

namespace App\Observers;

use App\Models\Notificacion;
use App\Models\Propiedad;
use App\Models\Visita;
use App\Services\Paneles\AvisosGuardados;
use Illuminate\Support\Facades\Auth;

/**
 * Cuando alguien pide una visita, le llega una notificación al vendedor dueño de la propiedad
 * (o a la inmobiliaria y su agente; ver AvisosGuardados).
 */
class VisitaObserver
{
    private const ZONA = 'America/Bogota';

    public function created(Visita $visita): void
    {
        AvisosGuardados::visitaNueva($visita);

        try {
            $propiedad = Propiedad::find($visita->propiedad_id);
            if (! $propiedad) {
                return;
            }

            $duenio = (int) $propiedad->user_id;

            // Si el propio vendedor agendó la visita desde su panel, no hace falta avisarle
            if (Auth::id() === $duenio || ! Notificacion::esVendedor($duenio)) {
                return;
            }

            Notificacion::crear(
                $duenio,
                'visita-' . $visita->id . '-nueva',
                'visita',
                'Nueva visita: ' . $visita->nombre,
                Notificacion::tituloPropiedad($propiedad) . ' · ' . $visita->fecha->copy()->setTimezone(self::ZONA)->format('d/m h:i a'),
                '/vendedor/visitas.html',
                'fa-calendar-check',
                'normal',
                $visita->created_at,
            );
        } catch (\Throwable $e) {
            // Avisar nunca debe romper el guardado de la visita
        }
    }

    /** Visita confirmada o cancelada, o asignada a otro agente. */
    public function updated(Visita $visita): void
    {
        if ($visita->wasChanged('estado')) {
            AvisosGuardados::visitaEstado($visita);
        }
        if ($visita->wasChanged('agente_id') && $visita->agente_id) {
            AvisosGuardados::visitaAsignada($visita);
        }
    }
}
