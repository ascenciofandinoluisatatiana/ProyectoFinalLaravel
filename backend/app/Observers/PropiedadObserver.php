<?php

namespace App\Observers;

use App\Models\Propiedad;
use App\Services\Publicaciones\PublicacionService;

/**
 * Cada vez que se guarda una propiedad, mantiene al día su publicación,
 * las listas fijas y las características.
 */
class PropiedadObserver
{
    public function saved(Propiedad $propiedad): void
    {
        app(PublicacionService::class)->sincronizar($propiedad);
    }
}
