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

    /**
     * GET /inmuebles/{venta|arriendo}/{nombre-12}: ficha ligera con los datos del inmueble para quien NO es una persona
     * con navegador: WhatsApp, Facebook, X, Telegram, LinkedIn y Google. Así el enlace compartido muestra la foto, el
     * precio y la ubicación del inmueble (etiquetas Open Graph). nginx manda aquí solo a esos rastreadores; las personas
     * siguen viendo el portal normal (frontend/invitado/dashboard.html).
     */
    public function ficha(Request $r, string $operacion, string $slug): Response
    {
        $id = preg_match('/-(\d+)$/', $slug, $m) ? (int) $m[1] : 0;
        $p = $id ? Propiedad::where('estado', 'publicada')
            ->whereHas('vendedor', fn ($u) => $u->where('estado', 'activo'))
            ->with('fotos')->find($id) : null;

        $base = $this->base($r);
        if (! $p) {
            // Inmueble que ya no existe: página genérica (sin foto inventada) para que el enlace no se vea roto
            return response($this->paginaFicha(
                'UMBRAL · Portal inmobiliario de Colombia',
                'Casas, apartamentos y locales en venta y arriendo, con vendedores verificados.',
                $base . '/inmuebles', $base . '/img/icono.png', null
            ), 404, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        $tipos = ['casa' => 'Casa', 'apartamento' => 'Apartamento', 'finca' => 'Finca', 'local' => 'Local', 'lote' => 'Lote', 'oficina' => 'Oficina'];
        $tipo = $tipos[$p->tipo] ?? ucfirst((string) $p->tipo);
        $arriendo = $p->operacion === 'arriendo';
        $precio = '$' . number_format((float) $p->precio, 0, ',', '.') . ($arriendo ? ' al mes' : '');
        $lugar = trim($p->barrio . ', ' . $p->ciudad, ', ');
        $titulo = "{$tipo} en " . ($arriendo ? 'arriendo' : 'venta') . " en {$lugar} · {$precio}";

        $datos = array_filter([
            $p->habitaciones ? $p->habitaciones . ' hab.' : null,
            $p->banos ? $p->banos . ' baños' : null,
            $p->parqueaderos ? $p->parqueaderos . ' parq.' : null,
            $p->area ? rtrim(rtrim(number_format((float) $p->area, 1, ',', '.'), '0'), ',') . ' m²' : null,
            $p->estrato ? 'Estrato ' . $p->estrato : null,
        ]);
        $desc = trim(implode(' · ', $datos) . '. ' . preg_replace('/\s+/u', ' ', strip_tags((string) $p->descripcion)));
        $desc = Str::limit(trim($desc, ' .') ?: "{$tipo} en {$lugar}. Míralo en UMBRAL.", 200);

        // Foto principal; si no hay, la primera de la galería (los GIF casi nunca se previsualizan: se evitan)
        $ruta = collect([$p->imagen])->merge($p->fotos->pluck('ruta'))
            ->filter(fn ($x) => $x && ! preg_match('/\.gif$/i', (string) $x))->first();
        $imagen = $ruta
            ? (str_starts_with($ruta, 'http') ? $ruta : $base . (str_starts_with($ruta, '/') ? '' : '/storage/') . $ruta)
            : $base . '/img/icono.png';

        return response(
            $this->paginaFicha($titulo, $desc, $base . self::ruta($p), $imagen, $p),
            200,
            ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'public, max-age=300']
        );
    }

    private function paginaFicha(string $titulo, string $desc, string $url, string $imagen, ?Propiedad $p): string
    {
        [$t, $d, $u, $i] = [e($titulo), e($desc), e($url), e($imagen)];
        $json = '';
        if ($p) {
            $json = '<script type="application/ld+json">' . json_encode([
                '@context' => 'https://schema.org',
                '@type'    => 'RealEstateListing',
                'name'     => $titulo,
                'description' => $desc,
                'url'      => $url,
                'image'    => $imagen,
                'offers'   => ['@type' => 'Offer', 'price' => (int) $p->precio, 'priceCurrency' => 'COP'],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . '</script>';
        }

        return <<<HTML
<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>{$t}</title>
<meta name="description" content="{$d}">
<link rel="canonical" href="{$u}">
<meta property="og:type" content="website"><meta property="og:site_name" content="UMBRAL"><meta property="og:locale" content="es_CO">
<meta property="og:title" content="{$t}"><meta property="og:description" content="{$d}">
<meta property="og:url" content="{$u}"><meta property="og:image" content="{$i}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{$t}">
<meta name="twitter:description" content="{$d}"><meta name="twitter:image" content="{$i}">
{$json}</head><body><h1>{$t}</h1><p>{$d}</p><p><a href="{$u}">Ver en UMBRAL</a></p></body></html>
HTML;
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
