<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Comision;
use App\Models\Propiedad;
use App\Models\PropiedadFoto;
use App\Services\CaptchaService;
use App\Services\ImagenService;
use App\Services\Inmobiliaria\ComisionService;
use App\Services\Publicaciones\LimiteGratisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Propiedades de la inmobiliaria (RF-040 a RF-046, RF-061 a RF-063, RF-080).
 * Las rutas de guardar usan POST (multipart) para poder subir la foto principal.
 * Las fotos adicionales (galería) se suben de a una con POST /propiedades/{id}/fotos:
 * así cada petición es pequeña y no choca con el límite de tamaño del servidor.
 */
class PropiedadController extends BaseInmobiliariaController
{
    public const TIPOS = ['apartamento', 'casa', 'finca', 'local', 'lote', 'oficina'];

    public const ESTADOS = ['borrador', 'publicada', 'pausada', 'vendida', 'arrendada'];

    /** GET /propiedades?operacion=&estado=&agente_id=&q= */
    public function index(Request $request): JsonResponse
    {
        $consulta = Propiedad::with(['agente:id,name', 'fotos'])
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

        // ?pagina=N → paginado (12 por página); sin pagina → lista completa (la usa el vendedor)
        $listado = $this->listado($consulta->latest()->latest('id'), $request,
            fn (Propiedad $p) => $this->formato($p),
            fn ($pagina) => $this->conDestacados($pagina));

        return response()->json($listado + [
            // Captcha del formulario "Registrar inmueble" (null = desactivado)
            'captcha_site_key' => app(CaptchaService::class)->claveSitio(),
            // Planes para destacar una publicación (precio vigente del administrador)
            'planes' => collect(\App\Models\PlanMembresia::precios())->map(fn ($precio, $plan) => [
                'plan' => $plan,
                'nombre' => \App\Models\Membresia::NOMBRES_PLAN[$plan] ?? $plan,
                'precio' => $precio,
                'dias' => ['semanal' => 7, 'quincenal' => 15, 'mensual' => 30][$plan] ?? null,
            ])->values()->all(),
            // Catálogo para pintar las casillas del formulario
            'caracteristicas' => Propiedad::CARACTERISTICAS,
            'max_fotos' => Propiedad::MAX_FOTOS,
            // Publicaciones que esta cuenta puede tener publicadas sin pagar
            'publicaciones_gratis' => (int) $this->inmobiliaria($request)->publicaciones_gratis,
        ]);
    }

    /** POST /propiedades */
    public function store(Request $request): JsonResponse
    {
        // Captcha anti-bots, solo en el formulario de la inmobiliaria (el vendedor reutiliza este método)
        if ($request->is('api/v1/inmobiliaria/*')) {
            app(CaptchaService::class)->validar($request);
        }
        $datos = $this->validar($request, true);
        $datos['user_id'] = $this->inmobiliaria($request)->id;
        $datos['verificada'] = false;

        // Publicaciones gratis: si la cuenta ya usó las suyas, la propiedad se guarda como borrador
        // "en espera de pago" y se publica sola cuando se contrate un plan.
        $enEspera = false;
        if ($datos['estado'] === 'publicada' && ! app(LimiteGratisService::class)->puedePublicar($datos['user_id'])) {
            $datos['estado'] = 'borrador';
            $datos['en_espera_pago'] = $enEspera = true;
        }

        $subida = null;
        if ($request->hasFile('imagen')) {
            $subida = $this->imagenes()->subir($request->file('imagen'), 'propiedades', 'imagen');
            $datos['imagen'] = $subida['ruta'];
            $datos['imagen_meta'] = $this->imagenes()->metadatos($subida);
        }

        try {
            $propiedad = Propiedad::create($datos);
        } catch (\Throwable $e) {
            // Si no se pudo guardar el registro, no se deja la foto huérfana en el bucket
            if ($subida) {
                $this->imagenes()->borrar($subida['ruta']);
            }
            throw $e;
        }

        return response()->json([
            'message' => $enEspera ? LimiteGratisService::MENSAJE : 'Propiedad registrada.',
            'en_espera_pago' => $enEspera,
            'data' => $this->formato($propiedad->load(['agente:id,name', 'fotos'])->loadCount(['leads', 'visitas'])),
        ], 201);
    }

    /** POST /propiedades/{id} (actualizar) */
    public function update(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        $datos = $this->validar($request, false);

        $anterior = null;
        $subida = null;
        if ($request->hasFile('imagen') || $request->boolean('quitar_imagen')) {
            $anterior = $propiedad->imagen;
            if ($request->hasFile('imagen')) {
                // Primero se sube la nueva; la anterior solo se borra si todo salió bien
                $subida = $this->imagenes()->subir($request->file('imagen'), 'propiedades', 'imagen');
                $datos['imagen'] = $subida['ruta'];
                $datos['imagen_meta'] = $this->imagenes()->metadatos($subida);
            } else {
                $datos['imagen'] = null;
                $datos['imagen_meta'] = null;
            }
        }

        try {
            $propiedad->update($datos);
        } catch (\Throwable $e) {
            if ($subida) {
                $this->imagenes()->borrar($subida['ruta']);
            }
            throw $e;
        }

        if ($anterior) {
            $this->imagenes()->borrar($anterior);
        }

        return response()->json([
            'message' => 'Propiedad actualizada.',
            'data' => $this->formato($propiedad->fresh()->load(['agente:id,name', 'fotos'])->loadCount(['leads', 'visitas'])),
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

        $antes = $propiedad->estado;
        $enEspera = false;
        $cambios = ['estado' => $datos['estado'], 'en_espera_pago' => false];

        // Publicaciones gratis: al publicar (o volver a publicar) se revisa el límite de la cuenta
        if ($datos['estado'] === 'publicada' && $antes !== 'publicada'
            && ! app(LimiteGratisService::class)->puedePublicar($propiedad->user_id, $propiedad->id)) {
            $cambios = ['estado' => 'borrador', 'en_espera_pago' => true];
            $enEspera = true;
        }
        $propiedad->update($cambios);

        // Comisión del agente (4 %): se crea al cerrar y se anula si se vuelve a abrir
        $comisiones = app(ComisionService::class);
        $comision = null;
        if (in_array($propiedad->estado, ['vendida', 'arrendada'], true)) {
            $comision = $comisiones->registrarCierre($propiedad);
        } elseif (in_array($antes, ['vendida', 'arrendada'], true)) {
            $comisiones->anularCierre($propiedad);
        }

        return response()->json([
            'message' => $enEspera ? LimiteGratisService::MENSAJE : 'Estado actualizado.' . ($comision && $comision->wasRecentlyCreated
                ? ' Comisión de ' . $comision->agente->name . ': $' . number_format($comision->valor, 0, ',', '.') . ' (' . Comision::PORCENTAJE . ' %).'
                : ''),
            'estado' => $propiedad->estado,
            'en_espera_pago' => $enEspera,
        ]);
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

    /** POST /propiedades/{id}/fotos  (multipart: foto) — agrega una foto a la galería */
    public function agregarFoto(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        // El tipo real (JPG, PNG, WebP o GIF) y el peso exacto (fotos 4 MB, GIF 8 MB) los revisa ImagenService
        $request->validate([
            'foto' => ['required', 'file', 'max:8192'],
        ], [
            'foto.required' => 'Elige una foto.',
            'foto.file' => 'No se pudo recibir el archivo. Intenta de nuevo.',
            'foto.max' => 'El archivo no puede superar 8 MB.',
        ]);

        if ($propiedad->fotos()->count() >= Propiedad::MAX_FOTOS) {
            throw ValidationException::withMessages([
                'foto' => 'La galería admite máximo ' . Propiedad::MAX_FOTOS . ' fotos además de la principal.',
            ]);
        }

        $subida = $this->imagenes()->subir($request->file('foto'), 'propiedades', 'foto');
        try {
            $foto = $propiedad->fotos()->create([
                'ruta' => $subida['ruta'],
                'orden' => (int) $propiedad->fotos()->max('orden') + 1,
            ] + $this->imagenes()->metadatos($subida));
        } catch (\Throwable $e) {
            $this->imagenes()->borrar($subida['ruta']);
            throw $e;
        }

        return response()->json(['message' => 'Foto agregada.', 'data' => ['id' => $foto->id, 'url' => $foto->url]], 201);
    }

    /** DELETE /propiedades/{id}/fotos/{foto} */
    public function quitarFoto(Request $request, $id, $fotoId): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        $foto = $propiedad->fotos()->whereKey((int) $fotoId)->firstOrFail();

        $ruta = $foto->ruta;
        $foto->delete();
        $this->borrarArchivo($ruta); // después de borrar el registro: solo se borra si nadie más la usa

        return response()->json(['message' => 'Foto eliminada.']);
    }

    /** DELETE /propiedades/{id} */
    public function destroy(Request $request, $id): JsonResponse
    {
        $propiedad = $this->propiedadPropia($request, $id);
        $rutas = $propiedad->fotos->pluck('ruta')->push($propiedad->imagen)->filter()->all();
        $propiedad->delete(); // sus fotos, contactos y visitas se borran en cascada
        foreach ($rutas as $ruta) {
            $this->borrarArchivo($ruta); // solo se borra del bucket si ningún otro registro la usa
        }

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
            // Ficha completa (RF-040, RF-042, RF-043, RF-044). Todo opcional.
            'descripcion' => ['nullable', 'string', 'max:3000'],
            'pisos' => ['nullable', 'integer', 'min:1', 'max:200'],
            'antiguedad' => ['nullable', 'integer', 'min:0', 'max:300'],
            'caracteristicas' => ['nullable', 'array'],
            'caracteristicas.*' => ['string', Rule::in(array_keys(Propiedad::CARACTERISTICAS))],
        ], [
            'lat.between' => 'La ubicación debe estar en Colombia.',
            'lng.between' => 'La ubicación debe estar en Colombia.',
            'lat.required' => 'Marca la ubicación en el mapa.',
            'lng.required' => 'Marca la ubicación en el mapa.',
            'imagen.max' => 'La foto no puede superar 4 MB.',
            'pisos.min' => 'El número de pisos debe ser al menos 1.',
            'caracteristicas.*.in' => 'Hay una característica que no es válida.',
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
        if (array_key_exists('descripcion', $datos)) {
            $datos['descripcion'] = $datos['descripcion'] !== null ? trim($datos['descripcion']) : null;
        }
        // Se guardan sin repetir y en el orden del catálogo
        if (array_key_exists('caracteristicas', $datos)) {
            $datos['caracteristicas'] = array_values(array_intersect(
                array_keys(Propiedad::CARACTERISTICAS),
                $datos['caracteristicas'] ?? []
            ));
        }
        unset($datos['imagen']);

        return $datos;
    }

    /** Borra la foto del bucket (no toca las imágenes de ejemplo del frontend). */
    private function borrarArchivo(?string $ruta): void
    {
        $this->imagenes()->borrar($ruta);
    }

    protected function imagenes(): ImagenService
    {
        return app(ImagenService::class);
    }

    /** Membresías vigentes de las propiedades del listado (una sola consulta). */
    private ?array $destacadosCache = null;

    private function conDestacados($propiedades)
    {
        $this->destacadosCache = $this->destacados($propiedades->pluck('id')->all());

        return $propiedades;
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
            'en_espera_pago' => (bool) $p->en_espera_pago,
            'imagen' => $this->urlImagen($p->imagen),
            'descripcion' => $p->descripcion,
            'pisos' => $p->pisos,
            'antiguedad' => $p->antiguedad,
            'caracteristicas' => $p->caracteristicas ?? [],
            'fotos' => $p->relationLoaded('fotos')
                ? $p->fotos->map(fn (PropiedadFoto $f) => ['id' => $f->id, 'url' => $f->url])->values()->all()
                : [],
            'agente' => $p->agente ? ['id' => $p->agente->id, 'nombre' => $p->agente->name] : null,
            'contactos' => (int) ($p->leads_count ?? 0),
            'visitas' => (int) ($p->visitas_count ?? 0),
            'creada' => $p->created_at?->toIso8601String(),
            // Membresía vigente de esta publicación (null = no destacada)
            'destacado' => $this->destacadosCache[$p->id] ?? ($this->destacadosCache === null ? ($this->destacados([$p->id])[$p->id] ?? null) : null),
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