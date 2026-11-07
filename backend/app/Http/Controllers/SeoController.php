<?php

namespace App\Http\Controllers;

use App\Models\Propiedad;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/** sitemap.xml y robots.txt para que Google encuentre cada inmueble publicado. */
class SeoController extends Controller
{
    /** GET /sitemap.xml: el listado y una URL por inmueble publicado (/inmuebles/venta/nombre-12). */
    public function sitemap(Request $r): Response
    {
        $base = $this->base($r);

        $urls = [['loc' => $base . '/inmuebles', 'lastmod' => null]];
        Propiedad::where('estado', 'publicada')
            ->orderBy('id')
            ->get(['id', 'tipo', 'operacion', 'barrio', 'ciudad', 'updated_at'])
            ->each(function (Propiedad $p) use (&$urls, $base) {
                $urls[] = ['loc' => $base . self::ruta($p), 'lastmod' => $p->updated_at?->toIso8601String()];
            });

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
            . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $u) {
            $xml .= '  <url><loc>' . e($u['loc']) . '</loc>'
                . ($u['lastmod'] ? '<lastmod>' . $u['lastmod'] . '</lastmod>' : '')
                . '</url>' . "\n";
        }

        return response($xml . '</urlset>', 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    /** GET /robots.txt: permite el portal público, deja fuera los paneles y apunta al sitemap. */
    public function robots(Request $r): Response
    {
        $txt = "User-agent: *\n"
            . "Allow: /inmuebles\n"
            . "Disallow: /api/\n"
            . "Disallow: /panel-admin/\n"
            . "Disallow: /vendedor/\n"
            . "Disallow: /inmobiliaria/\n"
            . "Disallow: /agente/\n"
            . "\nSitemap: " . $this->base($r) . "/sitemap.xml\n";

        return response($txt, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    /** Misma ruta que arma el navegador (frontend/invitado/js/rutas.js): operación + tipo en barrio ciudad + id. */
    public static function ruta(Propiedad $p): string
    {
        $op = $p->operacion === 'arriendo' ? 'arriendo' : 'venta';
        $nombre = Str::slug($p->tipo . ' en ' . $p->barrio . ' ' . $p->ciudad) ?: 'inmueble';

        return "/inmuebles/{$op}/{$nombre}-{$p->id}";
    }

    /** Dirección pública del sitio (nginx manda el host y el protocolo originales). */
    private function base(Request $r): string
    {
        return ($r->header('X-Forwarded-Proto') ?: $r->getScheme()) . '://' . $r->getHttpHost();
    }
}
