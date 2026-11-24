<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Avisos guardados del vendedor: campana, marcar leídas, historial con filtros y que cada uno vea solo lo suyo. */
class VendedorNotificacionesTest extends TestCase
{
    use RefreshDatabase;

    private User $vendedor;

    private User $otro;

    protected function setUp(): void
    {
        parent::setUp();

        $this->vendedor = $this->usuario('vendedor');
        $this->otro = $this->usuario('vendedor');
    }

    private function usuario(string $rol): User
    {
        $role = Role::firstOrCreate(['nombre' => $rol], ['descripcion' => $rol]);

        return User::forceCreate([
            'name' => ucfirst($rol) . ' prueba', 'email' => $rol . uniqid() . '@umbral.test',
            'password' => 'Umbral2026*', 'role_id' => $role->id, 'estado' => 'activo',
        ]);
    }

    private function propiedad(User $duenio): Propiedad
    {
        return Propiedad::create([
            'user_id' => $duenio->id, 'tipo' => 'casa', 'operacion' => 'venta',
            'precio' => 100000000, 'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cl ' . uniqid(), 'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2,
            'parqueaderos' => 1, 'area' => 120, 'estado' => 'publicada',
        ]);
    }

    private function contacto(Propiedad $casa, string $nombre = 'Ana'): Lead
    {
        return Lead::create(['propiedad_id' => $casa->id, 'nombre' => $nombre, 'contacto' => '3001112233', 'estado' => 'nuevo']);
    }

    public function test_un_contacto_nuevo_crea_su_aviso_y_la_campana_lo_cuenta(): void
    {
        $this->contacto($this->propiedad($this->vendedor), 'Ana');

        $r = $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/notificaciones')->assertOk();

        $this->assertGreaterThanOrEqual(1, $r->json('sin_leer'));
        $this->assertStringContainsString('Ana', collect($r->json('data'))->pluck('titulo')->implode(' | '));
        $this->assertTrue((bool) $r->json('data.0.nueva'));
    }

    public function test_marcar_leidas_deja_el_contador_en_cero(): void
    {
        $this->contacto($this->propiedad($this->vendedor));

        $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/notificaciones')->assertOk();
        $this->postJson('/api/v1/vendedor/notificaciones/leidas')->assertOk();

        $this->getJson('/api/v1/vendedor/notificaciones')->assertOk()->assertJsonPath('sin_leer', 0)->assertJsonPath('data.0.nueva', false);
    }

    public function test_un_aviso_nuevo_despues_de_marcar_leidas_vuelve_a_contar(): void
    {
        $casa = $this->propiedad($this->vendedor);
        $this->contacto($casa, 'Ana');
        $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/notificaciones');
        $this->postJson('/api/v1/vendedor/notificaciones/leidas')->assertOk();

        $this->contacto($casa, 'Beto');

        $this->getJson('/api/v1/vendedor/notificaciones')->assertOk()->assertJsonPath('sin_leer', 1);
    }

    public function test_cada_vendedor_ve_solo_sus_avisos(): void
    {
        $this->contacto($this->propiedad($this->vendedor), 'Solo mio');

        $this->actingAs($this->otro)->getJson('/api/v1/vendedor/notificaciones')
            ->assertOk()->assertJsonPath('sin_leer', 0)->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/vendedor/notificaciones/historial')
            ->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_el_historial_filtra_por_leidas_y_sin_leer(): void
    {
        $casa = $this->propiedad($this->vendedor);
        $this->contacto($casa, 'Ana');
        $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/notificaciones');
        $this->postJson('/api/v1/vendedor/notificaciones/leidas')->assertOk();
        $this->contacto($casa, 'Beto');
        $this->getJson('/api/v1/vendedor/notificaciones');

        $sinLeer = $this->getJson('/api/v1/vendedor/notificaciones/historial?estado=sin_leer')->assertOk();
        $leidas = $this->getJson('/api/v1/vendedor/notificaciones/historial?estado=leidas')->assertOk();
        $todas = $this->getJson('/api/v1/vendedor/notificaciones/historial')->assertOk();

        $this->assertGreaterThanOrEqual(1, $sinLeer->json('meta.total'));
        $this->assertGreaterThanOrEqual(1, $leidas->json('meta.total'));
        $this->assertSame($sinLeer->json('meta.total') + $leidas->json('meta.total'), $todas->json('meta.total'));
        $this->assertTrue(collect($sinLeer->json('data'))->every(fn ($n) => $n['leida'] === false));
        $this->assertTrue(collect($leidas->json('data'))->every(fn ($n) => $n['leida'] === true));
    }

    public function test_el_historial_busca_por_texto_y_valida_los_filtros(): void
    {
        $casa = $this->propiedad($this->vendedor);
        $this->contacto($casa, 'Zulema');
        $this->contacto($casa, 'Ricardo');
        $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/notificaciones');

        $this->getJson('/api/v1/vendedor/notificaciones/historial?q=Zulema')->assertOk()->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/vendedor/notificaciones/historial?estado=raro')->assertStatus(422);
        $this->getJson('/api/v1/vendedor/notificaciones/historial?tipo=raro')->assertStatus(422);
        $this->getJson('/api/v1/vendedor/notificaciones/historial?desde=ayer')->assertStatus(422);
    }

    public function test_el_historial_pagina_y_pide_sesion(): void
    {
        $casa = $this->propiedad($this->vendedor);
        foreach (['A', 'B', 'C'] as $n) {
            $this->contacto($casa, "Persona $n");
        }
        $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/notificaciones');

        $this->getJson('/api/v1/vendedor/notificaciones/historial?por_pagina=2')
            ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.paginas', 2);

        auth()->logout();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/vendedor/notificaciones')->assertStatus(401);
    }
}