<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Paneles\NotificacionAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/** Campana del administrador: historial completo ("ver todas") y marcar como leídas. */
class NotificacionController extends Controller
{
    /**
     * GET /api/v1/admin/notificaciones
     *   ?tipo=registro|pago|error &desde=2026-11-01 &hasta=2026-11-30 &q=texto
     *   &rol=agente (registros) &pago=aprobado|no_completado (pagos) &orden=recientes|antiguas &pagina=1 &por_pagina=15
     */
    public function index(Request $request, NotificacionAdminService $servicio): JsonResponse
    {
        $filtros = $request->validate([
            'tipo' => ['nullable', Rule::in(NotificacionAdminService::TIPOS)],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
            'q' => ['nullable', 'string', 'max:100'],
            'rol' => ['nullable', Rule::in(['administrador', 'vendedor', 'inmobiliaria', 'agente'])],
            'pago' => ['nullable', Rule::in(['aprobado', 'no_completado'])],
            'orden' => ['nullable', Rule::in(['recientes', 'antiguas'])],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json($servicio->historial(Auth::guard('web')->user(), $filtros));
    }

    /** POST /api/v1/admin/notificaciones/leidas */
    public function leidas(NotificacionAdminService $servicio): JsonResponse
    {
        $servicio->marcarLeidas(Auth::guard('web')->user());

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }
}
