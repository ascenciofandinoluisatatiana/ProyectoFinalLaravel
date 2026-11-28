<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Services\Paneles\NotificacionGuardadaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificacionController extends BaseInmobiliariaController
{
    public const TIPOS = ['contacto', 'visita', 'propiedad', 'pago', 'plan', 'comision', 'cierre', 'vencimiento'];

    public function index(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        return response()->json($notificaciones->listar($this->inmobiliaria($request)));
    }

    public function leidas(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        $notificaciones->marcarLeidas($this->inmobiliaria($request));

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }

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
