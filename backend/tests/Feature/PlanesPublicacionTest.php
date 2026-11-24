<?php

namespace Tests\Feature;

use App\Models\Membresia;
use App\Models\Pago;
use App\Models\PlanPublicacion;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Planes nuevos de publicación (B1 a B5b): comprar, vencer, ordenar en el portal y filtrar. */
class PlanesPublicacionTest extends TestCase
{
    use RefreshDatabase;

    private User $vendedor;

    private User $otro;

    protected function setUp(): void
    {
        parent::setUp();

        // Sin captcha y sin llaves de Wompi: el pago queda en modo simulado (se aprueba de una vez)
        config([
            'services.turnstile.site_key' => null, 'services.turnstile.secret_key' => null,
            'services.wompi.public_key' => null, 'services.wompi.integrity_secret' => null, 'services.wompi.events_secret' => null,
        ]);

        $dep = DB::table('departamentos')->insertGetId(['codigo_dane' => '73', 'nombre' => 'Tolima', 'activo' => true]);
        DB::table('municipios')->insert(['departamento_id' => $dep, 'codigo_dane' => '73001', 'nombre' => 'Ibagué', 'activo' => true]);

        $this->vendedor = $this->usuario('vendedor', ['publicaciones_gratis' => 5]);
        $this->otro = $this->usuario('vendedor');
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

    private function datos(array $extra = []): array
    {
        return array_merge([
            'tipo' => 'apartamento', 'operacion' => 'venta', 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cra 4 # 12-30', 'lat' => 4.438, 'lng' => -75.205,
            'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 90, 'estrato' => 4,
        ], $extra);
    }

    /** Crea un inmueble del vendedor por la API. */
    private function crear(array $extra = []): int
    {
        return (int) $this->actingAs($this->vendedor)->postJson('/api/v1/vendedor/propiedades', $this->datos($extra))
            ->assertCreated()->json('data.id');
    }

    private function plan(string $tipo, int $dias): PlanPublicacion
    {
        return PlanPublicacion::where('tipo', $tipo)->where('dias', $dias)->firstOrFail();
    }

    private function idsPublicos(array $query = []): array
    {
        return collect($this->getJson('/api/v1/public/propiedades?' . http_build_query($query))->assertOk()->json('data'))
            ->pluck('id')->all();
    }

    private function medalla(int $propiedadId): void
    {
        Membresia::create([
            'user_id' => $this->vendedor->id, 'propiedad_id' => $propiedadId, 'plan' => 'mensual', 'precio' => 59900,
            'estado' => 'activa', 'fecha_inicio' => now('America/Bogota')->toDateString(), 'fecha_fin' => now('America/Bogota')->addMonth()->toDateString(),
        ]);
    }

    /* ---------------- B1 / B3: planes y compra ---------------- */

    public function test_la_lista_de_planes_trae_los_dos_tipos_con_su_precio(): void
    {
        $inmo = $this->usuario('inmobiliaria');

        foreach ([$this->vendedor, $inmo] as $quien) {
            $ruta = $quien->is($inmo) ? 'inmobiliaria' : 'vendedor';
            $this->actingAs($quien)->getJson("/api/v1/{$ruta}/planes-publicacion")
                ->assertOk()
                ->assertJsonCount(3, 'normal')
                ->assertJsonCount(3, 'posicionamiento')
                ->assertJsonStructure(['normal' => [['id', 'tipo', 'dias', 'precio']], 'posicionamiento' => [['id', 'tipo', 'dias', 'precio']]]);
        }
    }

    public function test_publicar_normal_en_modo_simulado_publica_y_guarda_la_fecha_de_fin(): void
    {
        $id = $this->crear(['estado' => 'borrador']);
        DB::table('propiedades')->where('id', $id)->update(['en_espera_pago' => true]);
        $plan = $this->plan('normal', 7);

        $this->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", ['plan_id' => $plan->id])
            ->assertCreated()->assertJsonPath('checkout_url', null);

        $p = Propiedad::findOrFail($id);
        $this->assertSame('publicada', $p->estado);
        $this->assertFalse((bool) $p->en_espera_pago);
        $this->assertTrue(Carbon::parse($p->publicada_hasta)->between(now()->addDays(6)->addHours(23), now()->addDays(7)->addMinute()));
        $this->assertContains($id, $this->idsPublicos());
        $this->assertSame('aprobado', Pago::where('propiedad_id', $id)->value('estado'));
    }

    public function test_publicar_normal_solo_sirve_para_borradores_o_para_renovar(): void
    {
        $id = $this->crear();
        $this->patchJson("/api/v1/vendedor/propiedades/{$id}/estado", ['estado' => 'pausada'])->assertOk();

        $this->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", ['plan_id' => $this->plan('normal', 7)->id])
            ->assertStatus(422)->assertJsonValidationErrors('plan_id');
    }

    public function test_renovar_una_publicacion_normal_suma_los_dias(): void
    {
        $id = $this->crear(['estado' => 'borrador']);
        $plan = $this->plan('normal', 7);

        $this->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", ['plan_id' => $plan->id])->assertCreated();
        $this->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", ['plan_id' => $plan->id])->assertCreated();

        $hasta = Carbon::parse(Propiedad::findOrFail($id)->publicada_hasta);
        $this->assertTrue($hasta->between(now()->addDays(13)->addHours(23), now()->addDays(14)->addMinute()));
    }

    public function test_un_plan_desactivado_o_de_otro_tipo_no_se_puede_comprar(): void
    {
        $id = $this->crear(['estado' => 'borrador']);
        $normal = $this->plan('normal', 7);

        PlanPublicacion::whereKey($normal->id)->update(['activo' => false]);
        $this->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", ['plan_id' => $normal->id])
            ->assertStatus(422)->assertJsonPath('errors.plan_id.0', 'Ese plan ya no está disponible.');

        // Un plan de posicionamiento no sirve para publicar
        $this->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", ['plan_id' => $this->plan('posicionamiento', 7)->id])
            ->assertStatus(422)->assertJsonPath('errors.plan_id.0', 'Ese plan ya no está disponible.');

        // Sin plan
        $this->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", [])
            ->assertStatus(422)->assertJsonPath('errors.plan_id.0', 'Elige un plan.');
    }

    public function test_posicionar_una_publicada_guarda_la_fecha_y_los_dias_se_suman(): void
    {
        $id = $this->crear();
        $plan = $this->plan('posicionamiento', 7);

        $this->postJson("/api/v1/vendedor/propiedades/{$id}/posicionar", ['plan_id' => $plan->id])
            ->assertCreated()->assertJsonPath('checkout_url', null);
        $this->postJson("/api/v1/vendedor/propiedades/{$id}/posicionar", ['plan_id' => $plan->id])->assertCreated();

        $hasta = Carbon::parse(Propiedad::findOrFail($id)->posicionada_hasta);
        $this->assertTrue($hasta->between(now()->addDays(13)->addHours(23), now()->addDays(14)->addMinute()));
    }

    public function test_no_se_posiciona_un_borrador_ni_una_propiedad_con_oro_plata_o_bronce(): void
    {
        $borrador = $this->crear(['estado' => 'borrador']);
        $this->postJson("/api/v1/vendedor/propiedades/{$borrador}/posicionar", ['plan_id' => $this->plan('posicionamiento', 7)->id])
            ->assertStatus(422)->assertJsonPath('errors.plan_id.0', 'Solo se puede posicionar una propiedad publicada.');

        $conMedalla = $this->crear(['direccion' => 'Cl 9 # 3-10']);
        $this->medalla($conMedalla);
        $this->postJson("/api/v1/vendedor/propiedades/{$conMedalla}/posicionar", ['plan_id' => $this->plan('posicionamiento', 7)->id])
            ->assertStatus(422)->assertJsonPath('errors.plan_id.0', 'Esta propiedad ya está posicionada con Oro, Plata o Bronce.');
    }

    public function test_nadie_compra_planes_para_la_propiedad_de_otro(): void
    {
        $id = $this->crear(['estado' => 'borrador']);

        $this->actingAs($this->otro)
            ->postJson("/api/v1/vendedor/propiedades/{$id}/publicar-normal", ['plan_id' => $this->plan('normal', 7)->id])
            ->assertNotFound();
        $this->postJson("/api/v1/vendedor/propiedades/{$id}/posicionar", ['plan_id' => $this->plan('posicionamiento', 7)->id])
            ->assertNotFound();
    }

    /* ---------------- B5b: fechas en los listados de los paneles ---------------- */

    public function test_el_listado_del_vendedor_trae_las_fechas_y_si_esta_posicionada(): void
    {
        $id = $this->crear();
        DB::table('propiedades')->where('id', $id)->update(['publicada_hasta' => now()->addDays(5), 'posicionada_hasta' => now()->addDays(3)]);

        $this->getJson('/api/v1/vendedor/propiedades')->assertOk()
            ->assertJsonPath('data.0.pos', true)
            ->assertJsonStructure(['data' => [['publicada_hasta', 'posicionada_hasta', 'pos']]]);

        DB::table('propiedades')->where('id', $id)->update(['posicionada_hasta' => now()->subDay()]);
        $this->getJson('/api/v1/vendedor/propiedades')->assertJsonPath('data.0.pos', false);
    }

    public function test_el_listado_de_la_inmobiliaria_trae_las_fechas_y_si_esta_posicionada(): void
    {
        $inmo = $this->usuario('inmobiliaria', ['publicaciones_gratis' => 5]);
        $casa = Propiedad::create([
            'user_id' => $inmo->id, 'tipo' => 'casa', 'operacion' => 'venta', 'precio' => 100000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén', 'direccion' => 'Cl 1',
            'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 120, 'estado' => 'publicada',
        ]);
        DB::table('propiedades')->where('id', $casa->id)->update(['posicionada_hasta' => now()->addDays(2)]);

        $this->actingAs($inmo)->getJson('/api/v1/inmobiliaria/propiedades')->assertOk()
            ->assertJsonPath('data.0.pos', true)
            ->assertJsonStructure(['data' => [['publicada_hasta', 'posicionada_hasta', 'pos']]]);
    }

    /* ---------------- B4: vencimiento automático ---------------- */

    public function test_al_vencer_la_publicacion_normal_vuelve_a_borrador_en_espera_de_pago(): void
    {
        $id = $this->crear();
        DB::table('propiedades')->where('id', $id)->update(['publicada_hasta' => now()->subHour(), 'posicionada_hasta' => now()->addDays(2)]);

        $this->artisan('propiedades:vencer-planes')->assertSuccessful();

        $p = Propiedad::findOrFail($id);
        $this->assertSame('borrador', $p->estado);
        $this->assertTrue((bool) $p->en_espera_pago);
        $this->assertNull($p->publicada_hasta);
        $this->assertNull($p->posicionada_hasta);
        $this->assertNotContains($id, $this->idsPublicos());
    }

    public function test_al_vencer_el_posicionamiento_la_propiedad_sigue_publicada(): void
    {
        $id = $this->crear();
        DB::table('propiedades')->where('id', $id)->update(['posicionada_hasta' => now()->subMinute()]);

        $this->artisan('propiedades:vencer-planes')->assertSuccessful();

        $p = Propiedad::findOrFail($id);
        $this->assertSame('publicada', $p->estado);
        $this->assertNull($p->posicionada_hasta);
        $this->assertContains($id, $this->idsPublicos());
    }

    public function test_con_oro_plata_o_bronce_vigente_no_vuelve_a_borrador(): void
    {
        $id = $this->crear();
        $this->medalla($id);
        DB::table('propiedades')->where('id', $id)->update(['publicada_hasta' => now()->subHour()]);

        $this->artisan('propiedades:vencer-planes')->assertSuccessful();

        $p = Propiedad::findOrFail($id);
        $this->assertSame('publicada', $p->estado);
        $this->assertNull($p->publicada_hasta);
    }

    public function test_solo_ver_no_cambia_nada(): void
    {
        $id = $this->crear();
        DB::table('propiedades')->where('id', $id)->update(['publicada_hasta' => now()->subHour()]);

        $this->artisan('propiedades:vencer-planes', ['--solo-ver' => true])->assertSuccessful();

        $this->assertSame('publicada', Propiedad::findOrFail($id)->estado);
    }

    /* ---------------- B5: orden y filtros en la API pública ---------------- */

    public function test_el_portal_ordena_medalla_luego_posicionadas_luego_normales_por_fecha(): void
    {
        $conMedalla = $this->crear(['direccion' => 'Cl 1 # 1-1']);
        $posicionada = $this->crear(['direccion' => 'Cl 2 # 2-2']);
        $normalVieja = $this->crear(['direccion' => 'Cl 3 # 3-3']);
        $normalNueva = $this->crear(['direccion' => 'Cl 4 # 4-4']);

        $this->medalla($conMedalla);
        DB::table('propiedades')->where('id', $posicionada)->update(['posicionada_hasta' => now()->addDays(5)]);

        $orden = array_values(array_intersect($this->idsPublicos(), [$conMedalla, $posicionada, $normalVieja, $normalNueva]));

        $this->assertSame([$conMedalla, $posicionada, $normalNueva, $normalVieja], $orden);
    }

    public function test_una_posicionada_vencida_vuelve_a_su_lugar_por_fecha(): void
    {
        $vieja = $this->crear(['direccion' => 'Cl 5 # 5-5']);
        $nueva = $this->crear(['direccion' => 'Cl 6 # 6-6']);
        DB::table('propiedades')->where('id', $vieja)->update(['posicionada_hasta' => now()->subDay()]);

        $orden = array_values(array_intersect($this->idsPublicos(), [$vieja, $nueva]));

        $this->assertSame([$nueva, $vieja], $orden);
    }

    public function test_filtros_de_metros_cuadrados_banos_y_estrato(): void
    {
        $grande = $this->crear(['direccion' => 'Cl 7 # 7-7', 'area' => 120, 'banos' => 3, 'estrato' => 5]);
        $chica = $this->crear(['direccion' => 'Cl 8 # 8-8', 'area' => 55, 'banos' => 1, 'estrato' => 2]);

        $this->assertContains($grande, $this->idsPublicos(['area_min' => 100]));
        $this->assertNotContains($chica, $this->idsPublicos(['area_min' => 100]));

        $this->assertContains($grande, $this->idsPublicos(['banos_min' => 2]));
        $this->assertNotContains($chica, $this->idsPublicos(['banos_min' => 2]));

        $this->assertContains($chica, $this->idsPublicos(['estrato' => 2]));
        $this->assertNotContains($grande, $this->idsPublicos(['estrato' => 2]));

        // Combinados
        $this->assertSame([$grande], array_values(array_intersect($this->idsPublicos(['area_min' => 100, 'banos_min' => 3, 'estrato' => 5]), [$grande, $chica])));
    }
}