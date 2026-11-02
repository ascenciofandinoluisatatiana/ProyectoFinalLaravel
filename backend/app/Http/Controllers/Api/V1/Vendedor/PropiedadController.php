<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Api\V1\Inmobiliaria\PropiedadController as BasePropiedadController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        public function index(Request $request): JsonResponse
    {
        $respuesta = parent::index($request);
        $cuerpo = $respuesta->getData(true);
        $cuerpo['min_fotos'] = self::MIN_FOTOS_TOTAL;
        $cuerpo['max_fotos'] = self::MAX_FOTOS_TOTAL;

        $vigentes = MembresiaController::vigentesPorPropiedad($request->user()->id);
        foreach ($cuerpo['data'] as $i => $inmueble) {
            $m = $vigentes->get($inmueble['id']);
            $cuerpo['data'][$i]['membresia'] = $m ? MembresiaController::formato($m) : null;
        }
        $respuesta->setData($cuerpo);

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
}