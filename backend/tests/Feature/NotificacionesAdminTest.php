<?php

namespace Tests\Feature;

use App\Models\Movimiento;
use App\Models\Pago;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Notificaciones del administrador: la campana y "Ver todas" (registros, pagos y errores),
 * con sus filtros, el orden, las páginas y el contador de nuevas.
 *
 * Datos que se crean en cada prueba: 3 cuentas (administrador, inmobiliaria, agente) = 3 registros,
 * 2 pagos (1 aprobado y 1 rechazado; el pendiente no cuenta) y 1 error del sistema.
 */
class NotificacionesAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $inmo;

    private User $agente;

    protected function setUp(): void
    {
        parent::setUp();

        $rolAdmin = Role::firstOrCreate(['nombre' => 'administrador'], ['descripcion' => 'administrador']);
        $rolInmo = Role::firstOrCreate(['nombre' => 'inmobiliaria'], ['descripcion' => 'inmobiliaria']);
        $rolAgente = Role::firstOrCreate(['nombre' => 'agente'], ['descripcion' => 'agente']);

        $this->admin = $this->usuario('Admin Umbral', $rolAdmin);
        $this->inmo = $this->usuario('Inmo Tolima', $rolInmo);
        $this->agente = $this->usuario('Laura Agente', $rolAgente);

        $this->pago('aprobado');
        $this->pago('rechazado');
        $this->pago('pendiente');   // no es una notificación

        Movimiento::registrar($this->inmo, 'editar_propiedades', 'PATCH /prueba (500)', [
            'entidad' => 'propiedad', 'entidad_id' => 1, 'titulo' => 'Error al editar la propiedad #1 (500)', 'resultado' => 'error', 'codigo' => 500,
        ]);
        Movimiento::registrar($this->inmo, 'editar_propiedades', 'PATCH /prueba (200)', [
            'entidad' => 'propiedad', 'entidad_id' => 1, 'titulo' => 'Editó la propiedad #1', 'resultado' => 'correcto', 'codigo' => 200,
        ]);   // una acción normal no es notificación
    }

    private function usuario(string $nombre, Role $rol): User
    {
        return User::forceCreate([
            'name' => $nombre, 'email' => strtolower(preg_replace('/\W/', '', $nombre)) . uniqid() . '@umbral.test',
            'password' => 'Umbral2026*', 'role_id' => $rol->id, 'estado' => 'activo', 'telefono' => '3000000000',
        ]);
    }

    private function pago(string $estado): Pago
    {
        return Pago::create([
            'referencia' => 'UMB-' . uniqid(), 'concepto' => 'membresia', 'user_id' => $this->inmo->id, 'plan' => 'semanal',
            'monto_centavos' => 1990000, 'moneda' => 'COP', 'estado' => $estado, 'proveedor' => 'wompi',
        ]);
    }

    private function ver(string $consulta = ''): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->admin)->getJson('/api/v1/admin/notificaciones' . ($consulta ? '?' . $consulta : ''));
    }

    /* ---------------- Quién puede entrar ---------------- */

    public function test_sin_sesion_es_401_y_otro_rol_es_403(): void
    {
        $this->getJson('/api/v1/admin/notificaciones')->assertStatus(401);
        $this->postJson('/api/v1/admin/notificaciones/leidas')->assertStatus(401);

        $this->actingAs($this->inmo)->getJson('/api/v1/admin/notificaciones')->assertStatus(403);
        $this->actingAs($this->agente)->postJson('/api/v1/admin/notificaciones/leidas')->assertStatus(403);
    }

    /* ---------------- Tarjetas (resumen) ---------------- */

    public function test_el_resumen_cuenta_registros_pagos_y_errores(): void
    {
        $this->ver()->assertOk()
            ->assertJsonPath('resumen.registros', 3)
            ->assertJsonPath('resumen.pagos', 2)
            ->assertJsonPath('resumen.errores', 1)
            ->assertJsonPath('resumen.total', 6)
            ->assertJsonPath('meta.total', 6)
            ->assertJsonStructure(['data' => [['tipo', 'icono', 'color', 'titulo', 'detalle', 'fecha', 'hace', 'nueva']], 'meta', 'resumen']);
    }

    public function test_cada_tarjeta_filtra_por_su_tipo_y_el_resumen_no_cambia(): void
    {
        foreach (['registro' => 3, 'pago' => 2, 'error' => 1] as $tipo => $cuantos) {
            $r = $this->ver('tipo=' . $tipo)->assertOk()->assertJsonCount($cuantos, 'data')
                ->assertJsonPath('meta.total', $cuantos)->assertJsonPath('resumen.total', 6);
            foreach ($r->json('data') as $fila) {
                $this->assertSame($tipo, $fila['tipo']);
            }
        }
    }

    /* ---------------- Filtros de cada tipo ---------------- */

    public function test_filtro_por_rol_en_los_registros(): void
    {
        $this->ver('tipo=registro&rol=agente')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.titulo', 'Nuevo registro: Laura Agente');
        $this->ver('tipo=registro&rol=inmobiliaria')->assertJsonCount(1, 'data');
        $this->ver('tipo=registro&rol=vendedor')->assertJsonCount(0, 'data');
        // El rol solo aplica a los registros
        $this->ver('rol=agente')->assertJsonCount(1, 'data')->assertJsonPath('data.0.tipo', 'registro');
    }

    public function test_filtro_de_pagos_aprobados_y_no_completados(): void
    {
        $this->ver('tipo=pago&pago=aprobado')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.titulo', 'Pago aprobado: ' . \App\Models\Membresia::NOMBRES_PLAN['semanal']);
        $r = $this->ver('tipo=pago&pago=no_completado')->assertJsonCount(1, 'data');
        $this->assertStringStartsWith('Pago no completado', $r->json('data.0.titulo'));
    }

    public function test_el_error_muestra_que_paso(): void
    {
        $r = $this->ver('tipo=error')->assertJsonCount(1, 'data');
        $this->assertStringContainsString('Error al editar la propiedad #1 (500)', $r->json('data.0.titulo'));
        $this->assertStringContainsString('código 500', $r->json('data.0.detalle'));
    }

    /* ---------------- Fechas y orden ---------------- */

    public function test_filtro_por_rango_de_fechas(): void
    {
        // El pago aprobado fue hace 10 días; todo lo demás es de hoy
        DB::table('pagos')->where('estado', 'aprobado')->update(['updated_at' => now()->subDays(10)]);
        $hoy = now('America/Bogota')->toDateString();
        $haceDiez = now('America/Bogota')->subDays(10)->toDateString();
        $haceCinco = now('America/Bogota')->subDays(5)->toDateString();

        $this->ver('tipo=pago&desde=' . $hoy)->assertJsonCount(1, 'data');                       // solo el de hoy
        $this->ver('tipo=pago&hasta=' . $haceCinco)->assertJsonCount(1, 'data');                 // solo el viejo
        $this->ver('tipo=pago&desde=' . $haceDiez . '&hasta=' . $hoy)->assertJsonCount(2, 'data');
        $this->ver('desde=' . now('America/Bogota')->addDay()->toDateString())->assertJsonCount(0, 'data');
    }

    public function test_orden_antiguas_y_recientes(): void
    {
        DB::table('pagos')->where('estado', 'aprobado')->update(['updated_at' => now()->subDays(10)]);

        $recientes = $this->ver('tipo=pago&orden=recientes')->json('data');
        $antiguas = $this->ver('tipo=pago&orden=antiguas')->json('data');

        $this->assertStringStartsWith('Pago no completado', $recientes[0]['titulo']);
        $this->assertStringStartsWith('Pago aprobado', $antiguas[0]['titulo']);
    }

    public function test_paginas(): void
    {
        $this->ver('por_pagina=4')->assertJsonCount(4, 'data')->assertJsonPath('meta.paginas', 2)->assertJsonPath('meta.total', 6);
        $this->ver('por_pagina=4&pagina=2')->assertJsonCount(2, 'data')->assertJsonPath('meta.pagina', 2);
    }

    public function test_la_busqueda_por_texto(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('La búsqueda usa ILIKE (PostgreSQL); en SQLite no existe.');
        }

        $this->ver('q=laura')->assertJsonCount(1, 'data');
        $this->ver('q=pago')->assertJsonCount(2, 'data');
    }

    public function test_filtros_invalidos_dan_422(): void
    {
        $this->ver('tipo=otro')->assertStatus(422);
        $this->ver('desde=21-11-2026')->assertStatus(422);
        $this->ver('pago=quizas')->assertStatus(422);
        $this->ver('orden=al_azar')->assertStatus(422);
        $this->ver('rol=jefe')->assertStatus(422);
        $this->ver('por_pagina=500')->assertStatus(422);
    }

    /* ---------------- Contador de nuevas y campana ---------------- */

    public function test_marcar_leidas_deja_el_contador_en_cero_y_lo_nuevo_vuelve_a_contar(): void
    {
        $this->ver()->assertJsonPath('resumen.sin_leer', 6);
        $this->assertTrue($this->ver()->json('data.0.nueva'));

        $this->postJson('/api/v1/admin/notificaciones/leidas')->assertOk();
        $this->ver()->assertJsonPath('resumen.sin_leer', 0);
        $this->assertFalse($this->ver()->json('data.0.nueva'));

        $this->travel(2)->minutes();
        $this->pago('rechazado');

        $this->ver()->assertJsonPath('resumen.sin_leer', 1);
    }

    public function test_la_campana_del_menu_trae_las_ultimas_y_el_contador(): void
    {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/menu')->assertOk()
            ->assertJsonPath('sin_leer', 6)
            ->assertJsonCount(6, 'notificaciones');

        $this->postJson('/api/v1/admin/notificaciones/leidas')->assertOk();
        $this->getJson('/api/v1/admin/menu')->assertJsonPath('sin_leer', 0);
    }

    public function test_cada_administrador_lleva_su_propio_contador(): void
    {
        $otro = $this->usuario('Otro Admin', Role::where('nombre', 'administrador')->first());

        $this->actingAs($this->admin)->postJson('/api/v1/admin/notificaciones/leidas')->assertOk();

        $this->ver()->assertJsonPath('resumen.sin_leer', 0);
        $this->actingAs($otro)->getJson('/api/v1/admin/notificaciones')->assertOk()->assertJsonPath('resumen.sin_leer', 7);   // + su propio registro
    }
}
