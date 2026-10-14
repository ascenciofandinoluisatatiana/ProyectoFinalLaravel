<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Api\V1\Inmobiliaria\PropiedadController as BasePropiedadController;
use App\Models\Membresia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Inmuebles del vendedor (persona).
 *
 * Reutiliza todo el CRUD de la inmobiliaria (validación, foto, Colombia, municipio,
 * "solo lo mío" por user_id) y agrega la regla del portal: SOLO se publica con una
 * membresía activa. Sin ella, el inmueble se guarda como borrador.
 *
 * Lo que queda en estado "publicada" aparece solo en la búsqueda del invitado
 * (GET /api/v1/public/propiedades), porque esa consulta lee la misma tabla.
 */
class PropiedadController extends BasePropiedadController
{
    /** POST /propiedades — sin membresía activa se guarda como borrador. */
    public function store(Request $request): JsonResponse
    {
        $sinMembresia = ! $this->tieneMembresiaActiva($request);

        if ($sinMembresia) {
            $request->merge(['estado' => 'borrador']);
        }

        $respuesta = parent::store($request);

        if ($sinMembresia && $respuesta->getStatusCode() === 201) {
            $cuerpo = $respuesta->getData(true);
            $cuerpo['message'] = 'Inmueble guardado como borrador. Activa una membresía para publicarlo.';
            $respuesta->setData($cuerpo);
        }

        return $respuesta;
    }

    /** PATCH /propiedades/{id}/estado — publicar o reanudar exige membresía activa. */
    public function estado(Request $request, $id): JsonResponse
    {
        if ($request->input('estado') === 'publicada' && ! $this->tieneMembresiaActiva($request)) {
            throw ValidationException::withMessages([
                'estado' => 'Necesitas una membresía activa para publicar.',
            ]);
        }

        return parent::estado($request, $id);
    }

    /** Misma regla de vigencia que MembresiaController (hora de Colombia). */
    private function tieneMembresiaActiva(Request $request): bool
    {
        return Membresia::where('user_id', $request->user()->id)
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', Carbon::now('America/Bogota')->toDateString())
            ->exists();
    }
}
