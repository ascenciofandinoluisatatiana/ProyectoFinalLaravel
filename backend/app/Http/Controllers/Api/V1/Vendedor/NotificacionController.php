<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Controller;
use App\Services\Paneles\NotificacionVendedorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Campana de notificaciones del panel del vendedor (guardadas en la base de datos). */
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
}
