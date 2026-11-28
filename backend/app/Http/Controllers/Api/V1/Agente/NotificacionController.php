<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Inmobiliaria\NotificacionController as NotificacionInmobiliaria;
use App\Http\Controllers\Controller;
use App\Services\Paneles\NotificacionGuardadaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificacionController extends Controller
{
    public function index(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        return response()->json($notificaciones->listar($request->user()));
    }

    public function leidas(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        $notificaciones->marcarLeidas($request->user());

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }

    public function historial(Request $request, NotificacionGuardadaService $notificaciones): JsonResponse
    {
        $filtros = $request->validate([
            'estado' => ['nullable', Rule::in(['todas', 'sin_leer', 'leidas'])],
            'tipo' => ['nullable', Rule::in(NotificacionInmobiliaria::TIPOS)],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
            'q' => ['nullable', 'string', 'max:100'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json($notificaciones->historial($request->user(), $filtros));
    }
}
