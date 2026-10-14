<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\VerificacionController as AdminVerificacionController;
use App\Http\Controllers\Api\V1\Admin\CuentaController;
use App\Http\Controllers\Api\V1\Admin\ResumenController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Agente\ContactoController as AgenteContactoController;
use App\Http\Controllers\Api\V1\Agente\PanelController as AgentePanelController;
use App\Http\Controllers\Api\V1\Agente\PerfilController as AgentePerfilController;
use App\Http\Controllers\Api\V1\Agente\SesionController as AgenteSesionController;
use App\Http\Controllers\Api\V1\Agente\VisitaController as AgenteVisitaController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Inmobiliaria\AgenteController as InmobiliariaAgenteController;
use App\Http\Controllers\Api\V1\Inmobiliaria\ContactoController as InmobiliariaContactoController;
use App\Http\Controllers\Api\V1\Inmobiliaria\MembresiaController as InmobiliariaMembresiaController;
use App\Http\Controllers\Api\V1\Inmobiliaria\PerfilController as InmobiliariaPerfilController;
use App\Http\Controllers\Api\V1\Inmobiliaria\PropiedadController as InmobiliariaPropiedadController;
use App\Http\Controllers\Api\V1\Inmobiliaria\ResumenController as InmobiliariaResumenController;
use App\Http\Controllers\Api\V1\Inmobiliaria\VisitaController as InmobiliariaVisitaController;
use App\Http\Controllers\Api\V1\Inmobiliaria\SesionController as InmobiliariaSesionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\PublicPropiedadController;
use App\Http\Controllers\Api\V1\UbicacionController;


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

    // Consulta pública del estado de una cuenta (para la pantalla de espera).
    // Solo devuelve el estado (pendiente/activo/inactivo), nunca datos sensibles.
    Route::get('/estado-cuenta', [AuthController::class, 'estadoCuenta']);
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
    Route::get('verificaciones/historial', [AdminVerificacionController::class, 'historial']);
    Route::post('verificaciones/{usuario}/aprobar', [AdminVerificacionController::class, 'aprobar']);
    Route::post('verificaciones/{usuario}/rechazar', [AdminVerificacionController::class, 'rechazar']);
});

Route::prefix('v1/public')->group(function () {
    Route::get('propiedades', [PublicPropiedadController::class, 'index']);
        Route::get('ubicaciones', [UbicacionController::class, 'index']);
    Route::get('propiedades/{id}', [PublicPropiedadController::class, 'show']);
    Route::post('leads', [LeadController::class, 'store'])->middleware('throttle:10,1');
});




/*
|--------------------------------------------------------------------------
| API del panel de la inmobiliaria  →  /api/v1/inmobiliaria/...
|--------------------------------------------------------------------------
| Igual que el panel de administración: sesión web de Laravel (grupo "web").
| "inmobiliaria.api" exige sesión iniciada y rol inmobiliaria (401 / 403 en JSON).
*/
Route::prefix('v1/inmobiliaria')->middleware('web')->group(function () {
    // Inicio de sesión del panel (deja la cookie de sesión)
    Route::get('csrf', [InmobiliariaSesionController::class, 'csrf']);
    Route::post('sesion', [InmobiliariaSesionController::class, 'entrar'])->middleware('throttle:10,1');

    Route::middleware('inmobiliaria.api')->group(function () {
        Route::get('yo', [InmobiliariaSesionController::class, 'yo']);
        Route::post('salir', [InmobiliariaSesionController::class, 'salir']);

        // Dashboard: cifras, gráfica, agentes, contactos y visitas
        Route::get('resumen', InmobiliariaResumenController::class);

        // Propiedades (POST también para editar: así se puede subir la foto)
        Route::get('propiedades', [InmobiliariaPropiedadController::class, 'index']);
        Route::post('propiedades', [InmobiliariaPropiedadController::class, 'store']);
        Route::post('propiedades/{id}', [InmobiliariaPropiedadController::class, 'update'])->whereNumber('id');
        Route::patch('propiedades/{id}/estado', [InmobiliariaPropiedadController::class, 'estado'])->whereNumber('id');
        Route::patch('propiedades/{id}/agente', [InmobiliariaPropiedadController::class, 'asignar'])->whereNumber('id');
        Route::delete('propiedades/{id}', [InmobiliariaPropiedadController::class, 'destroy'])->whereNumber('id');

        // Agentes y equipo
        Route::get('agentes', [InmobiliariaAgenteController::class, 'index']);
        Route::post('agentes', [InmobiliariaAgenteController::class, 'store']);
        Route::put('agentes/{id}', [InmobiliariaAgenteController::class, 'update'])->whereNumber('id');
        Route::patch('agentes/{id}/estado', [InmobiliariaAgenteController::class, 'estado'])->whereNumber('id');

        // Contactos (leads) y visitas
        Route::get('contactos', [InmobiliariaContactoController::class, 'index']);
        Route::patch('contactos/{id}', [InmobiliariaContactoController::class, 'update'])->whereNumber('id');
        Route::get('visitas', [InmobiliariaVisitaController::class, 'index']);
        Route::post('visitas', [InmobiliariaVisitaController::class, 'store']);
        Route::patch('visitas/{id}', [InmobiliariaVisitaController::class, 'update'])->whereNumber('id');

        // Membresía (pago simulado hasta integrar PSE) y perfil de la empresa
        Route::get('membresia', [InmobiliariaMembresiaController::class, 'show']);
        Route::post('membresia', [InmobiliariaMembresiaController::class, 'contratar']);
        Route::get('perfil', [InmobiliariaPerfilController::class, 'show']);
        Route::post('perfil', [InmobiliariaPerfilController::class, 'update']);
        Route::post('perfil/clave', [InmobiliariaPerfilController::class, 'cambiarClave']);
    });
});

/*
|--------------------------------------------------------------------------
| API del panel del agente  →  /api/v1/agente/...
|--------------------------------------------------------------------------
| El agente solo ve lo que su inmobiliaria le asignó. Misma sesión web.
*/
Route::prefix('v1/agente')->middleware('web')->group(function () {
    Route::get('csrf', [AgenteSesionController::class, 'csrf']);
    Route::post('sesion', [AgenteSesionController::class, 'entrar'])->middleware('throttle:10,1');

    Route::middleware('agente.api')->group(function () {
        Route::get('yo', [AgenteSesionController::class, 'yo']);
        Route::post('salir', [AgenteSesionController::class, 'salir']);

        Route::get('resumen', [AgentePanelController::class, 'resumen']);
        Route::get('propiedades', [AgentePanelController::class, 'propiedades']);

        Route::get('contactos', [AgenteContactoController::class, 'index']);
        Route::patch('contactos/{id}', [AgenteContactoController::class, 'update'])->whereNumber('id');

        Route::get('visitas', [AgenteVisitaController::class, 'index']);
        Route::post('visitas', [AgenteVisitaController::class, 'store']);
        Route::patch('visitas/{id}', [AgenteVisitaController::class, 'update'])->whereNumber('id');

        Route::put('perfil', [AgentePerfilController::class, 'update']);
        Route::post('perfil/clave', [AgentePerfilController::class, 'cambiarClave']);
    });
});
