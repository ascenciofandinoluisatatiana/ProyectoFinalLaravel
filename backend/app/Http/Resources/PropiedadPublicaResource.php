<?php

namespace App\Http\Resources;

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
            'img'     => ! $this->imagen ? '' : (str_starts_with($this->imagen, '/') || str_starts_with($this->imagen, 'http')
                ? $this->imagen : '/storage/' . $this->imagen),
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
}
