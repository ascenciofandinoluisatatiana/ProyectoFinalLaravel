<?php

use App\Http\Controllers\SeoController;
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
| 1) Fotos antiguas: están en la carpeta local (disco "public"); se entregan desde ahí.
| 2) Fotos nuevas: viven en el Object Storage (disco "imagenes"); Laravel las trae de
|    allí y las entrega con la misma ruta, así el frontend no cambia.
| Solo se permiten las carpetas propiedades/, usuarios/ y avatars/ (con año/mes opcional),
| nombres simples (sin "..") y solo JPG, PNG, WebP o GIF. Los documentos de identidad NO
| se pueden ver por aquí: viven en otro disco y otra carpeta.
*/
Route::get('storage/{ruta}', function (string $ruta) {
    $local = \Illuminate\Support\Facades\Storage::disk('public');
    if ($local->exists($ruta)) {
        return $local->response($ruta);
    }

    try {
        return \Illuminate\Support\Facades\Storage::disk('imagenes')->response($ruta, null, [
            // El navegador la guarda un día: no se vuelve a pedir al bucket en cada visita
            'Cache-Control' => 'public, max-age=86400',
        ]);
    } catch (\Throwable $e) {
        // No existe en el bucket (o el bucket no respondió): se muestra como no encontrada
        abort(404);
    }
})->where('ruta', '(propiedades|usuarios|avatars)/([0-9]{4}/[0-9]{2}/)?[A-Za-z0-9_\-]+\.(jpg|jpeg|png|webp|gif)');

// Para Google: mapa del sitio con cada inmueble publicado y robots.txt (nginx los manda aquí)
Route::get('sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('robots.txt', [SeoController::class, 'robots']);

// Enlaces compartidos de un inmueble: nginx manda aquí a WhatsApp, Facebook, Google, etc. para que vean foto, precio y ubicación
Route::get('inmuebles/{operacion}/{slug}', [SeoController::class, 'ficha'])
    ->where('operacion', 'venta|arriendo')->where('slug', '[A-Za-z0-9\-]+');
