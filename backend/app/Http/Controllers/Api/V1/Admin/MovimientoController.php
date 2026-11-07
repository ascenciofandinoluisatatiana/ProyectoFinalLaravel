<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Historial de movimientos para el administrador.
 *
 * GET /api/v1/admin/movimientos?tab=seguridad|inmobiliaria|agente|vendedor
 *   filtros (todos opcionales): q (nombre o correo), accion, rol (solo en seguridad),
 *   ip, desde, hasta (YYYY-MM-DD), orden (reciente|antiguo), page
 *
 * "seguridad" sale de eventos_seguridad; las otras tres, de movimientos.
 */
class MovimientoController extends Controller
{
    private const POR_PAGINA = 15;
    private const PESTANAS = ['seguridad', 'inmobiliaria', 'agente', 'vendedor'];

    public function index(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'tab'    => ['nullable', 'in:' . implode(',', self::PESTANAS)],
            'q'      => ['nullable', 'string', 'max:100'],
            'accion' => ['nullable', 'string', 'max:60'],
            'rol'    => ['nullable', 'in:' . implode(',', User::ROLES_PANEL)],
            'ip'     => ['nullable', 'string', 'max:45'],
            'desde'  => ['nullable', 'date'],
            'hasta'  => ['nullable', 'date'],
            'orden'  => ['nullable', 'in:reciente,antiguo'],
        ]);

        $tab = $datos['tab'] ?? 'seguridad';
        $esSeguridad = $tab === 'seguridad';

        $tabla = $esSeguridad ? 'eventos_seguridad' : 'movimientos';
        $consulta = DB::table("{$tabla} as m")
            ->leftJoin('users as u', 'u.id', '=', 'm.user_id')
            ->leftJoin('roles as r', 'r.id', '=', 'u.role_id');

        // Rol: en seguridad se lee de la cuenta; en las otras pestañas la pestaña ya lo fija
        $columnaRol = $esSeguridad ? 'r.nombre' : 'm.rol';
        if ($esSeguridad) {
            if (! empty($datos['rol'])) {
                $consulta->where('r.nombre', $datos['rol']);
            }
        } else {
            $consulta->where('m.rol', $tab);
        }

        if (! empty($datos['q'])) {
            $q = '%' . str_replace(['%', '_'], ['\%', '\_'], trim($datos['q'])) . '%';
            $consulta->where(function ($sub) use ($q) {
                $sub->where('u.name', 'ilike', $q)->orWhere('u.email', 'ilike', $q);
            });
        }

        if (! empty($datos['accion'])) {
            $consulta->where($esSeguridad ? 'm.tipo' : 'm.accion', $datos['accion']);
        }

        if (! empty($datos['ip'])) {
            $consulta->where('m.ip', 'like', trim($datos['ip']) . '%');
        }

        if (! empty($datos['desde'])) {
            $consulta->where('m.fecha', '>=', $datos['desde'] . ' 00:00:00');
        }
        if (! empty($datos['hasta'])) {
            $consulta->where('m.fecha', '<=', $datos['hasta'] . ' 23:59:59');
        }

        // Las opciones del filtro "acción" salen de lo que de verdad hay guardado
        $columnaAccion = $esSeguridad ? 'tipo' : 'accion';
        $acciones = DB::table($tabla)
            ->when(! $esSeguridad, fn ($c) => $c->where('rol', $tab))
            ->distinct()->orderBy($columnaAccion)->pluck($columnaAccion);

        $total = (clone $consulta)->count();

        $pagina = max(1, (int) $request->input('page', 1));
        $ultima = max(1, (int) ceil($total / self::POR_PAGINA));
        $pagina = min($pagina, $ultima);

        $filas = $consulta
            ->orderBy('m.fecha', ($datos['orden'] ?? 'reciente') === 'antiguo' ? 'asc' : 'desc')
            ->orderBy('m.id', ($datos['orden'] ?? 'reciente') === 'antiguo' ? 'asc' : 'desc')
            ->forPage($pagina, self::POR_PAGINA)
            ->get([
                'm.id',
                $esSeguridad ? 'm.tipo as accion' : 'm.accion',
                'm.detalle',
                'm.ip',
                'm.dispositivo',
                'm.fecha',
                'u.name as nombre',
                'u.email as correo',
                "{$columnaRol} as rol",
            ])
            ->map(fn ($f) => [
                'id'          => $f->id,
                'accion'      => $f->accion,
                'detalle'     => $f->detalle,
                'ip'          => $f->ip,
                'dispositivo' => $f->dispositivo,
                'fecha'       => $f->fecha ? \Illuminate\Support\Carbon::parse($f->fecha)->format('Y-m-d H:i:s') : null,
                'nombre'      => $f->nombre,
                'correo'      => $f->correo,
                'rol'         => $f->rol,
            ]);

        return response()->json([
            'tab'           => $tab,
            'datos'         => $filas,
            'acciones'      => $acciones,
            'total'         => $total,
            'pagina_actual' => $pagina,
            'ultima_pagina' => $ultima,
            'desde'         => $total ? (($pagina - 1) * self::POR_PAGINA) + 1 : 0,
            'hasta'         => $total ? min($pagina * self::POR_PAGINA, $total) : 0,
        ]);
    }
}
