<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Services\Paneles\NotificacionGuardadaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Campana e historial de notificaciones del panel de la inmobiliaria (guardadas en la base de datos). */
class NotificacionController extends BaseInmobiliariaController
{
    /** Tipos que se pueden filtrar en el historial. */
    public const TIPOS = ['contacto', 'visita', 'propiedad', 'pago', 'plan', 'comision', 'cierre', 'vencimiento'];

    /** GET /notificaciones */
    public function index(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        return response()->json($notificaciones->listar($this->inmobiliaria($request)));
    }

    /** POST /notificaciones/leidas */
    public function leidas(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        $notificaciones->marcarLeidas($this->inmobiliaria($request));

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }

    /**
     * GET /notificaciones/historial
     *   ?estado=todas|sin_leer|leidas &tipo=... &desde=2026-11-01 &hasta=2026-11-30 &q=texto &pagina=1 &por_pagina=15
     */
    public function historial(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        $filtros = $request->validate([
            'estado' => ['nullable', Rule::in(['todas', 'sin_leer', 'leidas'])],
            'tipo' => ['nullable', Rule::in(self::TIPOS)],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
            'q' => ['nullable', 'string', 'max:100'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json($notificaciones->historial($this->inmobiliaria($request), $filtros));
    }
}
