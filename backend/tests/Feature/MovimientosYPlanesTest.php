<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Movimiento;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Movimientos (quién hizo qué), historial por contacto y que reanudar una propiedad
 * con plan vigente no la mande otra vez a "En espera de pago".
 */
class MovimientosYPlanesTest extends TestCase
{
    use RefreshDatabase;

    private User $inmo;

    private User $agente;

    private User $otraInmo;

    private User $otroAgente;

    protected function setUp(): void
    {
        parent::setUp();

        $rolInmo = Role::firstOrCreate(['nombre' => 'inmobiliaria'], ['descripcion' => 'inmobiliaria']);
        $rolAgente = Role::firstOrCreate(['nombre' => 'agente'], ['descripcion' => 'agente']);

        $this->inmo = $this->usuario('Inmo Uno', $rolInmo);
        $this->agente = $this->usuario('Laura Agente', $rolAgente, $this->inmo->id);
        $this->otraInmo = $this->usuario('Inmo Dos', $rolInmo);
        $this->otroAgente = $this->usuario('Pedro Agente', $rolAgente, $this->otraInmo->id);
    }

    private function usuario(string $nombre, Role $rol, ?int $inmobiliariaId = null): User
    {
        return User::forceCreate([
            'name' => $nombre, 'email' => strtolower(preg_replace('/\W/', '', $nombre)) . uniqid() . '@umbral.test',
            'password' => 'Umbral2026*', 'role_id' => $rol->id, 'estado' => 'activo', 'telefono' => '3000000000',
            'inmobiliaria_id' => $inmobiliariaId,
        ]);
    }

    private function propiedad(User $duenio, array $extra = []): Propiedad
    {
        return Propiedad::create(array_merge([
            'user_id' => $duenio->id, 'tipo' => 'casa', 'operacion' => 'venta',
            'precio' => 100000000, 'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cl ' . uniqid(), 'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2,
            'parqueaderos' => 1, 'area' => 120, 'estado' => 'publicada',
        ], $extra));
    }

    private function lead(Propiedad $casa, ?User $agente = null): Lead
    {
        return Lead::create(['propiedad_id' => $casa->id, 'nombre' => 'Ana', 'contacto' => '3', 'agente_id' => $agente?->id, 'estado' => 'nuevo']);
    }

    private function mov(User $quien, string $titulo, array $extra = []): void
    {
        Movimiento::registrar($quien, 'editar_contactos', 'PATCH /prueba (200)', $extra + [
            'entidad' => 'contacto', 'entidad_id' => 1, 'titulo' => $titulo, 'resultado' => 'correcto', 'codigo' => 200,
        ]);
    }

    /* ---------------- Se anota lo que se hace ---------------- */

    public function test_pausar_una_propiedad_queda_anotado_con_un_titulo_claro(): void
    {
        $casa = $this->propiedad($this->inmo);

        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/estado", ['estado' => 'pausada'])->assertOk();

        $m = Movimiento::sole();
        $this->assertSame("Pausó la propiedad #{$casa->id}", $m->titulo);
        $this->assertSame('propiedad', $m->entidad);
        $this->assertSame($casa->id, (int) $m->entidad_id);
        $this->assertSame('correcto', $m->resultado);
        $this->assertSame(200, (int) $m->codigo);
        $this->assertSame('inmobiliaria', $m->rol);
        $this->assertSame($this->inmo->id, (int) $m->inmobiliaria_id);
    }

    public function test_lecturas_y_avisos_no_se_anotan(): void
    {
        $this->actingAs($this->inmo);

        $this->getJson('/api/v1/inmobiliaria/propiedades')->assertOk();
        $this->getJson('/api/v1/inmobiliaria/notificaciones')->assertOk();
        $this->postJson('/api/v1/inmobiliaria/notificaciones/leidas')->assertOk();

        $this->assertSame(0, Movimiento::count());
    }

    /* ---------------- Movimientos de los agentes ---------------- */

    public function test_la_inmobiliaria_ve_solo_los_movimientos_de_sus_agentes(): void
    {
        $this->mov($this->agente, 'Editó el contacto #1');
        $this->mov($this->agente, 'Error al editar el contacto #2 (500)', ['resultado' => 'error', 'codigo' => 500]);
        $this->mov($this->otroAgente, 'Editó el contacto #9');
        $this->mov($this->inmo, 'Editó la propiedad #3');   // de la inmobiliaria, no de un agente

        $r = $this->actingAs($this->inmo)->getJson('/api/v1/inmobiliaria/agentes/movimientos')->assertOk()
            ->assertJsonCount(2, 'data')->assertJsonPath('resumen.total', 2)->assertJsonPath('resumen.errores', 1)
            ->assertJsonPath('meta.total', 2);

        // Se ve quién y qué, pero nunca la IP ni el dispositivo
        $this->assertSame('Laura Agente', $r->json('data.0.quien.nombre'));
        $this->assertArrayNotHasKey('ip', $r->json('data.0'));
        $this->assertArrayNotHasKey('dispositivo', $r->json('data.0'));

        $this->getJson('/api/v1/inmobiliaria/agentes/movimientos?resultado=error')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.codigo', 500);
        $this->getJson('/api/v1/inmobiliaria/agentes/movimientos?agente_id=' . $this->agente->id)->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/inmobiliaria/agentes/movimientos?pagina=1&por_pagina=1')->assertJsonCount(1, 'data')->assertJsonPath('meta.paginas', 2);
        $this->getJson('/api/v1/inmobiliaria/agentes/movimientos?desde=' . now('America/Bogota')->addDay()->toDateString())->assertJsonCount(0, 'data');
    }

    public function test_no_se_pueden_ver_los_movimientos_de_un_agente_de_otra_inmobiliaria(): void
    {
        $this->actingAs($this->inmo)
            ->getJson('/api/v1/inmobiliaria/agentes/movimientos?agente_id=' . $this->otroAgente->id)->assertNotFound();
        $this->getJson('/api/v1/inmobiliaria/agentes/movimientos?resultado=otro')->assertStatus(422);
    }

    /* ---------------- Historial de un contacto ---------------- */

    public function test_historial_de_un_contacto_para_la_inmobiliaria_y_el_agente(): void
    {
        $casa = $this->propiedad($this->inmo);
        $suyo = $this->lead($casa, $this->agente);
        $otroLead = $this->lead($casa, $this->agente);
        $ajeno = $this->lead($this->propiedad($this->otraInmo), $this->otroAgente);

        $this->mov($this->agente, 'Editó el contacto #' . $suyo->id, ['entidad_id' => $suyo->id]);
        $this->mov($this->inmo, 'Editó el contacto #' . $suyo->id, ['entidad_id' => $suyo->id]);
        $this->mov($this->agente, 'Editó el contacto #' . $otroLead->id, ['entidad_id' => $otroLead->id]);

        $this->actingAs($this->inmo)->getJson("/api/v1/inmobiliaria/contactos/{$suyo->id}/movimientos")->assertOk()
            ->assertJsonCount(2, 'data');
        $this->getJson("/api/v1/inmobiliaria/contactos/{$ajeno->id}/movimientos")->assertNotFound();

        $this->actingAs($this->agente)->getJson("/api/v1/agente/contactos/{$suyo->id}/movimientos")->assertOk()
            ->assertJsonCount(2, 'data');
        $this->getJson("/api/v1/agente/contactos/{$ajeno->id}/movimientos")->assertNotFound();
    }

    public function test_un_agente_no_ve_el_historial_de_un_contacto_que_no_tiene_a_su_cargo(): void
    {
        $casa = $this->propiedad($this->inmo);
        $sinAgente = $this->lead($casa);

        $this->actingAs($this->agente)->getJson("/api/v1/agente/contactos/{$sinAgente->id}/movimientos")->assertNotFound();
    }

    /* ---------------- Reanudar con plan vigente ---------------- */

    public function test_reanudar_con_plan_vigente_no_pide_pagar_otra_vez(): void
    {
        $this->propiedad($this->inmo);   // ocupa la única publicación gratis
        $conPlan = $this->propiedad($this->inmo, ['estado' => 'pausada', 'publicada_hasta' => now()->addDays(5)]);

        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$conPlan->id}/estado", ['estado' => 'publicada'])
            ->assertOk()->assertJsonPath('estado', 'publicada')->assertJsonPath('en_espera_pago', false);
    }

    public function test_reanudar_sin_plan_y_sin_publicaciones_gratis_queda_en_espera_de_pago(): void
    {
        $this->propiedad($this->inmo);   // ocupa la única publicación gratis
        $sinPlan = $this->propiedad($this->inmo, ['estado' => 'pausada']);

        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$sinPlan->id}/estado", ['estado' => 'publicada'])
            ->assertOk()->assertJsonPath('estado', 'borrador')->assertJsonPath('en_espera_pago', true);
    }

    public function test_un_plan_ya_vencido_no_cuenta_como_vigente(): void
    {
        $this->propiedad($this->inmo);
        $vencida = $this->propiedad($this->inmo, ['estado' => 'pausada', 'publicada_hasta' => now()->subDay()]);

        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$vencida->id}/estado", ['estado' => 'publicada'])
            ->assertOk()->assertJsonPath('en_espera_pago', true);
    }
}
