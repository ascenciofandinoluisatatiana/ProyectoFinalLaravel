<?php

namespace Tests\Feature;

use App\Models\Comision;
use App\Models\Lead;
use App\Models\Notificacion;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use App\Services\Paneles\AvisosGuardados;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Avisos guardados (tabla "notificaciones") de la inmobiliaria y del agente:
 * qué avisos se crean, a quién le llegan, que no se repiten y que quien hace la acción no recibe el suyo.
 */
class AvisosGuardadosTest extends TestCase
{
    use RefreshDatabase;

    private User $inmo;

    private User $agente;

    protected function setUp(): void
    {
        parent::setUp();

        $rolInmo = Role::firstOrCreate(['nombre' => 'inmobiliaria'], ['descripcion' => 'inmobiliaria']);
        $rolAgente = Role::firstOrCreate(['nombre' => 'agente'], ['descripcion' => 'agente']);
        $this->inmo = User::forceCreate([
            'name' => 'Inmo Avisos', 'email' => 'inmo' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
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
            'precio' => 100000000, 'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cl ' . uniqid(), 'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2,
            'parqueaderos' => 1, 'area' => 120, 'estado' => 'publicada',
        ], $extra));
    }

    /** Títulos de los avisos de una persona, en una sola línea de texto. */
    private function titulos(User $u, ?string $tipo = null): string
    {
        return Notificacion::where('user_id', $u->id)
            ->when($tipo, fn ($q) => $q->where('tipo', $tipo))
            ->orderBy('id')->pluck('titulo')->implode(' | ');
    }

    /* ---------------- Contactos ---------------- */

    public function test_contacto_nuevo_avisa_a_la_inmobiliaria_y_al_agente_a_cargo(): void
    {
        $casa = $this->propiedad();
        Lead::create(['propiedad_id' => $casa->id, 'nombre' => 'Ana', 'contacto' => '3001112233', 'agente_id' => $this->agente->id, 'estado' => 'nuevo']);

        $this->assertStringContainsString('Nuevo contacto: Ana', $this->titulos($this->inmo));
        $this->assertStringContainsString('Contacto asignado: Ana', $this->titulos($this->agente));
        // El aviso dice de qué propiedad se trata
        $this->assertSame('Casa en Belén, Ibagué', Notificacion::where('user_id', $this->inmo->id)->value('mensaje'));
    }

    public function test_contacto_sin_agente_solo_avisa_a_la_inmobiliaria(): void
    {
        $casa = $this->propiedad(['agente_id' => null]);
        Lead::create(['propiedad_id' => $casa->id, 'nombre' => 'Ana', 'contacto' => '3001112233', 'estado' => 'nuevo']);

        $this->assertSame(1, Notificacion::where('user_id', $this->inmo->id)->count());
        $this->assertSame(0, Notificacion::where('user_id', $this->agente->id)->count());
    }

    public function test_un_aviso_repetido_no_se_duplica(): void
    {
        $casa = $this->propiedad();
        $lead = Lead::create(['propiedad_id' => $casa->id, 'nombre' => 'Ana', 'contacto' => '3', 'agente_id' => $this->agente->id, 'estado' => 'nuevo']);
        $antes = Notificacion::count();

        AvisosGuardados::contactoNuevo($lead);
        AvisosGuardados::contactoAsignado($lead);

        $this->assertSame($antes, Notificacion::count());
    }

    public function test_pasar_un_contacto_a_otro_agente_le_avisa_al_nuevo(): void
    {
        $casa = $this->propiedad(['agente_id' => null]);
        $lead = Lead::create(['propiedad_id' => $casa->id, 'nombre' => 'Beto', 'contacto' => '3', 'estado' => 'nuevo']);
        $this->assertSame(0, Notificacion::where('user_id', $this->agente->id)->count());

        $lead->update(['agente_id' => $this->agente->id]);

        $this->assertStringContainsString('Contacto asignado: Beto', $this->titulos($this->agente));
    }

    /* ---------------- Propiedades ---------------- */

    public function test_cambio_de_estado_le_avisa_al_agente_que_estado_fue(): void
    {
        $casa = $this->propiedad();

        $casa->update(['estado' => 'pausada']);
        $casa->update(['estado' => 'publicada']);
        $casa->update(['estado' => 'vendida']);

        $titulos = $this->titulos($this->agente, 'propiedad');
        $this->assertStringContainsString('La propiedad fue pausada', $titulos);
        $this->assertStringContainsString('La propiedad fue publicada', $titulos);
        $this->assertStringContainsString('La propiedad fue marcada como vendida', $titulos);
    }

    public function test_quien_hace_el_cambio_no_recibe_su_propio_aviso(): void
    {
        $casa = $this->propiedad();

        $this->actingAs($this->agente);
        $casa->update(['estado' => 'pausada']);

        $this->assertSame(0, Notificacion::where('user_id', $this->agente->id)->where('tipo', 'propiedad')->count());
    }

    public function test_propiedad_sin_agente_no_genera_avisos_de_estado(): void
    {
        $casa = $this->propiedad(['agente_id' => null]);

        $casa->update(['estado' => 'pausada']);

        $this->assertSame(0, Notificacion::where('tipo', 'propiedad')->count());
    }

    public function test_asignar_una_propiedad_le_avisa_al_agente(): void
    {
        $casa = $this->propiedad(['agente_id' => null]);

        $casa->update(['agente_id' => $this->agente->id]);

        $this->assertStringContainsString('Se te asignó una propiedad', $this->titulos($this->agente, 'propiedad'));
    }

    /* ---------------- Visitas ---------------- */

    public function test_visita_nueva_confirmada_y_cancelada(): void
    {
        $casa = $this->propiedad();
        $visita = Visita::create(['propiedad_id' => $casa->id, 'agente_id' => $this->agente->id, 'nombre' => 'Beto', 'contacto' => '3', 'fecha' => now()->addDays(2), 'estado' => 'pendiente']);

        $this->assertStringContainsString('Nueva visita: Beto', $this->titulos($this->inmo, 'visita'));
        $this->assertStringContainsString('Visita asignada: Beto', $this->titulos($this->agente, 'visita'));

        $visita->update(['estado' => 'confirmada']);
        $this->assertStringContainsString('Visita confirmada: Beto', $this->titulos($this->inmo, 'visita'));
        $this->assertStringContainsString('Visita confirmada: Beto', $this->titulos($this->agente, 'visita'));

        $visita->update(['estado' => 'cancelada']);
        $this->assertStringContainsString('Visita cancelada: Beto', $this->titulos($this->agente, 'visita'));
    }

    /* ---------------- Comisiones ---------------- */

    public function test_comision_ganada_y_pagada(): void
    {
        $casa = $this->propiedad();
        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/estado", ['estado' => 'vendida'])->assertOk();

        $this->assertStringContainsString('Venta cerrada', $this->titulos($this->inmo, 'cierre'));
        $this->assertStringContainsString('Ganaste una comisión', $this->titulos($this->agente, 'comision'));

        Comision::sole()->update(['estado' => 'pagada', 'pagada_en' => now()]);
        $this->assertStringContainsString('Te pagaron la comisión', $this->titulos($this->agente, 'comision'));
    }

    /* ---------------- Pagos y planes ---------------- */

    private function pago(string $estado): Pago
    {
        return Pago::create([
            'referencia' => 'UMB-' . uniqid(), 'concepto' => 'membresia', 'user_id' => $this->inmo->id, 'plan' => 'semanal',
            'monto_centavos' => 1990000, 'moneda' => 'COP', 'estado' => $estado, 'proveedor' => 'wompi',
        ]);
    }

    public function test_resultado_de_un_pago(): void
    {
        AvisosGuardados::pagoResultado($this->pago('aprobado'));
        AvisosGuardados::pagoResultado($this->pago('rechazado'));
        AvisosGuardados::pagoResultado($this->pago('error'));
        AvisosGuardados::pagoResultado($this->pago('pendiente'));   // pendiente: no avisa

        $titulos = $this->titulos($this->inmo, 'pago');
        $this->assertStringContainsString('Pago aprobado', $titulos);
        $this->assertStringContainsString('Pago rechazado', $titulos);
        $this->assertStringContainsString('Pago no completado', $titulos);
        $this->assertSame(3, Notificacion::where('user_id', $this->inmo->id)->where('tipo', 'pago')->count());
    }

    public function test_plan_activado_dice_hasta_cuando(): void
    {
        $casa = $this->propiedad();

        AvisosGuardados::planActivado($casa, 'normal', now()->addDays(15));
        AvisosGuardados::planActivado($casa, 'posicionamiento', now()->addDays(7));

        $this->assertStringContainsString('Publicación activa', $this->titulos($this->inmo, 'plan'));
        $this->assertStringContainsString('Posicionamiento activo', $this->titulos($this->inmo, 'plan'));
        $this->assertStringContainsString(' · hasta el ' . now('America/Bogota')->addDays(15)->format('d/m/Y'), Notificacion::where('titulo', 'Publicación activa')->value('mensaje'));
    }

    public function test_plan_por_vencer_avisa_a_duenio_y_agente_y_no_se_repite(): void
    {
        $casa = $this->propiedad();
        $fin = now('America/Bogota')->addDays(3)->toDateString();

        $this->assertTrue(AvisosGuardados::planPorVencer($casa, 'normal', $fin, 3));
        $this->assertFalse(AvisosGuardados::planPorVencer($casa, 'normal', $fin, 3));   // mismo día: no repite

        $this->assertStringContainsString('Publicación por vencer: vence en 3 días', $this->titulos($this->inmo, 'vencimiento'));
        $this->assertStringContainsString('Publicación por vencer: vence en 3 días', $this->titulos($this->agente, 'vencimiento'));

        // "Solo ver" no guarda nada
        $antes = Notificacion::count();
        AvisosGuardados::planPorVencer($casa, 'posicionamiento', $fin, 1, true);
        $this->assertSame($antes, Notificacion::count());
    }

    public function test_al_vencer_el_plan_vuelve_a_borrador_y_el_agente_recibe_un_solo_aviso(): void
    {
        $casa = $this->propiedad();
        DB::table('propiedades')->where('id', $casa->id)->update(['publicada_hasta' => now()->subHour()]);

        $this->artisan('propiedades:vencer-planes')->assertSuccessful();

        $this->assertSame('borrador', $casa->fresh()->estado);
        $this->assertStringContainsString('La publicación venció', $this->titulos($this->inmo, 'plan'));
        $this->assertStringContainsString('La publicación venció', $this->titulos($this->agente, 'plan'));
        // No se duplica con el aviso de "pasó a borrador"
        $this->assertSame(0, Notificacion::where('user_id', $this->agente->id)->where('tipo', 'propiedad')->count());
    }

    /* ---------------- Campana ---------------- */

    public function test_cada_persona_ve_solo_sus_avisos(): void
    {
        $casa = $this->propiedad();
        Lead::create(['propiedad_id' => $casa->id, 'nombre' => 'Ana', 'contacto' => '3', 'agente_id' => $this->agente->id, 'estado' => 'nuevo']);

        $otra = User::forceCreate([
            'name' => 'Otra Inmo', 'email' => 'otra' . uniqid() . '@umbral.test', 'password' => 'x',
            'role_id' => $this->inmo->role_id, 'estado' => 'activo',
        ]);

        $this->actingAs($otra)->getJson('/api/v1/inmobiliaria/notificaciones')->assertOk()->assertJsonPath('sin_leer', 0);
        $this->actingAs($this->inmo)->getJson('/api/v1/inmobiliaria/notificaciones')->assertOk()->assertJsonPath('sin_leer', 1);
        $this->actingAs($this->agente)->getJson('/api/v1/agente/notificaciones')->assertOk()->assertJsonPath('sin_leer', 1);

        $this->postJson('/api/v1/agente/notificaciones/leidas')->assertOk();
        $this->getJson('/api/v1/agente/notificaciones')->assertJsonPath('sin_leer', 0);
        // Leer las del agente no toca las de la inmobiliaria
        $this->actingAs($this->inmo)->getJson('/api/v1/inmobiliaria/notificaciones')->assertJsonPath('sin_leer', 1);
    }
}
