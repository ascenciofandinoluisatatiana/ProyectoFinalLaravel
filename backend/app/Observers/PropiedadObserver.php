<?php

namespace App\Observers;

use App\Models\Propiedad;
use App\Services\Paneles\AvisosGuardados;
use App\Services\Publicaciones\PublicacionService;

/**
 * Cada vez que se guarda una propiedad, mantiene al día su publicación,
 * las listas fijas y las características.
 * Además avisa al agente a cargo cuando cambia el estado o se le asigna.
 */
class PropiedadObserver
{
    public function saved(Propiedad $propiedad): void
    {
        app(PublicacionService::class)->sincronizar($propiedad);
    }

    public function updated(Propiedad $propiedad): void
    {
        if ($propiedad->wasChanged('agente_id') && $propiedad->agente_id) {
            AvisosGuardados::propiedadAsignada($propiedad);

            return;
        }
        if ($propiedad->wasChanged('estado')) {
            AvisosGuardados::propiedadEstado($propiedad);
        }
    }
}
