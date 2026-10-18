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
 * Fotos del vendedor: entre 5 y 15 en total (la principal + la galería).
 * El MÁXIMO lo controla el servidor aquí; el MÍNIMO lo exige el formulario
 * antes de guardar (el servidor guarda las fotos de a una).
 *
 * Lo que queda en estado "publicada" aparece solo en la búsqueda del invitado
 * (GET /api/v1/public/propiedades), porque esa consulta lee la misma tabla.
 */
class PropiedadController extends BasePropiedadController
{
    public const MIN_FOTOS_TOTAL = 5;

    public const MAX_FOTOS_TOTAL = 15;

    /** GET /propiedades — igual que la base, pero informa los límites de fotos del vendedor. */
    public function index(Request $request): JsonResponse
    {
        $respuesta = parent::index($request);
        $cuerpo = $respuesta->getData(true);
        $cuerpo['min_fotos'] = self::MIN_FOTOS_TOTAL;
        $cuerpo['max_fotos'] = self::MAX_FOTOS_TOTAL;
        $respuesta->setData($cuerpo);

        return $respuesta;
    }

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

    /**
     * POST /propiedades/{id}/fotos  (multipart: foto)
     * Agrega una foto a la galería. Máximo 15 fotos en total contando la principal.
     */
    public function agregarFoto(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);

        $request->validate([
            'foto' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'foto.required' => 'Elige una foto.',
            'foto.max' => 'La foto no puede superar 4 MB.',
            'foto.image' => 'El archivo debe ser una imagen.',
            'foto.mimes' => 'La foto debe ser JPG, PNG o WebP.',
        ]);

        $total = ($propiedad->imagen ? 1 : 0) + $propiedad->fotos()->count();
        if ($total >= self::MAX_FOTOS_TOTAL) {
            throw ValidationException::withMessages([
                'foto' => 'Un inmueble admite máximo ' . self::MAX_FOTOS_TOTAL . ' fotos.',
            ]);
        }

        $foto = $propiedad->fotos()->create([
            'ruta' => $request->file('foto')->store('propiedades', 'public'),
            'orden' => (int) $propiedad->fotos()->max('orden') + 1,
        ]);

        return response()->json(['message' => 'Foto agregada.', 'data' => ['id' => $foto->id, 'url' => $foto->url]], 201);
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