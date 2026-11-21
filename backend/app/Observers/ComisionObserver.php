<?php

namespace App\Observers;

use App\Models\Comision;
use App\Services\Paneles\AvisosGuardados;

/** Avisos de comisiones: se ganó una (inmobiliaria y agente) y se pagó (agente). */
class ComisionObserver
{
    public function created(Comision $comision): void
    {
        AvisosGuardados::comisionNueva($comision);
    }

    public function updated(Comision $comision): void
    {
        if ($comision->wasChanged('estado') && $comision->estado === 'pagada') {
            AvisosGuardados::comisionPagada($comision);
        }
    }
}
