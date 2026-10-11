<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropiedadPublicaResource;
use App\Models\Propiedad;
use Illuminate\Http\Request;

class PublicPropiedadController extends Controller
{
    private const PREMIUM_SQL = "EXISTS (SELECT 1 FROM membresias m
        WHERE m.user_id = propiedades.user_id
          AND m.estado = 'activa'
          AND m.fecha_fin >= CURRENT_DATE) AS prem";

    public function index(Request $r)
    {
        $q = Propiedad::query()
            ->select('propiedades.*')
            ->selectRaw(self::PREMIUM_SQL)
            ->with('vendedor:id,name,email,telefono,role_id,estado')
            ->where('estado', 'publicada')
            ->when($r->operacion,  fn ($q, $v) => $q->where('operacion', $v))
            ->when($r->tipo,       fn ($q, $v) => $q->where('tipo', $v))
            ->when($r->ciudad,     fn ($q, $v) => $q->where('ciudad', $v))
            ->when($r->barrio,     fn ($q, $v) => $q->where('barrio', $v))
            ->when($r->precio_max, fn ($q, $v) => $q->where('precio', '<=', $v))
            ->orderByDesc('prem')
            ->orderByDesc('verificada')
            ->latest('propiedades.id');

        return PropiedadPublicaResource::collection(
            $q->paginate(min((int) $r->get('per_page', 100), 100))
        );
    }

    public function show(int $id)
    {
        $p = Propiedad::query()
            ->select('propiedades.*')
            ->selectRaw(self::PREMIUM_SQL)
            ->with('vendedor:id,name,email,telefono,role_id,estado')
            ->where('estado', 'publicada')
            ->findOrFail($id);

        return new PropiedadPublicaResource($p);
    }
}
