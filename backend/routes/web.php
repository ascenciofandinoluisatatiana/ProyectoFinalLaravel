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
|    allí (una sola vez, con tiempo máximo y reintentos) y las entrega con la misma ruta,
|    así el frontend no cambia. Además nginx guarda cada foto en su caché.
| Solo se permiten las carpetas propiedades/, usuarios/ y avatars/ (con año/mes opcional),
| nombres simples (sin "..") y solo JPG, PNG, WebP o GIF. Los documentos de identidad NO
| se pueden ver por aquí: viven en otro disco y otra carpeta.
*/
Route::get('storage/{ruta}', function (string $ruta) {
    $local = \Illuminate\Support\Facades\Storage::disk('public');
    if ($local->exists($ruta)) {
        return $local->response($ruta);
    }

    // El bucket a veces se queda "colgado" (hasta más de 1 minuto en un pedido suelto).
    // Por eso se pide la foto UNA sola vez, con una dirección firmada de 5 minutos (se firma en
    // el servidor, sin llamar al bucket), con tiempo máximo de 6 segundos por intento, y se reintenta
    // hasta 3 veces solo si el bucket no responde o falla (un 404 no se reintenta).
    try {
        $url = \Illuminate\Support\Facades\Storage::disk('imagenes')->temporaryUrl($ruta, now()->addMinutes(5));

        $respuesta = \Illuminate\Support\Facades\Http::connectTimeout(3)->timeout(6)
            ->retry(3, 200, fn ($e) => $e instanceof \Illuminate\Http\Client\ConnectionException
                || ($e instanceof \Illuminate\Http\Client\RequestException && $e->response->serverError()),
                throw: false)
            ->get($url);

        if ($respuesta->successful()) {
            $tipos = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];

            return response($respuesta->body(), 200, [
                'Content-Type' => $tipos[strtolower(pathinfo($ruta, PATHINFO_EXTENSION))] ?? 'application/octet-stream',
                // El navegador la guarda un día: no se vuelve a pedir al bucket en cada visita
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }
    } catch (\Throwable $e) {
        // El bucket no respondió: se muestra como no encontrada
    }

    abort(404);
})->where('ruta', '(propiedades|usuarios|avatars)/([0-9]{4}/[0-9]{2}/)?[A-Za-z0-9_\-]+\.(jpg|jpeg|png|webp|gif)');

// Para Google: mapa del sitio con cada inmueble publicado y robots.txt (nginx los manda aquí)
Route::get('sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('robots.txt', [SeoController::class, 'robots']);

// Enlaces compartidos de un inmueble: nginx manda aquí a WhatsApp, Facebook, Google, etc. para que vean foto, precio y ubicación
Route::get('inmuebles/{operacion}/{slug}', [SeoController::class, 'ficha'])
    ->where('operacion', 'venta|arriendo')->where('slug', '[A-Za-z0-9\-]+');
