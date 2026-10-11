<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ResumenService;
use Illuminate\Http\JsonResponse;

class ResumenController extends Controller
{
    /** GET /api/v1/admin/resumen — cifras y gráficas del dashboard */
    public function __invoke(ResumenService $servicio): JsonResponse
    {
        return response()->json($servicio->datos());
    }
}