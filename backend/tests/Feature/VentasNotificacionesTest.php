<?php

namespace Tests\Feature;

use App\Models\Comision;
use App\Models\Lead;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Paginación de listados, reporte de ventas (PDF), historial de pagos y campana de notificaciones. */
class VentasNotificacionesTest extends TestCase
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
            'name' => 'Inmo Tolima', 'email' => 'inmo' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rolInmo->id, 'estado' => 'activo', 'telefono' => '3000000000', 'numero_documento' => '900123',
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

    /** Una venta con agente, un arriendo sin agente y una venta reabierta. */
    private function cierres(): array
    {
        $venta = $this->propiedad();
        $arriendo = $this->propiedad(['operacion' => 'arriendo', 'precio' => 2000000, 'agente_id' => null]);
        $reabierta = $this->propiedad();
        $this->actingAs($this->inmo);
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$venta->id}/estado", ['estado' => 'vendida'])->assertOk();
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$arriendo->id}/estado", ['estado' => 'arrendada'])->assertOk();
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$reabierta->id}/estado", ['estado' => 'vendida'])->assertOk();
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$reabierta->id}/estado", ['estado' => 'publicada'])->assertOk();

        return [$venta, $arriendo, $reabierta];
    }

    /* ---------------- Paginación ---------------- */

    public function test_listados_paginados_y_sin_pagina_devuelve_todo(): void
    {
        for ($i = 0; $i < 15; $i++) {
            $this->propiedad();
        }
        $casa = Propiedad::first();
        for ($i = 0; $i < 14; $i++) {
            Lead::create(['propiedad_id' => $casa->id, 'nombre' => "C$i", 'contacto' => '3', 'agente_id' => $this->agente->id, 'estado' => 'nuevo']);
        }
        for ($i = 1; $i <= 13; $i++) {
            Visita::create(['propiedad_id' => $casa->id, 'agente_id' => $this->agente->id, 'nombre' => "V$i", 'contacto' => '3', 'fecha' => now()->addDays($i), 'estado' => 'pendiente']);
        }
        $this->actingAs($this->inmo);

        // Sin ?pagina responde como antes (lo usa el panel del vendedor)
        $this->getJson('/api/v1/inmobiliaria/propiedades')->assertOk()->assertJsonCount(15, 'data')->assertJsonMissingPath('meta');

        $this->getJson('/api/v1/inmobiliaria/propiedades?pagina=2&por_pagina=12')->assertOk()
            ->assertJsonCount(3, 'data')->assertJsonPath('meta.total', 15)->assertJsonPath('meta.paginas', 2)
            ->assertJsonStructure(['planes', 'caracteristicas']);
        $this->getJson('/api/v1/inmobiliaria/contactos?pagina=1')->assertOk()
            ->assertJsonCount(12, 'data')->assertJsonPath('meta.total', 14)->assertJsonStructure(['totales']);
        $this->getJson('/api/v1/inmobiliaria/visitas?pagina=2')->assertOk()->assertJsonCount(1, 'data');

        $this->actingAs($this->agente);
        $this->getJson('/api/v1/agente/propiedades?pagina=1')->assertOk()->assertJsonCount(12, 'data')->assertJsonPath('meta.total', 15);
        $this->getJson('/api/v1/agente/contactos?pagina=2')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/agente/visitas?pagina=1')->assertOk()->assertJsonCount(12, 'data');
    }

    /* ---------------- Reporte de ventas ---------------- */

    public function test_reporte_de_ventas_con_totales_y_filtros(): void
    {
        [$venta, , $reabierta] = $this->cierres();

        $this->assertNotNull($venta->fresh()->cerrada_en);
        $this->assertNull($reabierta->fresh()->cerrada_en);

        $this->getJson('/api/v1/inmobiliaria/ventas')->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('totales.ventas', 1)->assertJsonPath('totales.total_ventas', 100000000)
            ->assertJsonPath('totales.arriendos', 1)->assertJsonPath('totales.total_arriendos', 2000000)
            ->assertJsonPath('totales.comisiones', 4000000)
            ->assertJsonPath('empresa.nombre', 'Inmo Tolima')->assertJsonPath('empresa.nit', '900123')
            ->assertJsonCount(1, 'agentes');

        $this->getJson('/api/v1/inmobiliaria/ventas?operacion=arriendo')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/inmobiliaria/ventas?agente_id=' . $this->agente->id)->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.comision.valor', 4000000);
        $this->getJson('/api/v1/inmobiliaria/ventas?agente_id=sin')->assertJsonCount(1, 'data');
        $manana = now('America/Bogota')->addDay()->toDateString();
        $this->getJson('/api/v1/inmobiliaria/ventas?desde=' . $manana)->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/inmobiliaria/ventas?desde=2026-12-10&hasta=2026-12-01')->assertStatus(422);
        $this->getJson('/api/v1/inmobiliaria/ventas?pagina=1&por_pagina=1')->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 2);
    }

    public function test_agente_ve_sus_ventas_y_otra_inmobiliaria_no_ve_nada(): void
    {
        $this->cierres();

        $this->actingAs($this->agente)->getJson('/api/v1/agente/ventas')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('totales.comisiones', 4000000)
            ->assertJsonPath('empresa.nombre', 'Inmo Tolima');

        $otra = User::forceCreate([
            'name' => 'Otra', 'email' => 'otra' . uniqid() . '@umbral.test', 'password' => 'x',
            'role_id' => $this->inmo->role_id, 'estado' => 'activo',
        ]);
        $this->actingAs($otra)->getJson('/api/v1/inmobiliaria/ventas')->assertOk()->assertJsonCount(0, 'data');
    }

    /* ---------------- Historial de pagos ---------------- */

    public function test_historial_de_pagos_con_filtros(): void
    {
        $casa = $this->propiedad();
        $this->actingAs($this->inmo);
        $this->postJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/destacar", ['plan' => 'mensual'])->assertSuccessful();
        $this->postJson("/api/v1/inmobiliaria/propiedades/{$casa->id}/destacar", ['plan' => 'semanal'])->assertSuccessful();
        Pago::create([
            'referencia' => 'X-R', 'concepto' => 'membresia', 'user_id' => $this->inmo->id, 'plan' => 'semanal',
            'monto_centavos' => 1990000, 'moneda' => 'COP', 'estado' => 'rechazado', 'proveedor' => 'wompi',
        ]);
        $aprobado = (int) (Pago::where('user_id', $this->inmo->id)->where('estado', 'aprobado')->sum('monto_centavos') / 100);

        $this->getJson('/api/v1/inmobiliaria/membresia/pagos')->assertOk()
            ->assertJsonCount(3, 'data')->assertJsonPath('total_aprobado', $aprobado);
        $this->getJson('/api/v1/inmobiliaria/membresia/pagos?estado=rechazado')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/inmobiliaria/membresia/pagos?propiedad_id=' . $casa->id)->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.publicacion', 'Casa en Belén, Ibagué');
        $this->getJson('/api/v1/inmobiliaria/membresia/pagos?desde=' . now('America/Bogota')->addDay()->toDateString())
            ->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/inmobiliaria/membresia/pagos?pagina=1&por_pagina=2')
            ->assertJsonCount(2, 'data')->assertJsonPath('meta.paginas', 2);
    }

    /* ---------------- Notificaciones ---------------- */

    public function test_campana_de_la_inmobiliaria_y_marcar_leidas(): void
    {
        $this->cierres();
        $casa = Propiedad::first();
        Lead::create(['propiedad_id' => $casa->id, 'nombre' => 'Ana', 'contacto' => '3', 'estado' => 'nuevo']);
        Visita::create(['propiedad_id' => $casa->id, 'nombre' => 'Beto', 'contacto' => '3', 'fecha' => now()->addDays(3), 'estado' => 'confirmada']);
        Pago::create([
            'referencia' => 'X-R', 'concepto' => 'membresia', 'user_id' => $this->inmo->id, 'plan' => 'semanal',
            'monto_centavos' => 1990000, 'moneda' => 'COP', 'estado' => 'rechazado', 'proveedor' => 'wompi',
        ]);

        $r = $this->actingAs($this->inmo)->getJson('/api/v1/inmobiliaria/notificaciones')->assertOk();
        $titulos = collect($r->json('data'))->pluck('titulo')->implode(' | ');
        $this->assertGreaterThan(0, $r->json('sin_leer'));
        foreach (['Nuevo contacto', 'Visita confirmada', 'Pago rechazado', 'Venta cerrada'] as $tipo) {
            $this->assertStringContainsString($tipo, $titulos);
        }

        $this->postJson('/api/v1/inmobiliaria/notificaciones/leidas')->assertOk();
        $this->getJson('/api/v1/inmobiliaria/notificaciones')->assertJsonPath('sin_leer', 0);
    }

    public function test_campana_del_agente_avisa_comisiones(): void
    {
        $this->cierres();
        DB::table('comisiones')->where('estado', 'pendiente')->update(['estado' => 'pagada', 'pagada_en' => now()]);

        $r = $this->actingAs($this->agente)->getJson('/api/v1/agente/notificaciones')->assertOk();
        $titulos = collect($r->json('data'))->pluck('titulo')->implode(' | ');
        $this->assertStringContainsString('Ganaste una comisión', $titulos);
        $this->assertStringContainsString('Te pagaron', $titulos);

        $this->postJson('/api/v1/agente/notificaciones/leidas')->assertOk();
        $this->getJson('/api/v1/agente/notificaciones')->assertJsonPath('sin_leer', 0);
        $this->assertSame(1, Comision::where('estado', 'pagada')->count());
    }
}
