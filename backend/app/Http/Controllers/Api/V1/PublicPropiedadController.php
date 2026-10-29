<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropiedadPublicaResource;
use App\Models\Propiedad;
use Illuminate\Http\Request;

class PublicPropiedadController extends Controller
{
    private static function premiumSql(): string
    {
        // Fecha de hoy en Colombia (no viene del usuario, es segura para el SQL)
        $hoy = \Illuminate\Support\Carbon::now('America/Bogota')->toDateString();

        // PostgreSQL (el portal) y SQLite (pruebas automáticas) nombran distinto algunas funciones
        $sqlite = \Illuminate\Support\Facades\DB::getDriverName() === 'sqlite';
        $mayor = $sqlite ? 'MAX' : 'GREATEST';
        $menor = $sqlite ? 'MIN' : 'LEAST';
        $semanas = $sqlite
            ? "CAST((julianday('now') - julianday(COALESCE(propiedades.updated_at, propiedades.created_at, 'now'))) / 7 AS INTEGER)"
            : "FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(propiedades.updated_at, propiedades.created_at, NOW()))) / 604800)";

        // Nivel de membresía vigente HOY: 3 = Oro (mensual), 2 = Plata (quincenal), 1 = Bronce (semanal), 0 = sin membresía
        $nivel = "COALESCE((SELECT MAX(CASE m.plan WHEN 'mensual' THEN 3 WHEN 'quincenal' THEN 2 WHEN 'semanal' THEN 1 ELSE 0 END)
            FROM membresias m
            WHERE (m.propiedad_id = propiedades.id OR (m.propiedad_id IS NULL AND m.user_id = propiedades.user_id))
              AND m.estado = 'activa'
              AND m.fecha_inicio <= '{$hoy}'
              AND m.fecha_fin >= '{$hoy}'), 0)";

        // Puntaje orgánico (posicionamiento sin pago): ficha completa + verificación + frescura + contactos
        $score = "CAST(ROUND(
              (CASE WHEN propiedades.verificada THEN 20 ELSE 0 END)
            + (CASE WHEN COALESCE(length(trim(propiedades.descripcion)), 0) >= 80 THEN 15
                    WHEN COALESCE(length(trim(propiedades.descripcion)), 0) > 0 THEN 8 ELSE 0 END)
            + (CASE WHEN propiedades.caracteristicas IS NOT NULL
                     AND CAST(propiedades.caracteristicas AS TEXT) NOT IN ('[]', '{}', 'null') THEN 10 ELSE 0 END)
            + (CASE WHEN propiedades.estrato IS NOT NULL THEN 5 ELSE 0 END)
            + (CASE WHEN propiedades.pisos IS NOT NULL OR propiedades.antiguedad IS NOT NULL THEN 5 ELSE 0 END)
            + {$mayor}(0, 25 - {$semanas})
            + {$menor}(15, 3 * (SELECT COUNT(*) FROM leads l WHERE l.propiedad_id = propiedades.id))
        ) AS INTEGER)";

        return "{$nivel} AS nivel, ({$nivel}) > 0 AS prem, {$score} AS score";
    }

    public function index(Request $r)
    {
        $q = Propiedad::query()
            ->select('propiedades.*')
            ->selectRaw(self::premiumSql())
            ->with(['vendedor:id,name,email,telefono,role_id,estado', 'fotos'])
            ->where('estado', 'publicada')
            ->when($r->operacion,  fn ($q, $v) => $q->where('operacion', $v))
            ->when($r->tipo,       fn ($q, $v) => $q->where('tipo', $v))
            ->when($r->ciudad,     fn ($q, $v) => $q->where('ciudad', $v))
            ->when($r->barrio,     fn ($q, $v) => $q->where('barrio', $v))
            ->when($r->precio_max, fn ($q, $v) => $q->where('precio', '<=', $v))
            ->orderByDesc('nivel')
            ->orderByDesc('score')
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
            ->selectRaw(self::premiumSql())
            ->with(['vendedor:id,name,email,telefono,role_id,estado', 'fotos'])
            ->where('estado', 'publicada')
            ->findOrFail($id);

        return new PropiedadPublicaResource($p);
    }
}
