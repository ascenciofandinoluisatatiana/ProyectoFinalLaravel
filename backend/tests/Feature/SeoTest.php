<?php

namespace Tests\Feature;

use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** sitemap.xml y robots.txt: Google debe poder encontrar cada inmueble publicado. */
class SeoTest extends TestCase
{
    use RefreshDatabase;

    private function propiedad(User $dueno, string $operacion, string $estado): Propiedad
    {
        return Propiedad::create([
            'user_id' => $dueno->id, 'tipo' => 'casa', 'operacion' => $operacion, 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén', 'direccion' => 'Cra 1 # ' . uniqid(),
            'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 120,
            'estado' => $estado,
        ]);
    }

    public function test_el_sitemap_lista_solo_los_inmuebles_publicados(): void
    {
        $rol = Role::firstOrCreate(['nombre' => 'vendedor'], ['descripcion' => 'vendedor']);
        $dueno = User::forceCreate([
            'name' => 'Vendedor SEO', 'email' => 'seo' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => 'activo', 'telefono' => '3000000000',
        ]);
        $venta = $this->propiedad($dueno, 'venta', 'publicada');
        $arriendo = $this->propiedad($dueno, 'arriendo', 'publicada');
        $borrador = $this->propiedad($dueno, 'venta', 'borrador');

        $res = $this->get('/sitemap.xml')->assertOk();

        $this->assertStringContainsString('application/xml', $res->headers->get('Content-Type'));
        $xml = $res->getContent();
        $this->assertStringContainsString('/inmuebles</loc>', $xml);
        $this->assertStringContainsString("/inmuebles/venta/casa-en-belen-ibague-{$venta->id}</loc>", $xml);
        $this->assertStringContainsString("/inmuebles/arriendo/casa-en-belen-ibague-{$arriendo->id}</loc>", $xml);
        $this->assertStringNotContainsString("-{$borrador->id}</loc>", $xml);
    }

    public function test_robots_apunta_al_sitemap_y_cierra_los_paneles(): void
    {
        $txt = $this->get('/robots.txt')->assertOk()->getContent();

        $this->assertStringContainsString('Allow: /inmuebles', $txt);
        $this->assertStringContainsString('Disallow: /panel-admin/', $txt);
        $this->assertMatchesRegularExpression('#Sitemap: https?://[^/\s]+/sitemap\.xml#', $txt);
    }
}
