<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1  →  /api/v1/...
|--------------------------------------------------------------------------
| Laravel ya agrega el prefijo "api"; aquí solo añadimos "v1".
*/

Route::prefix('v1')->group(function () {
    // Estado del sistema: comprueba PostgreSQL y Redis.
    Route::get('/health', HealthController::class);

    // Inicio de sesión
    Route::post('/login', [AuthController::class, 'login']);
});