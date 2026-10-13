<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Propiedad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Propiedades de la inmobiliaria (RF-040 a RF-046, RF-061 a RF-063, RF-080).
 * Las rutas de guardar usan POST (multipart) para poder subir la foto.
 */
class PropiedadController extends BaseInmobiliariaController
{
    public const TIPOS = ['apartamento', 'casa', 'finca', 'local', 'lote', 'oficina'];

    public const ESTADOS = ['borrador', 'publicada', 'pausada', 'vendida', 'arrendada'];

    /** GET /propiedades?operacion=&estado=&agente_id=&q= */
    public function index(Request $request): JsonResponse
    {
        $consulta = Propiedad::with('agente:id,name')
            ->withCount(['leads', 'visitas'])
            ->where('user_id', $this->inmobiliaria($request)->id);

        if (in_array($request->query('operacion'), ['venta', 'arriendo'], true)) {
            $consulta->where('operacion', $request->query('operacion'));
        }
        if (in_array($request->query('estado'), self::ESTADOS, true)) {
            $consulta->where('estado', $request->query('estado'));
        }
        if ($request->query('agente_id') === 'sin') {
            $consulta->whereNull('agente_id');
        } elseif ($request->filled('agente_id')) {
            $consulta->where('agente_id', (int) $request->query('agente_id'));
        }
        if ($request->filled('q')) {
            $texto = '%' . mb_strtolower(trim($request->query('q'))) . '%';
            $consulta->where(function ($q) use ($texto) {
                $q->whereRaw('LOWER(barrio) LIKE ?', [$texto])
                    ->orWhereRaw('LOWER(ciudad) LIKE ?', [$texto])
                    ->orWhereRaw('LOWER(direccion) LIKE ?', [$texto]);
            });
        }

        return response()->json([
            'data' => $consulta->latest()->get()->map(fn (Propiedad $p) => $this->formato($p))->all(),
        ]);
    }

    /** POST /propiedades */
    public function store(Request $request): JsonResponse
    {
        $datos = $this->validar($request, true);
        $datos['user_id'] = $this->inmobiliaria($request)->id;
        $datos['verificada'] = false;

        if ($request->hasFile('imagen')) {
            $datos['imagen'] = $request->file('imagen')->store('propiedades', 'public');
        }

        $propiedad = Propiedad::create($datos);

        return response()->json([
            'message' => 'Propiedad registrada.',
            'data' => $this->formato($propiedad->load('agente:id,name')->loadCount(['leads', 'visitas'])),
        ], 201);
    }

    /** POST /propiedades/{id} (actualizar) */
    public function update(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        $datos = $this->validar($request, false);

        if ($request->hasFile('imagen') || $request->boolean('quitar_imagen')) {
            $this->borrarImagen($propiedad);
            $datos['imagen'] = $request->hasFile('imagen')
                ? $request->file('imagen')->store('propiedades', 'public')
                : null;
        }

        $propiedad->update($datos);

        return response()->json([
            'message' => 'Propiedad actualizada.',
            'data' => $this->formato($propiedad->fresh()->load('agente:id,name')->loadCount(['leads', 'visitas'])),
        ]);
    }

    /** PATCH /propiedades/{id}/estado  { estado } */
    public function estado(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        $datos = $request->validate(['estado' => ['required', Rule::in(self::ESTADOS)]]);

        if ($datos['estado'] === 'vendida' && $propiedad->operacion !== 'venta') {
            throw ValidationException::withMessages(['estado' => 'Solo una propiedad en venta se puede marcar como vendida.']);
        }
        if ($datos['estado'] === 'arrendada' && $propiedad->operacion !== 'arriendo') {
            throw ValidationException::withMessages(['estado' => 'Solo una propiedad en arriendo se puede marcar como arrendada.']);
        }

        $propiedad->update(['estado' => $datos['estado']]);

        return response()->json(['message' => 'Estado actualizado.', 'estado' => $propiedad->estado]);
    }

    /** PATCH /propiedades/{id}/agente  { agente_id | null } */
    public function asignar(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        $datos = $request->validate(['agente_id' => ['nullable', 'integer', $this->reglaAgente($request)]]);

        $propiedad->update(['agente_id' => $datos['agente_id'] ?? null]);
        $propiedad->load('agente:id,name');

        return response()->json([
            'message' => $propiedad->agente ? 'Propiedad asignada a ' . $propiedad->agente->name . '.' : 'Propiedad sin agente.',
            'agente' => $propiedad->agente ? ['id' => $propiedad->agente->id, 'nombre' => $propiedad->agente->name] : null,
        ]);
    }

    /** DELETE /propiedades/{id} */
    public function destroy(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        $this->borrarImagen($propiedad);
        $propiedad->delete(); // sus contactos y visitas se borran en cascada

        return response()->json(['message' => 'Propiedad eliminada.']);
    }

    private function validar(Request $request, bool $nueva): array
    {
        $datos = $request->validate([
            'tipo' => ['required', Rule::in(self::TIPOS)],
            'operacion' => ['required', Rule::in(['venta', 'arriendo'])],
            'precio' => ['required', 'integer', 'min:1', 'max:999999999999'],
            'departamento' => ['required', 'string', 'max:80'],
            'ciudad' => ['required', 'string', 'max:80'],
            'barrio' => ['required', 'string', 'max:80'],
            'direccion' => ['required', 'string', 'max:150'],
            // Solo Colombia (RF-030): el punto debe caer dentro del territorio
            'lat' => ['required', 'numeric', 'between:-4.3,13.5'],
            'lng' => ['required', 'numeric', 'between:-82,-66.8'],
            'habitaciones' => ['nullable', 'integer', 'min:0', 'max:50'],
            'banos' => ['nullable', 'integer', 'min:0', 'max:50'],
            'parqueaderos' => ['nullable', 'integer', 'min:0', 'max:50'],
            'area' => ['required', 'integer', 'min:1', 'max:10000000'],
            'estrato' => ['nullable', 'integer', 'between:1,6'],
            'agente_id' => ['nullable', 'integer', $this->reglaAgente($request)],
            'estado' => [$nueva ? 'nullable' : 'prohibited', Rule::in(['borrador', 'publicada'])],
            'imagen' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'lat.between' => 'La ubicación debe estar en Colombia.',
            'lng.between' => 'La ubicación debe estar en Colombia.',
            'lat.required' => 'Marca la ubicación en el mapa.',
            'lng.required' => 'Marca la ubicación en el mapa.',
            'imagen.max' => 'La foto no puede superar 4 MB.',
        ]);

        // El municipio debe existir dentro del departamento elegido (catálogo oficial)
        $existe = DB::table('municipios as m')
            ->join('departamentos as d', 'd.id', '=', 'm.departamento_id')
            ->where('d.nombre', $datos['departamento'])
            ->where('m.nombre', $datos['ciudad'])
            ->exists();
        if (! $existe) {
            throw ValidationException::withMessages(['ciudad' => 'Elige un municipio válido del departamento.']);
        }

        foreach (['habitaciones', 'banos', 'parqueaderos'] as $campo) {
            $datos[$campo] = (int) ($datos[$campo] ?? 0);
        }
        if ($nueva) {
            $datos['estado'] = $datos['estado'] ?? 'publicada';
        }
        unset($datos['imagen']);

        return $datos;
    }

    private function borrarImagen(Propiedad $propiedad): void
    {
        // Solo se borran fotos subidas al disco (no las imágenes de ejemplo del frontend)
        if ($propiedad->imagen && ! str_starts_with($propiedad->imagen, '/') && ! str_starts_with($propiedad->imagen, 'http')) {
            Storage::disk('public')->delete($propiedad->imagen);
        }
    }

    private function formato(Propiedad $p): array
    {
        return [
            'id' => $p->id,
            'tipo' => $p->tipo,
            'operacion' => $p->operacion,
            'precio' => (int) $p->precio,
            'departamento' => $p->departamento,
            'ciudad' => $p->ciudad,
            'barrio' => $p->barrio,
            'direccion' => $p->direccion,
            'lat' => $p->lat,
            'lng' => $p->lng,
            'habitaciones' => $p->habitaciones,
            'banos' => $p->banos,
            'parqueaderos' => $p->parqueaderos,
            'area' => $p->area,
            'estrato' => $p->estrato,
            'verificada' => (bool) $p->verificada,
            'estado' => $p->estado,
            'imagen' => $this->urlImagen($p->imagen),
            'agente' => $p->agente ? ['id' => $p->agente->id, 'nombre' => $p->agente->name] : null,
            'contactos' => (int) ($p->leads_count ?? 0),
            'visitas' => (int) ($p->visitas_count ?? 0),
            'creada' => $p->created_at?->toIso8601String(),
        ];
    }

    private function urlImagen(?string $imagen): ?string
    {
        if (! $imagen) {
            return null;
        }

        return str_starts_with($imagen, '/') || str_starts_with($imagen, 'http') ? $imagen : '/storage/' . $imagen;
    }
}
