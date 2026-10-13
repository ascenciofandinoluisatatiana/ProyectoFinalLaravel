<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Panel de la inmobiliaria: acceso y dashboard (/api/v1/inmobiliaria/...). */
class InmobiliariaPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol, array $extra = []): User
    {
        $role = Role::firstOrCreate(['nombre' => $rol], ['descripcion' => $rol]);

        return User::forceCreate(array_merge([
            'name' => ucfirst($rol) . ' prueba',
            'email' => $rol . uniqid() . '@umbral.test',
            'password' => 'Umbral2026*',
            'role_id' => $role->id,
            'estado' => 'activo',
        ], $extra));
    }

    private function propiedad(User $duenio, ?User $agente = null): Propiedad
    {
        return Propiedad::create([
            'user_id' => $duenio->id, 'agente_id' => $agente?->id,
            'tipo' => 'apartamento', 'operacion' => 'venta', 'precio' => 300000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cra 4 # ' . uniqid(), 'lat' => 4.43, 'lng' => -75.2,
            'area' => 80, 'estado' => 'publicada',
        ]);
    }

    public function test_sin_sesion_responde_401(): void
    {
        $this->getJson('/api/v1/inmobiliaria/resumen')->assertStatus(401);
    }

    public function test_otro_rol_no_puede_iniciar_sesion_en_el_panel(): void
    {
        $vendedor = $this->usuario('vendedor');

        $this->postJson('/api/v1/inmobiliaria/sesion', ['email' => $vendedor->email, 'password' => 'Umbral2026*'])
            ->assertStatus(403);

        $this->assertGuest();
    }

    public function test_cuenta_pendiente_no_puede_entrar(): void
    {
        $inmo = $this->usuario('inmobiliaria', ['estado' => 'pendiente']);

        $this->postJson('/api/v1/inmobiliaria/sesion', ['email' => $inmo->email, 'password' => 'Umbral2026*'])
            ->assertStatus(403);
    }

    public function test_inmobiliaria_inicia_sesion_y_ve_solo_sus_datos(): void
    {
        $inmo = $this->usuario('inmobiliaria');
        $agente = $this->usuario('agente', ['inmobiliaria_id' => $inmo->id]);
        $propia = $this->propiedad($inmo, $agente);
        $this->propiedad($inmo);

        // Datos de OTRA inmobiliaria: no deben contarse
        $otra = $this->usuario('inmobiliaria');
        $ajena = $this->propiedad($otra);
        Lead::create(['propiedad_id' => $ajena->id, 'nombre' => 'Ajeno', 'contacto' => '300']);

        Lead::create(['propiedad_id' => $propia->id, 'agente_id' => $agente->id, 'nombre' => 'Camila', 'contacto' => '310']);

        $this->postJson('/api/v1/inmobiliaria/sesion', ['email' => $inmo->email, 'password' => 'Umbral2026*'])
            ->assertOk()
            ->assertJsonPath('usuario.rol', 'inmobiliaria');

        $this->getJson('/api/v1/inmobiliaria/resumen')
            ->assertOk()
            ->assertJsonPath('kpis.propiedades', 2)
            ->assertJsonPath('kpis.sin_agente', 1)
            ->assertJsonPath('kpis.agentes', 1)
            ->assertJsonPath('kpis.leads', 1)
            ->assertJsonPath('kpis.leads_nuevos', 1)
            ->assertJsonPath('agentes.0.contactos', 1)
            ->assertJsonPath('ultimos_contactos.0.nombre', 'Camila')
            ->assertJsonCount(7, 'contactos_7_dias');
    }

    public function test_salir_cierra_la_sesion(): void
    {
        $inmo = $this->usuario('inmobiliaria');

        $this->actingAs($inmo)->postJson('/api/v1/inmobiliaria/salir')->assertOk();
        $this->assertGuest();
    }
}
