<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Accesos del administrador que tiene la sesión iniciada (pantalla Ajustes).
 * Solo lee eventos_seguridad de ESTA cuenta: nunca muestra a otros usuarios.
 *
 * GET /api/v1/admin/mis-accesos?page=1
 *   → resumen: último acceso, accesos y intentos fallidos de los últimos 30 días
 *   → datos: historial de inicios de sesión (10 por página)
 */
class MisAccesosController extends Controller
{
    private const POR_PAGINA = 10;
    private const DIAS = 30;

    public function index(Request $request): JsonResponse
    {
        $id = $request->user()->id;
        $desde = Carbon::now()->subDays(self::DIAS);

        $propios = fn () => DB::table('eventos_seguridad')->where('user_id', $id);

        $ultimo = $propios()->where('tipo', 'inicio_sesion')->orderByDesc('fecha')->orderByDesc('id')
            ->first(['fecha', 'ip', 'dispositivo']);

        $accesos30 = $propios()->where('tipo', 'inicio_sesion')->where('fecha', '>=', $desde)->count();
        $fallidos30 = $propios()->whereIn('tipo', ['login_fallido', 'cuenta_bloqueada'])->where('fecha', '>=', $desde)->count();

        $total = $propios()->where('tipo', 'inicio_sesion')->count();
        $ultima = max(1, (int) ceil($total / self::POR_PAGINA));
        $pagina = min(max(1, (int) $request->input('page', 1)), $ultima);

        $filas = $propios()->where('tipo', 'inicio_sesion')
            ->orderByDesc('fecha')->orderByDesc('id')
            ->forPage($pagina, self::POR_PAGINA)
            ->get(['id', 'fecha', 'ip', 'dispositivo', 'detalle'])
            ->map(fn ($f) => [
                'id'          => $f->id,
                'fecha'       => $f->fecha ? Carbon::parse($f->fecha)->format('Y-m-d H:i:s') : null,
                'ip'          => $f->ip,
                'dispositivo' => $f->dispositivo,
                'detalle'     => $f->detalle,
            ]);

        return response()->json([
            'resumen' => [
                'ultimo' => $ultimo ? [
                    'fecha'       => $ultimo->fecha ? Carbon::parse($ultimo->fecha)->format('Y-m-d H:i:s') : null,
                    'ip'          => $ultimo->ip,
                    'dispositivo' => $ultimo->dispositivo,
                ] : null,
                'accesos_30'  => $accesos30,
                'fallidos_30' => $fallidos30,
                'dias'        => self::DIAS,
            ],
            'datos'         => $filas,
            'total'         => $total,
            'pagina_actual' => $pagina,
            'ultima_pagina' => $ultima,
            'desde'         => $total ? (($pagina - 1) * self::POR_PAGINA) + 1 : 0,
            'hasta'         => $total ? min($pagina * self::POR_PAGINA, $total) : 0,
        ]);
    }
}
