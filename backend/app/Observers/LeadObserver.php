<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\Notificacion;
use App\Models\Propiedad;
use App\Models\Publicacion;

/**
 * Cada contacto nuevo queda conectado con la publicación de su propiedad
 * y le llega una notificación al vendedor dueño de la propiedad.
 */
class LeadObserver
{
    public function creating(Lead $lead): void
    {
        if ($lead->publicacion_id || ! $lead->propiedad_id) {
            return;
        }

        $lead->publicacion_id = Publicacion::where('propiedad_id', $lead->propiedad_id)
            ->orderBy('id')
            ->value('id');
    }

    /** Aviso para el vendedor: "Nuevo contacto". */
    public function created(Lead $lead): void
    {
        try {
            $propiedad = Propiedad::find($lead->propiedad_id);
            if (! $propiedad || ! Notificacion::esVendedor((int) $propiedad->user_id)) {
                return;
            }

            Notificacion::crear(
                (int) $propiedad->user_id,
                'contacto-' . $lead->id,
                'contacto',
                'Nuevo contacto: ' . $lead->nombre,
                Notificacion::tituloPropiedad($propiedad),
                '/vendedor/contactos.html?estado=nuevo',
                'fa-comments',
                'normal',
                $lead->created_at,
            );
        } catch (\Throwable $e) {
            // Avisar nunca debe romper el guardado del contacto
        }
    }
}
