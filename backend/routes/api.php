<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\VerificacionController as AdminVerificacionController;
use App\Http\Controllers\Api\V1\Admin\CuentaController;
use App\Http\Controllers\Api\V1\Admin\ResumenController;
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

    // Registro de cuentas nuevas (rol vendedor)
    Route::post('/registro', [AuthController::class, 'register']);
});

/*
|--------------------------------------------------------------------------
| API del panel de administración  →  /api/v1/admin/...
|--------------------------------------------------------------------------
| Devuelve solo JSON; las pantallas viven en el frontend.
| Por ahora la identidad sale de la sesión del login actual (grupo "web");
| "admin.api" exige sesión iniciada y rol administrador (401 / 403 en JSON).
| Cuando se agreguen tokens, el cambio se limita a este grupo.
*/
Route::prefix('v1/admin')->middleware(['web', 'admin.api'])->group(function () {
    // Cuenta del administrador, menú y listas para formularios
    Route::get('yo', [CuentaController::class, 'yo']);
    Route::get('menu', [CuentaController::class, 'menu']);
    Route::get('catalogos', [CuentaController::class, 'catalogos']);
    Route::post('clave', [CuentaController::class, 'cambiarClave']);
    Route::post('logout', [CuentaController::class, 'salir']);

    // Panel principal: cifras y gráficas del dashboard
    Route::get('resumen', ResumenController::class);

    // Gestión de usuarios
    Route::get('usuarios', [AdminUserController::class, 'index']);
    Route::post('usuarios', [AdminUserController::class, 'store']);
    Route::put('usuarios/{usuario}', [AdminUserController::class, 'update']);
    Route::delete('usuarios/{usuario}', [AdminUserController::class, 'destroy']);

    // Verificación de cuentas pendientes
    Route::get('verificaciones', [AdminVerificacionController::class, 'index']);
    Route::post('verificaciones/{usuario}/aprobar', [AdminVerificacionController::class, 'aprobar']);
    Route::post('verificaciones/{usuario}/rechazar', [AdminVerificacionController::class, 'rechazar']);
});
