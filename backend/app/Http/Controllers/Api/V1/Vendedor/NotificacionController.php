<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Controller;
use App\Services\Paneles\NotificacionVendedorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Campana de notificaciones e historial del panel del vendedor (guardados en la base de datos). */
class NotificacionController extends Controller
{
    /** GET /api/v1/vendedor/notificaciones */
    public function index(Request $request, NotificacionVendedorService $notificaciones): JsonResponse
    {
        return response()->json($notificaciones->listar($request->user()));
    }

    /** POST /api/v1/vendedor/notificaciones/leidas */
    public function leidas(Request $request, NotificacionVendedorService $notificaciones): JsonResponse
    {
        $notificaciones->marcarLeidas($request->user());

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }

    /**
     * GET /api/v1/vendedor/notificaciones/historial
     *   ?estado=todas|sin_leer|leidas &tipo=contacto|visita|vencimiento
     *   &desde=2026-11-01 &hasta=2026-11-30 &q=texto &pagina=1 &por_pagina=15
     */
    public function historial(Request $request, NotificacionVendedorService $notificaciones): JsonResponse
    {
        $filtros = $request->validate([
            'estado' => ['nullable', Rule::in(['todas', 'sin_leer', 'leidas'])],
            'tipo' => ['nullable', Rule::in(['contacto', 'visita', 'vencimiento'])],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
            'q' => ['nullable', 'string', 'max:100'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json($notificaciones->historial($request->user(), $filtros));
    }
}