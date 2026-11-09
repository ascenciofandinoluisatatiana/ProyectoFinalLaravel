<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Controller;
use App\Services\Paneles\NotificacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Campana de notificaciones del panel del agente. */
class NotificacionController extends Controller
{
    /** GET /api/v1/agente/notificaciones */
    public function index(Request $request, NotificacionService $notificaciones): JsonResponse
    {
        return response()->json($notificaciones->deAgente($request->user()));
    }

    /** POST /api/v1/agente/notificaciones/leidas */
    public function leidas(Request $request, NotificacionService $notificaciones): JsonResponse
    {
        $notificaciones->marcarLeidas($request->user());

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }
}
