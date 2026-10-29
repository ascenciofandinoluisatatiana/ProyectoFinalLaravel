<?php

namespace Tests\Feature;

use App\Models\Comision;
use App\Models\Membresia;
use App\Models\PaqueteMembresia;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** Comisiones de agentes (4 %), paquete de 10 publicaciones y captcha del formulario. */
class CaptchaComisionesPaqueteTest extends TestCase
{
    use RefreshDatabase;

    private User $inmo;

    private User $agente;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.turnstile.site_key' => null, 'services.turnstile.secret_key' => null]);

        $rolInmo = Role::firstOrCreate(['nombre' => 'inmobiliaria'], ['descripcion' => 'inmobiliaria']);
        $rolAgente = Role::firstOrCreate(['nombre' => 'agente'], ['descripcion' => 'agente']);
        $this->inmo = User::forceCreate([
            'name' => 'Inmo', 'email' => 'inmo' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rolInmo->id, 'estado' => 'activo', 'telefono' => '3000000000',
        ]);
        $this->agente = User::forceCreate([
            'name' => 'Laura Agente', 'email' => 'agente' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rolAgente->id, 'estado' => 'activo', 'inmobiliaria_id' => $this->inmo->id,
        ]);
    }

    private function propiedad(array $extra = []): Propiedad
    {
        return Propiedad::create(array_merge([
            'user_id' => $this->inmo->id, 'agente_id' => $this->agente->id, 'tipo' => 'casa', 'operacion' => 'venta',
            'precio' => 500000000, 'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cl ' . uniqid(), 'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2,
            'parqueaderos' => 1, 'area' => 120, 'estado' => 'publicada',
        ], $extra));
    }

    /* ---------------- Comisiones ---------------- */

    public function test_al_vender_el_agente_gana_el_4_por_ciento_y_se_anula_si_se_reabre(): void
    {
        $casa = $this->propiedad();
        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/estado", ['estado' => 'vendida'])
            ->assertOk()->assertJsonFragment(['estado' => 'vendida']);

        $comision = Comision::sole();
        $this->assertSame([20000000, 'pendiente', $this->agente->id], [$comision->valor, $comision->estado, $comision->agente_id]);

        // Marcar vendida otra vez no duplica
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/estado", ['estado' => 'vendida'])->assertOk();
        $this->assertSame(1, Comision::count());

        // Volver a publicar anula la pendiente
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/estado", ['estado' => 'publicada'])->assertOk();
        $this->assertSame('anulada', $comision->fresh()->estado);
    }

    public function test_sin_agente_no_hay_comision_y_el_arriendo_usa_el_canon(): void
    {
        $sinAgente = $this->propiedad(['agente_id' => null]);
        $arriendo = $this->propiedad(['operacion' => 'arriendo', 'precio' => 2500000]);
        $this->actingAs($this->inmo);

        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$sinAgente->id}/estado", ['estado' => 'vendida'])->assertOk();
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$arriendo->id}/estado", ['estado' => 'arrendada'])->assertOk();

        $this->assertSame(100000, Comision::sole()->valor);   // 4 % de 2.500.000
    }

    public function test_inmobiliaria_marca_pagada_y_agente_ve_sus_comisiones(): void
    {
        $casa = $this->propiedad();
        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/estado", ['estado' => 'vendida']);
        $id = Comision::sole()->id;

        $this->getJson('/api/v1/inmobiliaria/comisiones')->assertOk()
            ->assertJsonPath('totales.pendiente', 20000000)->assertJsonPath('data.0.agente.id', $this->agente->id);
        $this->getJson('/api/v1/inmobiliaria/agentes')->assertOk()
            ->assertJsonPath('data.0.cierres', 1)->assertJsonPath('data.0.comision_pendiente', 20000000);

        $this->patchJson("/api/v1/inmobiliaria/comisiones/{$id}", ['estado' => 'pagada'])->assertOk()
            ->assertJsonPath('data.estado', 'pagada');

        $this->actingAs($this->agente)->getJson('/api/v1/agente/comisiones')->assertOk()
            ->assertJsonPath('totales.pagada', 20000000)->assertJsonCount(1, 'data');
    }

    public function test_otra_inmobiliaria_no_ve_ni_cambia_comisiones_ajenas(): void
    {
        $casa = $this->propiedad();
        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/estado", ['estado' => 'vendida']);
        $otra = User::forceCreate([
            'name' => 'Otra', 'email' => 'otra' . uniqid() . '@umbral.test', 'password' => 'x',
            'role_id' => $this->inmo->role_id, 'estado' => 'activo',
        ]);

        $this->actingAs($otra)->getJson('/api/v1/inmobiliaria/comisiones')->assertOk()->assertJsonCount(0, 'data');
        $this->patchJson('/api/v1/inmobiliaria/comisiones/' . Comision::sole()->id, ['estado' => 'pagada'])->assertNotFound();
    }

    /* ---------------- Paquete de 10 publicaciones ---------------- */

    public function test_paquete_con_descuento_y_eleccion_libre_de_publicaciones(): void
    {
        $this->actingAs($this->inmo);
        $esperado = (int) round(59900 * 10 * 0.75);

        $this->getJson('/api/v1/inmobiliaria/membresia')->assertOk()
            ->assertJsonPath('paquete', null)->assertJsonPath('paquete_oferta.precio', $esperado);

        $this->postJson('/api/v1/inmobiliaria/membresia/paquete')->assertCreated();
        $this->assertSame($esperado * 100, Pago::sole()->monto_centavos);
        $this->postJson('/api/v1/inmobiliaria/membresia/paquete')->assertStatus(422);   // uno vigente a la vez

        $props = collect(range(1, 11))->map(fn () => $this->propiedad());
        foreach ($props->take(10) as $p) {
            $this->postJson('/api/v1/inmobiliaria/membresia/paquete/publicaciones', ['propiedad_id' => $p->id])->assertCreated();
        }
        // El cupo 11 no cabe
        $this->postJson('/api/v1/inmobiliaria/membresia/paquete/publicaciones', ['propiedad_id' => $props[10]->id])->assertStatus(422);

        // Quitar una libera el cupo
        $this->deleteJson('/api/v1/inmobiliaria/membresia/paquete/publicaciones/' . $props[0]->id)->assertOk();
        $this->postJson('/api/v1/inmobiliaria/membresia/paquete/publicaciones', ['propiedad_id' => $props[10]->id])->assertCreated();

        $this->getJson('/api/v1/inmobiliaria/membresia')->assertJsonPath('paquete.usados', 10);
        $lista = collect($this->getJson('/api/v1/inmobiliaria/propiedades')->json('data'))->keyBy('id');
        $this->assertTrue($lista[$props[10]->id]['destacado']['en_paquete']);
        $this->assertNull($lista[$props[0]->id]['destacado']);
        $this->assertSame(10, Membresia::where('estado', 'activa')->whereNotNull('paquete_id')->where('plan', 'mensual')->count());
    }

    public function test_sin_paquete_no_se_pueden_elegir_publicaciones(): void
    {
        $p = $this->propiedad();
        $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/membresia/paquete/publicaciones', ['propiedad_id' => $p->id])
            ->assertStatus(422);
        $this->assertSame(0, PaqueteMembresia::count());
    }

    /* ---------------- Captcha ---------------- */

    public function test_registrar_inmueble_pide_captcha_cuando_esta_activo(): void
    {
        config(['services.turnstile.site_key' => 'sitio', 'services.turnstile.secret_key' => 'secreto']);
        DB::table('departamentos')->insertGetId(['codigo_dane' => '73', 'nombre' => 'Tolima', 'activo' => true]);
        DB::table('municipios')->insert(['departamento_id' => DB::table('departamentos')->value('id'), 'codigo_dane' => '73001', 'nombre' => 'Ibagué', 'activo' => true]);
        $datos = [
            'tipo' => 'casa', 'operacion' => 'venta', 'precio' => 300000000, 'departamento' => 'Tolima', 'ciudad' => 'Ibagué',
            'barrio' => 'Belén', 'direccion' => 'Cra 1 # 2-3', 'lat' => 4.43, 'lng' => -75.2, 'area' => 90,
        ];
        $this->actingAs($this->inmo);

        $this->getJson('/api/v1/inmobiliaria/propiedades')->assertJsonPath('captcha_site_key', 'sitio');

        // Sin token
        $this->postJson('/api/v1/inmobiliaria/propiedades', $datos)->assertStatus(422)->assertJsonValidationErrors('captcha');

        // Cloudflare responde según el token que llegó
        Http::fake(['challenges.cloudflare.com/*' => fn ($pedido) => Http::response(['success' => $pedido['response'] === 'bueno'])]);
        $this->postJson('/api/v1/inmobiliaria/propiedades', $datos + ['captcha' => 'malo'])->assertStatus(422);
        $this->postJson('/api/v1/inmobiliaria/propiedades', $datos + ['captcha' => 'bueno'])->assertCreated();
    }
}
