<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Paneles de inmobiliaria y agente (tareas de Jorge):
 *   IN4 / AG4  filtros de texto y fechas en contactos, visitas y ventas
 *   AG3        filtros de "Mis propiedades" del agente
 *   IN6 / AG5  la inmobiliaria restablece la contraseña del agente; el agente no edita sus datos
 */
class PanelesFiltrosClaveTest extends TestCase
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
            'name' => ucfirst($rol) . ' prueba',
            'email' => $rol . uniqid() . '@umbral.test',
            'password' => 'Umbral2026*',
            'role_id' => $role->id,
            'estado' => 'activo',
        ], $extra));
    }

    private function propiedad(array $extra = []): Propiedad
    {
        return Propiedad::create(array_merge([
            'user_id' => $this->inmo->id, 'tipo' => 'apartamento', 'operacion' => 'venta', 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén', 'direccion' => 'Cra ' . uniqid(),
            'lat' => 4.438, 'lng' => -75.205, 'area' => 90, 'estado' => 'publicada',
        ], $extra));
    }

    public function test_contactos_se_filtran_por_texto_y_fechas_en_ambos_paneles(): void
    {
        $belen = $this->propiedad(['agente_id' => $this->agente->id]);
        $cadiz = $this->propiedad(['barrio' => 'Cádiz', 'agente_id' => $this->agente->id]);
        $viejo = Lead::create(['propiedad_id' => $belen->id, 'agente_id' => $this->agente->id, 'nombre' => 'Camila Rojas', 'contacto' => '3104567890', 'mensaje' => '¿Es negociable?']);
        $viejo->forceFill(['created_at' => now()->subDays(10)])->save();
        Lead::create(['propiedad_id' => $cadiz->id, 'agente_id' => $this->agente->id, 'nombre' => 'Julián Herrera', 'contacto' => '3206677889', 'mensaje' => 'Más fotos']);

        $this->actingAs($this->inmo);
        $this->getJson('/api/v1/inmobiliaria/contactos?q=CAMILA')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'Camila Rojas');
        $this->getJson('/api/v1/inmobiliaria/contactos?q=cádiz')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/inmobiliaria/contactos?desde=' . now('America/Bogota')->subDays(2)->toDateString())->assertOk()->assertJsonCount(1, 'data');
        // Fecha mal escrita: se ignora y no rompe el listado
        $this->getJson('/api/v1/inmobiliaria/contactos?desde=ayer')->assertOk()->assertJsonCount(2, 'data');
        // % y _ se buscan como texto, no como comodines
        $this->getJson('/api/v1/inmobiliaria/contactos?q=%25')->assertOk()->assertJsonCount(0, 'data');

        $this->actingAs($this->agente);
        $this->getJson('/api/v1/agente/contactos?q=fotos')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'Julián Herrera');
        $this->getJson('/api/v1/agente/contactos?hasta=' . now('America/Bogota')->subDays(5)->toDateString())->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_visitas_se_filtran_por_agente_estado_y_texto(): void
    {
        $prop = $this->propiedad(['agente_id' => $this->agente->id]);
        $fecha = now()->addDays(2);
        Visita::create(['propiedad_id' => $prop->id, 'agente_id' => $this->agente->id, 'nombre' => 'Camila', 'contacto' => '310', 'fecha' => $fecha, 'estado' => 'pendiente']);
        Visita::create(['propiedad_id' => $prop->id, 'agente_id' => null, 'nombre' => 'Laura', 'contacto' => '311', 'fecha' => $fecha, 'estado' => 'confirmada']);

        $this->actingAs($this->inmo);
        $this->getJson('/api/v1/inmobiliaria/visitas?agente_id=sin')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'Laura');
        $this->getJson('/api/v1/inmobiliaria/visitas?agente_id=' . $this->agente->id)->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/inmobiliaria/visitas?q=laura')->assertOk()->assertJsonCount(1, 'data');

        $this->actingAs($this->agente);
        $this->getJson('/api/v1/agente/visitas?estado=pendiente')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nombre', 'Camila');
    }

    public function test_mis_propiedades_del_agente_se_filtran(): void
    {
        $this->propiedad(['agente_id' => $this->agente->id]);
        $this->propiedad(['agente_id' => $this->agente->id, 'operacion' => 'arriendo', 'precio' => 1800000, 'barrio' => 'Cádiz', 'estado' => 'pausada']);
        $this->propiedad();   // sin agente: no le aparece

        $this->actingAs($this->agente);
        $this->getJson('/api/v1/agente/propiedades')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/agente/propiedades?operacion=arriendo')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/agente/propiedades?estado=publicada')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/agente/propiedades?q=cadiz')->assertOk()->assertJsonCount(0, 'data');   // sin tilde no coincide
        $this->getJson('/api/v1/agente/propiedades?q=Cádiz')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_inmobiliaria_restablece_la_clave_de_su_agente(): void
    {
        $this->agente->forceFill(['intentos_fallidos' => 4, 'bloqueado_hasta' => now()->addMinutes(10)])->save();
        $this->actingAs($this->inmo);

        $this->postJson("/api/v1/inmobiliaria/agentes/{$this->agente->id}/clave", ['password' => 'corta', 'password_confirmation' => 'corta'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->postJson("/api/v1/inmobiliaria/agentes/{$this->agente->id}/clave", ['password' => 'NuevaClave2026', 'password_confirmation' => 'Otra'])
            ->assertStatus(422);

        $this->postJson("/api/v1/inmobiliaria/agentes/{$this->agente->id}/clave", ['password' => 'NuevaClave2026', 'password_confirmation' => 'NuevaClave2026'])
            ->assertOk();
        $agente = $this->agente->fresh();
        $this->assertTrue(Hash::check('NuevaClave2026', $agente->password));
        $this->assertSame(0, (int) $agente->intentos_fallidos);
        $this->assertNull($agente->bloqueado_hasta);

        // Un agente de otra inmobiliaria no se puede tocar
        $otra = $this->usuario('inmobiliaria');
        $ajeno = $this->usuario('agente', ['inmobiliaria_id' => $otra->id]);
        $this->postJson("/api/v1/inmobiliaria/agentes/{$ajeno->id}/clave", ['password' => 'NuevaClave2026', 'password_confirmation' => 'NuevaClave2026'])
            ->assertNotFound();
        $this->assertTrue(Hash::check('Umbral2026*', $ajeno->fresh()->password));
    }
}
