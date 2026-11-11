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
              AND DATE(m.fecha_inicio) <= '{$hoy}'
              AND DATE(m.fecha_fin) >= '{$hoy}'), 0)";
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

    /** Vendedor con su promedio de estrellas y total de reseñas (una sola consulta para todas las propiedades). */
    private static function vendedorConResenas(): \Closure
    {
        return fn ($q) => $q->select('id', 'name', 'email', 'telefono', 'role_id', 'estado')
            ->withAvg('calificaciones', 'estrellas')
            ->withCount('calificaciones');
    }

    /** Solo texto simple de tamaño razonable; cualquier otra cosa (listas, números raros) se ignora. */
    private static function texto(mixed $valor, int $max = 100): ?string
    {
        return is_string($valor) && $valor !== '' && mb_strlen($valor) <= $max ? $valor : null;
    }

    /** Las propiedades de una cuenta desactivada no se muestran (el historial se conserva en la base). */
    private static function conCuentaActiva($q)
    {
        return $q->whereHas('vendedor', fn ($u) => $u->where('estado', 'activo'));
    }

    public function index(Request $r)
    {
        $operacion = in_array($r->query('operacion'), ['venta', 'arriendo'], true) ? $r->query('operacion') : null;
        $tipo = in_array($r->query('tipo'), ['apartamento', 'casa', 'finca', 'local', 'lote', 'oficina'], true) ? $r->query('tipo') : null;
        $ciudad = self::texto($r->query('ciudad'));
        $barrio = self::texto($r->query('barrio'));
        $precioMax = filter_var($r->query('precio_max'), FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 999999999999]]);
        $porPagina = max(1, min((int) $r->query('per_page', 100), 100));

        $q = self::conCuentaActiva(Propiedad::query())
            ->select('propiedades.*')
            ->selectRaw(self::premiumSql())
            ->with(['vendedor' => self::vendedorConResenas(), 'fotos'])
            ->where('estado', 'publicada')
            ->when($operacion,  fn ($q, $v) => $q->where('operacion', $v))
            ->when($tipo,       fn ($q, $v) => $q->where('tipo', $v))
            ->when($ciudad,     fn ($q, $v) => $q->where('ciudad', $v))
            ->when($barrio,     fn ($q, $v) => $q->where('barrio', $v))
            ->when($precioMax !== false && $precioMax !== null, fn ($q) => $q->where('precio', '<=', $precioMax))
            ->orderByDesc('nivel')
            ->orderByDesc('score')
            ->orderByDesc('verificada')
            ->latest('propiedades.id');

        return PropiedadPublicaResource::collection($q->paginate($porPagina));
    }

    public function show(int $id)
    {
        $p = self::conCuentaActiva(Propiedad::query())
            ->select('propiedades.*')
            ->selectRaw(self::premiumSql())
            ->with(['vendedor' => self::vendedorConResenas(), 'fotos'])
            ->where('estado', 'publicada')
            ->findOrFail($id);

        return new PropiedadPublicaResource($p);
    }
}
