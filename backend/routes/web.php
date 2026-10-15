<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas web de Laravel
|--------------------------------------------------------------------------
| El panel de administración ya vive en el frontend (HTML estático).
| Laravel solo maneja:
|   - /storage/...  → fotos de propiedades y avatares
|   - /up           → health check de Laravel
|
| Todas las rutas del panel pasan por /api/v1/admin/...
| con la cookie de sesión de Laravel (mismo origen, sin CORS).
*/

/*
|--------------------------------------------------------------------------
| Fotos subidas (propiedades y logos/avatares)  →  /storage/...
|--------------------------------------------------------------------------
| Si existe el enlace public/storage (php artisan storage:link) el archivo se
| entrega directo; si no (por ejemplo en Windows con Docker), lo entrega esta ruta.
| Solo se permiten estas dos carpetas y nombres simples (sin "..").
*/
Route::get('storage/{ruta}', function (string $ruta) {
    abort_unless(\Illuminate\Support\Facades\Storage::disk('public')->exists($ruta), 404);

    return \Illuminate\Support\Facades\Storage::disk('public')->response($ruta);
})->where('ruta', '(propiedades|avatars)/[A-Za-z0-9_\-]+\.(jpg|jpeg|png|webp)');
