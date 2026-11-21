<?php

namespace App\Services\Paneles;

use App\Models\Membresia;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Notificaciones del administrador (campana y "ver todas").
 *
 * Todas las personas administradoras ven lo mismo, así que no se guarda una copia por persona:
 * se arma al consultar con lo que ya está en la base de datos, de TODOS los roles:
 *   - registro: cada cuenta nueva (y si sigue por verificar)
 *   - pago:     pagos de membresías y de los planes de publicación (aprobados y no completados)
 *   - error:    errores graves del sistema que anota "Movimientos"
 * Lo único que se guarda por persona es hasta cuándo vio la campana (tabla notificaciones_lecturas).
 */
class NotificacionAdminService
{
    public const TIPOS = ['registro', 'pago', 'error'];

    private const ZONA = 'America/Bogota';

    /** Los eventos de los tres tipos, con las mismas columnas, como una sola consulta. */
    private function eventos(): Builder
    {
        $registros = DB::table('users as u')->join('roles as r', 'r.id', '=', 'u.role_id')
            ->whereIn('r.nombre', User::ROLES_PANEL)
            ->selectRaw("'registro' as tipo, u.id as ref_id, u.name as nombre, r.nombre as extra, u.estado as estado, CAST(NULL AS bigint) as valor, u.email as referencia, u.created_at as fecha");

        $pagos = DB::table('pagos as p')->leftJoin('users as u', 'u.id', '=', 'p.user_id')
            ->whereIn('p.estado', ['aprobado', 'rechazado', 'error', 'anulado'])
            ->selectRaw("'pago' as tipo, p.id as ref_id, COALESCE(u.name, p.pagador_nombre, 'Usuario') as nombre, COALESCE(p.plan, p.concepto) as extra, p.estado as estado, CAST(p.monto_centavos / 100 AS bigint) as valor, p.referencia as referencia, p.updated_at as fecha");

        $errores = DB::table('movimientos as m')->leftJoin('users as u', 'u.id', '=', 'm.user_id')
            ->where('m.resultado', 'error')
            ->selectRaw("'error' as tipo, m.id as ref_id, COALESCE(u.name, 'Sin nombre') as nombre, COALESCE(m.titulo, m.accion) as extra, CAST(m.codigo AS varchar) as estado, CAST(NULL AS bigint) as valor, m.rol as referencia, m.fecha as fecha");

        return DB::query()->fromSub($registros->unionAll($pagos)->unionAll($errores), 'e');
    }

    /** Lo que muestra la campana: los 10 más recientes y cuántos son nuevos desde la última vez. */
    public function recientes(User $admin, int $limite = 10): array
    {
        $visto = $this->visto($admin);
        $filas = $this->eventos()->orderByDesc('fecha')->orderByDesc('ref_id')->limit($limite)->get();

        return [
            'data' => $filas->map(fn ($f) => $this->formato($f, $visto))->values()->all(),
            'sin_leer' => (int) $this->eventos()->where('fecha', '>', $visto)->limit(100)->count(),
        ];
    }

    /**
     * Historial completo con filtros:
*   tipo (registro|pago|error), desde / hasta (día de Colombia), q (texto),
     *   rol (solo registros), pago (aprobado|no_completado, solo pagos),
     *   orden (recientes|antiguas), pagina, por_pagina.
     */
    public function historial(User $admin, array $f): array
    {
        $visto = $this->visto($admin);

        $consulta = $this->eventos();
        if (! empty($f['tipo'])) {
            $consulta->where('tipo', $f['tipo']);
        }
        if (! empty($f['desde'])) {
            $consulta->where('fecha', '>=', Carbon::parse($f['desde'], self::ZONA)->startOfDay()->utc());
        }
        if (! empty($f['hasta'])) {
            $consulta->where('fecha', '<=', Carbon::parse($f['hasta'], self::ZONA)->endOfDay()->utc());
        }
        if (! empty($f['q'])) {
            $texto = '%' . addcslashes((string) $f['q'], '%_\\') . '%';
            // También busca por el tipo ("pago", "registro", "error") y el estado ("aprobado", "pendiente"...)
            $consulta->where(fn ($w) => $w->where('nombre', 'ilike', $texto)->orWhere('extra', 'ilike', $texto)
                ->orWhere('referencia', 'ilike', $texto)->orWhere('tipo', 'ilike', $texto)->orWhere('estado', 'ilike', $texto));
        }

        // Filtros propios de cada tipo
        if (! empty($f['rol'])) {
            $consulta->where('tipo', 'registro')->where('extra', $f['rol']);
        }
        if (! empty($f['pago'])) {
            $consulta->where('tipo', 'pago');
            $f['pago'] === 'aprobado'
                ? $consulta->where('estado', 'aprobado')
                : $consulta->where('estado', '!=', 'aprobado');
        }

        $antiguas = ($f['orden'] ?? '') === 'antiguas';
        $consulta->orderBy('fecha', $antiguas ? 'asc' : 'desc')->orderBy('ref_id', $antiguas ? 'asc' : 'desc');

        $porPagina = min(max((int) ($f['por_pagina'] ?? 15), 1), 100);
        $pagina = max((int) ($f['pagina'] ?? 1), 1);
        $r = $consulta->paginate($porPagina, ['*'], 'pagina', $pagina);

        $porTipo = $this->eventos()->selectRaw('tipo as t, COUNT(*) as n')->groupBy('tipo')->pluck('n', 't');

        return [
            'data' => collect($r->items())->map(fn ($fila) => $this->formato($fila, $visto))->values()->all(),
            'meta' => [
                'pagina' => $r->currentPage(),
                'por_pagina' => $r->perPage(),
                'total' => $r->total(),
                'paginas' => max($r->lastPage(), 1),
            ],
            // Cifras de TODO el historial (no cambian con los filtros)
            'resumen' => [
                'total' => (int) $porTipo->sum(),
                'registros' => (int) ($porTipo['registro'] ?? 0),
                'pagos' => (int) ($porTipo['pago'] ?? 0),
                'errores' => (int) ($porTipo['error'] ?? 0),
                'sin_leer' => (int) $this->eventos()->where('fecha', '>', $visto)->count(),
            ],
        ];
    }

    /** La persona vio la campana: el contador vuelve a 0. */
    public function marcarLeidas(User $admin): void
    {
        DB::table('notificaciones_lecturas')->updateOrInsert(['user_id' => $admin->id], ['visto_en' => now()]);
    }

    /** Desde cuándo cuentan como nuevas (la primera vez, la última semana). */
    private function visto(User $admin): Carbon
    {
        $visto = DB::table('notificaciones_lecturas')->where('user_id', $admin->id)->value('visto_en');

        return $visto ? Carbon::parse($visto) : now()->subDays(7);
    }

    /** Una fila de la consulta → lo que reciben la campana y la página. */
    private function formato(object $f, Carbon $visto): array
    {
        $fecha = Carbon::parse($f->fecha);
        $base = ['tipo' => $f->tipo, 'fecha' => $fecha->toIso8601String(), 'hace' => $fecha->diffForHumans(), 'nueva' => $fecha->gt($visto)];

        if ($f->tipo === 'registro') {
            return $base + [
                'icono' => 'fa-user-plus', 'color' => 'violet',
                'titulo' => 'Nuevo registro: ' . $f->nombre,
                'detalle' => 'Rol: ' . $f->extra . ($f->estado === 'pendiente' ? ' · por verificar' : ''),
                'referencia' => $f->referencia,
            ];
        }

        if ($f->tipo === 'pago') {
            $aprobado = $f->estado === 'aprobado';

            return $base + [
                'icono' => $aprobado ? 'fa-credit-card' : 'fa-circle-xmark', 'color' => $aprobado ? 'violet' : 'gold',
                'titulo' => ($aprobado ? 'Pago aprobado: ' : 'Pago no completado: ') . (Membresia::NOMBRES_PLAN[$f->extra] ?? $f->extra),
                'detalle' => $f->nombre . ' · $' . number_format((float) $f->valor, 0, ',', '.') . ' COP',
                'referencia' => $f->referencia,
            ];
        }

        return $base + [
            'icono' => 'fa-triangle-exclamation', 'color' => 'gold',
            'titulo' => 'Error del sistema: ' . $f->extra,
            'detalle' => $f->nombre . ($f->referencia ? ' (' . $f->referencia . ')' : '') . ' · código ' . $f->estado,
            'referencia' => null,
        ];
    }
}
