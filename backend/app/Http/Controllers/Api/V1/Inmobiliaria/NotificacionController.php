<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Services\Paneles\NotificacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Campana de notificaciones del panel de la inmobiliaria. */
class NotificacionController extends BaseInmobiliariaController
{
    /** GET /notificaciones */
    public function index(Request $request, NotificacionService $notificaciones): JsonResponse
    {
        return response()->json($notificaciones->deInmobiliaria($this->inmobiliaria($request)));
    }

    /** POST /notificaciones/leidas */
    public function leidas(Request $request, NotificacionService $notificaciones): JsonResponse
    {
        $notificaciones->marcarLeidas($this->inmobiliaria($request));

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }
}
