<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Historial de movimientos para el administrador.
 *
 * GET /api/v1/admin/movimientos?tab=...&seccion=...
 *   tab      → seguridad (todos los roles) | inmobiliaria | agente | vendedor
 *   seccion  → seguridad (contraseñas y bloqueos) | accesos (inicios de sesión) | acciones (lo que hacen en su panel)
 *   filtros (todos opcionales): q (nombre o correo), accion, rol (solo en la pestaña seguridad),
 *   ip, desde, hasta (YYYY-MM-DD), orden (reciente|antiguo), page
 *   conteos=1 → agrega el total de cada pestaña
 *
 * "seguridad" y "accesos" salen de eventos_seguridad; "acciones", de movimientos.
 */
class MovimientoController extends Controller
{
    private const POR_PAGINA = 10;
    private const PESTANAS = ['seguridad', 'administrador', 'inmobiliaria', 'agente', 'vendedor'];
    private const SECCIONES = ['seguridad', 'accesos', 'acciones'];
    private const TIPO_ACCESO = 'inicio_sesion';

    public function index(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'tab'     => ['nullable', 'in:' . implode(',', self::PESTANAS)],
            'seccion' => ['nullable', 'in:' . implode(',', self::SECCIONES)],
            'q'       => ['nullable', 'string', 'max:100'],
            'accion'  => ['nullable', 'string', 'max:60'],
            'rol'     => ['nullable', 'in:' . implode(',', User::ROLES_PANEL)],
            'ip'      => ['nullable', 'string', 'max:45'],
            'desde'   => ['nullable', 'date'],
            'hasta'   => ['nullable', 'date'],
            'orden'   => ['nullable', 'in:reciente,antiguo'],
        ]);

        $tab = $datos['tab'] ?? 'seguridad';
        $seccion = $datos['seccion'] ?? 'seguridad';

        // "Acciones en su panel" solo existe para un rol concreto
        if ($seccion === 'acciones' && $tab === 'seguridad') {
            return response()->json($this->vacio($tab, $seccion));
        }

        $esEvento = $seccion !== 'acciones';
        $tabla = $esEvento ? 'eventos_seguridad' : 'movimientos';

        $consulta = DB::table("{$tabla} as m")
            ->leftJoin('users as u', 'u.id', '=', 'm.user_id')
            ->leftJoin('roles as r', 'r.id', '=', 'u.role_id');

        // Rol de quien hizo la acción
        $columnaRol = $esEvento ? 'r.nombre' : 'm.rol';
        if ($tab !== 'seguridad') {
            $consulta->where($columnaRol, $tab);
        } elseif (! empty($datos['rol'])) {
            $consulta->where($columnaRol, $datos['rol']);
        }

        // Sección: inicios de sesión aparte del resto de eventos de seguridad
        if ($seccion === 'accesos') {
            $consulta->where('m.tipo', self::TIPO_ACCESO);
        } elseif ($seccion === 'seguridad') {
            $consulta->where('m.tipo', '!=', self::TIPO_ACCESO);
        }

        if (! empty($datos['q'])) {
            $q = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], trim($datos['q'])) . '%';
            $consulta->where(function ($sub) use ($q) {
                $sub->where('u.name', 'ilike', $q)->orWhere('u.email', 'ilike', $q);
            });
        }

        $columnaAccion = $esEvento ? 'm.tipo' : 'm.accion';
        if (! empty($datos['accion'])) {
            $consulta->where($columnaAccion, $datos['accion']);
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

        // Opciones del filtro "acción": lo que de verdad hay guardado en esta sección y pestaña
        // (salen sin los filtros de texto/fecha para que las opciones no desaparezcan al filtrar)
        $acciones = $this->opcionesAccion($tab, $seccion, $esEvento, $tabla, $columnaRol);

        $total = (clone $consulta)->count();
        $pagina = max(1, (int) $request->input('page', 1));
        $ultima = max(1, (int) ceil($total / self::POR_PAGINA));
        $pagina = min($pagina, $ultima);

        $sentido = ($datos['orden'] ?? 'reciente') === 'antiguo' ? 'asc' : 'desc';
        $filas = $consulta
            ->orderBy('m.fecha', $sentido)
            ->orderBy('m.id', $sentido)
            ->forPage($pagina, self::POR_PAGINA)
            ->get([
                'm.id',
                $esEvento ? 'm.tipo as accion' : 'm.accion',
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
                'fecha'       => $f->fecha ? Carbon::parse($f->fecha)->format('Y-m-d H:i:s') : null,
                'nombre'      => $f->nombre,
                'correo'      => $f->correo,
                'rol'         => $f->rol,
            ]);

        $respuesta = [
            'tab'           => $tab,
            'seccion'       => $seccion,
            'datos'         => $filas,
            'acciones'      => $acciones,
            'total'         => $total,
            'pagina_actual' => $pagina,
            'ultima_pagina' => $ultima,
            'desde'         => $total ? (($pagina - 1) * self::POR_PAGINA) + 1 : 0,
            'hasta'         => $total ? min($pagina * self::POR_PAGINA, $total) : 0,
        ];

        if ($request->boolean('conteos')) {
            $respuesta['conteos'] = $this->conteos();
        }

        return response()->json($respuesta);
    }

    /** Respuesta vacía con la misma forma (para combinaciones que no existen). */
    private function vacio(string $tab, string $seccion): array
    {
        return [
            'tab' => $tab, 'seccion' => $seccion, 'datos' => [], 'acciones' => [],
            'total' => 0, 'pagina_actual' => 1, 'ultima_pagina' => 1, 'desde' => 0, 'hasta' => 0,
        ];
    }

    /** Acciones distintas guardadas para esta sección (sin tener en cuenta los demás filtros). */
    private function opcionesAccion(string $tab, string $seccion, bool $esEvento, string $tabla, string $columnaRol)
    {
        if ($seccion === 'accesos') {
            return collect([self::TIPO_ACCESO]);
        }

        $consulta = DB::table("{$tabla} as m")
            ->leftJoin('users as u', 'u.id', '=', 'm.user_id')
            ->leftJoin('roles as r', 'r.id', '=', 'u.role_id');

        if ($tab !== 'seguridad') {
            $consulta->where($columnaRol, $tab);
        }
        if ($esEvento) {
            $consulta->where('m.tipo', '!=', self::TIPO_ACCESO);
        }

        $columna = $esEvento ? 'm.tipo' : 'm.accion';

        return $consulta->distinct()->orderBy($columna)->pluck($columna);
    }

    /** Total de cada pestaña: eventos de seguridad + acciones de ese rol. */
    private function conteos(): array
    {
        // Eventos de seguridad: por rol y por tipo; después se separan los inicios de sesión
        $eventos = DB::table('eventos_seguridad as m')
            ->leftJoin('users as u', 'u.id', '=', 'm.user_id')
            ->leftJoin('roles as r', 'r.id', '=', 'u.role_id')
            ->select('r.nombre as rol', 'm.tipo', DB::raw('count(*) as total'))
            ->groupBy('r.nombre', 'm.tipo')
            ->get()
            ->map(fn ($f) => (object) [
                'rol'    => $f->rol,
                'acceso' => $f->tipo === self::TIPO_ACCESO ? 1 : 0,
                'total'  => (int) $f->total,
            ]);

        $acciones = DB::table('movimientos')
            ->select('rol', DB::raw('count(*) as total'))
            ->groupBy('rol')
            ->pluck('total', 'rol');

        // Pestaña Seguridad: todos los roles (sin "acciones en su panel", que ahí no se muestran)
        $subs = ['seguridad' => [
            'seguridad' => (int) $eventos->where('acceso', 0)->sum('total'),
            'accesos'   => (int) $eventos->where('acceso', 1)->sum('total'),
        ]];
        // Pestañas de rol: sus tres submenús
        foreach (['administrador', 'inmobiliaria', 'agente', 'vendedor'] as $rol) {
            $subs[$rol] = [
                'seguridad' => (int) $eventos->where('rol', $rol)->where('acceso', 0)->sum('total'),
                'accesos'   => (int) $eventos->where('rol', $rol)->where('acceso', 1)->sum('total'),
                'acciones'  => (int) ($acciones[$rol] ?? 0),
            ];
        }

        // El número de cada pestaña es la suma de sus submenús
        $conteos = [];
        foreach ($subs as $tab => $partes) {
            $conteos[$tab] = array_sum($partes);
        }

        // Invitados (visitantes sin cuenta): el número de la pestaña son las personas que han entrado
        $subs['invitado'] = [
            'visitantes' => DB::table('invitados')->count(),
            'contactos'  => DB::table('invitado_eventos')->where('tipo', 'contacto')->count(),
        ];
        $conteos['invitado'] = $subs['invitado']['visitantes'];
        $conteos['subs'] = $subs;

        return $conteos;
    }
}
