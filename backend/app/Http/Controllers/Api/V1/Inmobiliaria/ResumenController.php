<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Http\Controllers\Controller;
use App\Services\Inmobiliaria\ResumenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** GET /api/v1/inmobiliaria/resumen — cifras del dashboard de la inmobiliaria. */
class ResumenController extends Controller
{
    public function __invoke(Request $request, ResumenService $servicio): JsonResponse
    {
        return response()->json($servicio->datos($request->user()));
    }
}
