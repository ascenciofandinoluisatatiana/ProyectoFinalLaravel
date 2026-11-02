<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\Publicacion;

/**
 * Cada contacto nuevo queda conectado con la publicación de su propiedad.
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
}