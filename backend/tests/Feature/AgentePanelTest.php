<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Panel del agente: solo ve y gestiona lo que su inmobiliaria le asignó. */
class AgentePanelTest extends TestCase
{
    use RefreshDatabase;

    private User $inmo;
    private User $agente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inmo = $this->usuario('inmobiliaria');
        $this->agente = $this->usuario('agente', ['inmobiliaria_id' => $this->inmo->id]);
    }

    private function usuario(string $rol, array $extra = []): User
    {
        $role = Role::firstOrCreate(['nombre' => $rol], ['descripcion' => $rol]);

        return User::forceCreate(array_merge([
            'name' => ucfirst($rol) . ' prueba', 'email' => $rol . uniqid() . '@umbral.test',
            'password' => 'Umbral2026*', 'role_id' => $role->id, 'estado' => 'activo',
        ], $extra));
    }

    private function propiedad(?User $agente): Propiedad
    {
        return Propiedad::create([
            'user_id' => $this->inmo->id, 'agente_id' => $agente?->id,
            'tipo' => 'casa', 'operacion' => 'venta', 'precio' => 500000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cl ' . uniqid(), 'lat' => 4.4, 'lng' => -75.2, 'area' => 120, 'estado' => 'publicada',
        ]);
    }

    public function test_entra_y_ve_solo_lo_asignado(): void
    {
        $mia = $this->propiedad($this->agente);
        $otro = $this->usuario('agente', ['inmobiliaria_id' => $this->inmo->id]);
        $ajena = $this->propiedad($otro);
        Lead::create(['propiedad_id' => $mia->id, 'agente_id' => $this->agente->id, 'nombre' => 'Camila', 'contacto' => '310']);
        Lead::create(['propiedad_id' => $ajena->id, 'agente_id' => $otro->id, 'nombre' => 'Otro', 'contacto' => '311']);

        $this->postJson('/api/v1/agente/sesion', ['email' => $this->agente->email, 'password' => 'Umbral2026*'])
            ->assertOk()->assertJsonPath('usuario.inmobiliaria.id', $this->inmo->id);

        $this->getJson('/api/v1/agente/propiedades')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $mia->id);
        $this->getJson('/api/v1/agente/contactos')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'Camila');
        $this->getJson('/api/v1/agente/resumen')->assertOk()->assertJsonPath('kpis.propiedades', 1)->assertJsonPath('kpis.contactos_nuevos', 1);
    }

    public function test_agente_inactivo_o_inmobiliaria_no_puede_entrar(): void
    {
        $inactivo = $this->usuario('agente', ['inmobiliaria_id' => $this->inmo->id, 'estado' => 'inactivo']);
        $this->postJson('/api/v1/agente/sesion', ['email' => $inactivo->email, 'password' => 'Umbral2026*'])->assertStatus(403);

        $this->postJson('/api/v1/agente/sesion', ['email' => $this->inmo->email, 'password' => 'Umbral2026*'])->assertStatus(403);

        $suelto = $this->usuario('agente');
        $this->postJson('/api/v1/agente/sesion', ['email' => $suelto->email, 'password' => 'Umbral2026*'])->assertStatus(403);
    }

    public function test_gestiona_contactos_y_visitas_propias(): void
    {
        $mia = $this->propiedad($this->agente);
        $ajena = $this->propiedad(null);
        $lead = Lead::create(['propiedad_id' => $mia->id, 'agente_id' => $this->agente->id, 'nombre' => 'Camila', 'contacto' => '310']);
        $leadAjeno = Lead::create(['propiedad_id' => $ajena->id, 'nombre' => 'Ajeno', 'contacto' => '1']);
        $fecha = now('America/Bogota')->addDay()->setTime(9, 0)->format('Y-m-d\TH:i');

        $this->actingAs($this->agente)->patchJson("/api/v1/agente/contactos/{$leadAjeno->id}", ['estado' => 'cerrado'])->assertNotFound();

        $v = $this->postJson('/api/v1/agente/visitas', ['lead_id' => $lead->id, 'fecha' => $fecha])
            ->assertCreated()->assertJsonPath('data.agente.id', $this->agente->id);
        $this->assertSame('en_seguimiento', $lead->fresh()->estado);

        $this->postJson('/api/v1/agente/visitas', ['propiedad_id' => $ajena->id, 'nombre' => 'X', 'contacto' => '1', 'fecha' => $fecha])
            ->assertNotFound();

        $this->patchJson('/api/v1/agente/visitas/' . $v->json('data.id'), ['estado' => 'confirmada'])->assertOk();

        $otraVisita = Visita::create(['propiedad_id' => $ajena->id, 'nombre' => 'Z', 'contacto' => '2', 'fecha' => now()->addDay()]);
        $this->patchJson("/api/v1/agente/visitas/{$otraVisita->id}", ['estado' => 'cancelada'])->assertNotFound();

        $this->getJson('/api/v1/agente/visitas')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_perfil_telefono_y_clave(): void
    {
        $this->actingAs($this->agente)->putJson('/api/v1/agente/perfil', ['telefono' => '3001234567'])
            ->assertOk()->assertJsonPath('usuario.telefono', '3001234567');
        $this->postJson('/api/v1/agente/perfil/clave', ['actual' => 'Umbral2026*', 'password' => 'NuevaClave9', 'password_confirmation' => 'NuevaClave9'])
            ->assertOk();
    }

    public function test_contacto_del_portal_llega_al_agente_de_la_propiedad(): void
    {
        $mia = $this->propiedad($this->agente);

        $this->postJson('/api/v1/public/leads', ['propiedad_id' => $mia->id, 'nombre' => 'Visitante', 'contacto' => '3000000000', 'mensaje' => 'Hola'])
            ->assertCreated();

        $this->actingAs($this->agente)->getJson('/api/v1/agente/contactos')
            ->assertOk()->assertJsonPath('data.0.nombre', 'Visitante')->assertJsonPath('data.0.estado', 'nuevo');
    }
}
