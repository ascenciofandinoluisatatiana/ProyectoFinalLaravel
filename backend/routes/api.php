<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1  →  /api/v1/...
|--------------------------------------------------------------------------
| Todas las rutas de la API viven bajo el prefijo /api/v1.
| Laravel ya agrega el prefijo "api"; aquí solo añadimos "v1".
*/

Route::prefix('v1')->group(function () {
    // Estado del sistema: comprueba PostgreSQL y Redis.
    Route::get('/health', HealthController::class);
});
