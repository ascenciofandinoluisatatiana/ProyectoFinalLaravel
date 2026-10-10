<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PerfilController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VerificacionController;
use Illuminate\Support\Facades\Route;

// La raíz del proyecto lleva directo al panel de administración.
Route::get('/', fn () => redirect()->route('admin.panel'));

/*
|--------------------------------------------------------------------------
| Panel de administración  →  /admin/...
|--------------------------------------------------------------------------
| Vistas Blade con Tailwind. El middleware "admin" exige sesión
| iniciada y el rol "administrador".
*/
Route::prefix('admin')->name('admin.')->group(function () {

    // Acceso al panel
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('ingresar');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware('admin')->group(function () {

        // Panel principal (KPIs y gráficas)
        Route::get('/', [DashboardController::class, 'index'])->name('panel');

        // Gestión de usuarios
        Route::get('usuarios', [UserController::class, 'index'])->name('usuarios.index');
        Route::post('usuarios', [UserController::class, 'store'])->name('usuarios.store');
        Route::put('usuarios/{usuario}', [UserController::class, 'update'])->name('usuarios.update');
        Route::delete('usuarios/{usuario}', [UserController::class, 'destroy'])->name('usuarios.destroy');

        
        // Verificación de cuentas pendientes (aprobar / rechazar con historial)
        Route::get('verificaciones', [VerificacionController::class, 'index'])->name('verificaciones.index');
        Route::post('verificaciones/{usuario}/aprobar', [VerificacionController::class, 'aprobar'])->name('verificaciones.aprobar');
        Route::post('verificaciones/{usuario}/rechazar', [VerificacionController::class, 'rechazar'])->name('verificaciones.rechazar');

        // Módulos en construcción (Fase 7 y siguientes del SRS)
        Route::get('membresias', fn () => view('admin.modulo', ['modulo' => 'Membresías']))->name('membresias');
        Route::get('reportes', fn () => view('admin.modulo', ['modulo' => 'Reportes']))->name('reportes');

        // Cuenta del propio administrador
        Route::get('ajustes', [PerfilController::class, 'ajustes'])->name('ajustes');
        Route::post('ajustes/clave', [PerfilController::class, 'actualizarClave'])->name('ajustes.clave');
        Route::get('perfil', [PerfilController::class, 'perfil'])->name('perfil');
    });
});
