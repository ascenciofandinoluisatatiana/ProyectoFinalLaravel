<?php

namespace App\Http\Resources;

use App\Models\Propiedad;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropiedadPublicaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $v = $this->vendedor;
        $partes = preg_split('/\s+/', trim($v->name));
        $ini = mb_strtoupper(mb_substr($partes[0], 0, 1) . mb_substr($partes[1] ?? '', 0, 1));

        return [
            'id'      => $this->id,
            'type'    => $this->tipo,
            'op'      => $this->operacion,
            'price'   => (int) $this->precio,
            'dept'    => $this->departamento,
            'city'    => $this->ciudad,
            'barrio'  => $this->barrio,
            'addr'    => $this->direccion,
            'lat'     => (float) $this->lat,
            'lng'     => (float) $this->lng,
            'beds'    => $this->habitaciones,
            'baths'   => $this->banos,
            'park'    => $this->parqueaderos,
            'area'    => $this->area,
            'estrato' => $this->estrato,
            'ver'     => (bool) $this->verificada,
            'prem'    => (bool) ($this->prem ?? false),
            // Ruta relativa: así funciona por el frontend (:3000) sin depender de APP_URL
            'img'     => $this->urlFoto($this->imagen),
            // Ficha completa (RF-040, RF-042, RF-043, RF-044). Campos nuevos:
            // si la página no los usa, simplemente los ignora.
            'desc'     => $this->descripcion,
            'floors'   => $this->pisos,
            'age'      => $this->antiguedad,
            'features' => collect($this->caracteristicas ?? [])
                ->filter(fn ($clave) => isset(Propiedad::CARACTERISTICAS[$clave]))
                ->map(fn ($clave) => ['key' => $clave, 'label' => Propiedad::CARACTERISTICAS[$clave]])
                ->values()->all(),
            // Todas las fotos: la principal primero y luego la galería
            'photos'   => array_values(array_filter(array_merge(
                [$this->urlFoto($this->imagen)],
                $this->relationLoaded('fotos') ? $this->fotos->map(fn ($f) => $f->url)->all() : []
            ))),
            'seller'  => [
                'id'    => $v->id,
                'name'  => $v->name,
                'kind'  => $v->role_id === 3 ? 'agency' : 'person',
                'phone' => $v->telefono,
                'email' => $v->email,
                'ini'   => $ini,
                'ver'   => $v->estado === 'activo',
            ],
        ];
    }

    /** Ruta relativa (/storage/...): así funciona por el frontend (:3000) sin depender de APP_URL. */
    private function urlFoto(?string $ruta): string
    {
        if (! $ruta) {
            return '';
        }

        return str_starts_with($ruta, '/') || str_starts_with($ruta, 'http') ? $ruta : '/storage/' . $ruta;
    }
}
