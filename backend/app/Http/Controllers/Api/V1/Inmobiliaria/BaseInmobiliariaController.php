<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Http\Request;

/**
 * Utilidades compartidas por los controladores del panel de la inmobiliaria.
 * Todo se busca SIEMPRE dentro de la inmobiliaria que tiene la sesión,
 * así una inmobiliaria nunca puede ver ni tocar datos de otra (responde 404).
 */
abstract class BaseInmobiliariaController extends Controller
{
    protected function inmobiliaria(Request $request): User
    {
        return $request->user();
    }

    /** IDs de las propiedades de la inmobiliaria. */
    protected function idsPropiedades(Request $request)
    {
        return Propiedad::where('user_id', $this->inmobiliaria($request)->id)->pluck('id');
    }

    protected function propiedadPropia(Request $request, $id): Propiedad
    {
        return Propiedad::where('user_id', $this->inmobiliaria($request)->id)->findOrFail($id);
    }

    protected function agentePropio(Request $request, $id): User
    {
        return User::where('inmobiliaria_id', $this->inmobiliaria($request)->id)
            ->whereHas('role', fn ($q) => $q->where('nombre', 'agente'))
            ->findOrFail($id);
    }

    protected function leadPropio(Request $request, $id): Lead
    {
        return Lead::whereIn('propiedad_id', $this->idsPropiedades($request))->findOrFail($id);
    }

    protected function visitaPropia(Request $request, $id): Visita
    {
        return Visita::whereIn('propiedad_id', $this->idsPropiedades($request))->findOrFail($id);
    }

    /** Regla de validación: el agente debe ser de esta inmobiliaria y estar activo. */
    protected function reglaAgente(Request $request): \Closure
    {
        $inmobiliariaId = $this->inmobiliaria($request)->id;

        return function (string $atributo, $valor, \Closure $falla) use ($inmobiliariaId) {
            if ($valor === null) {
                return;
            }
            $existe = User::where('id', $valor)
                ->where('inmobiliaria_id', $inmobiliariaId)
                ->where('estado', 'activo')
                ->whereHas('role', fn ($q) => $q->where('nombre', 'agente'))
                ->exists();
            if (! $existe) {
                $falla('El agente no pertenece a tu inmobiliaria o está inactivo.');
            }
        };
    }

    protected function tituloPropiedad(?Propiedad $p): string
    {
        return $p ? ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : 'Propiedad eliminada';
    }
}
