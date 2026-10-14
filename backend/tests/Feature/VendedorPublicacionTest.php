<?php

namespace Tests\Feature;

use App\Models\Membresia;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Panel del vendedor: lo que publica debe verse (o no) en la búsqueda pública del invitado. */
class VendedorPublicacionTest extends TestCase
{
    use RefreshDatabase;

    private User $vendedor;

    protected function setUp(): void
    {
        parent::setUp();

        $dep = DB::table('departamentos')->insertGetId(['codigo_dane' => '73', 'nombre' => 'Tolima', 'activo' => true]);
        DB::table('municipios')->insert(['departamento_id' => $dep, 'codigo_dane' => '73001', 'nombre' => 'Ibagué', 'activo' => true]);

        $this->vendedor = $this->usuario('vendedor');
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

    private function conMembresia(User $u): void
    {
        Membresia::create([
            'user_id' => $u->id, 'plan' => 'mensual', 'precio' => 59900, 'estado' => 'activa',
            'fecha_inicio' => now()->toDateString(), 'fecha_fin' => now()->addMonth()->toDateString(),
        ]);
    }

    private function datosPropiedad(array $extra = []): array
    {
        return array_merge([
            'tipo' => 'apartamento', 'operacion' => 'venta', 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cra 4 # 12-30', 'lat' => 4.438, 'lng' => -75.205,
            'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 90, 'estrato' => 4,
        ], $extra);
    }

    private function idsPublicos(array $query = []): array
    {
        return collect($this->getJson('/api/v1/public/propiedades?' . http_build_query($query))->assertOk()->json('data'))
            ->pluck('id')->all();
    }

    public function test_con_membresia_lo_publicado_aparece_en_la_busqueda_del_invitado(): void
    {
        Storage::fake('public');
        $this->conMembresia($this->vendedor);

        $venta = $this->actingAs($this->vendedor)
            ->post('/api/v1/vendedor/propiedades', $this->datosPropiedad(['imagen' => UploadedFile::fake()->image('casa.jpg')]), ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.estado', 'publicada');
        $arriendo = $this->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad(['operacion' => 'arriendo', 'precio' => 2500000]))
            ->assertCreated();

        // El invitado (sin sesión) los encuentra, y también filtrando por operación
        auth()->logout();
        $this->assertContains($venta->json('data.id'), $this->idsPublicos());
        $this->assertContains($arriendo->json('data.id'), $this->idsPublicos());
        $this->assertSame([$venta->json('data.id')], $this->idsPublicos(['operacion' => 'venta']));
        $this->assertSame([$arriendo->json('data.id')], $this->idsPublicos(['operacion' => 'arriendo']));
    }

    public function test_sin_membresia_se_guarda_como_borrador_y_el_invitado_no_lo_ve(): void
    {
        $r = $this->actingAs($this->vendedor)
            ->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad(['estado' => 'publicada']))
            ->assertCreated()->assertJsonPath('data.estado', 'borrador');

        auth()->logout();
        $this->assertNotContains($r->json('data.id'), $this->idsPublicos());
    }

    public function test_publicar_exige_membresia_y_pausar_o_cerrar_lo_oculta_del_invitado(): void
    {
        $r = $this->actingAs($this->vendedor)->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad())->assertCreated();
        $id = $r->json('data.id');

        // Sin membresía no puede publicar
        $this->patchJson("/api/v1/vendedor/propiedades/{$id}/estado", ['estado' => 'publicada'])
            ->assertStatus(422)->assertJsonValidationErrors(['estado']);

        // Contrata y publica → aparece
        $this->conMembresia($this->vendedor);
        $this->patchJson("/api/v1/vendedor/propiedades/{$id}/estado", ['estado' => 'publicada'])->assertOk();
        $this->assertContains($id, $this->idsPublicos());

        // Pausa → desaparece; reanuda → vuelve; vendida → desaparece
        $this->patchJson("/api/v1/vendedor/propiedades/{$id}/estado", ['estado' => 'pausada'])->assertOk();
        $this->assertNotContains($id, $this->idsPublicos());
        $this->patchJson("/api/v1/vendedor/propiedades/{$id}/estado", ['estado' => 'publicada'])->assertOk();
        $this->assertContains($id, $this->idsPublicos());
        $this->patchJson("/api/v1/vendedor/propiedades/{$id}/estado", ['estado' => 'vendida'])->assertOk();
        $this->assertNotContains($id, $this->idsPublicos());
    }

    public function test_membresia_vencida_cuenta_como_sin_membresia(): void
    {
        Membresia::create([
            'user_id' => $this->vendedor->id, 'plan' => 'semanal', 'precio' => 19900, 'estado' => 'activa',
            'fecha_inicio' => now()->subDays(20)->toDateString(), 'fecha_fin' => now()->subDays(13)->toDateString(),
        ]);

        $this->actingAs($this->vendedor)->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad())
            ->assertCreated()->assertJsonPath('data.estado', 'borrador');
    }

    public function test_eliminar_el_inmueble_lo_quita_de_la_busqueda(): void
    {
        $this->conMembresia($this->vendedor);
        $id = $this->actingAs($this->vendedor)->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad())->json('data.id');
        $this->assertContains($id, $this->idsPublicos());

        $this->deleteJson("/api/v1/vendedor/propiedades/{$id}")->assertOk();
        $this->assertNotContains($id, $this->idsPublicos());
    }

    public function test_validaciones_de_colombia_y_municipio(): void
    {
        $this->actingAs($this->vendedor)
            ->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad(['lat' => 40.4, 'lng' => -3.7]))
            ->assertStatus(422)->assertJsonValidationErrors(['lat', 'lng']);

        $this->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad(['ciudad' => 'Medellín']))
            ->assertStatus(422)->assertJsonValidationErrors(['ciudad']);
    }

    public function test_cada_vendedor_ve_y_toca_solo_lo_suyo(): void
    {
        $otro = $this->usuario('vendedor');
        $this->conMembresia($otro);
        $ajena = Propiedad::create(array_merge($this->datosPropiedad(), ['user_id' => $otro->id, 'estado' => 'publicada']));

        $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/propiedades')->assertOk()->assertJsonCount(0, 'data');
        $this->deleteJson("/api/v1/vendedor/propiedades/{$ajena->id}")->assertNotFound();
        $this->patchJson("/api/v1/vendedor/propiedades/{$ajena->id}/estado", ['estado' => 'pausada'])->assertNotFound();
        $this->assertSame('publicada', $ajena->fresh()->estado);
    }

    public function test_acceso_solo_para_vendedores_con_sesion(): void
    {
        $this->getJson('/api/v1/vendedor/propiedades')->assertStatus(401);

        $inmo = $this->usuario('inmobiliaria');
        $this->actingAs($inmo)->getJson('/api/v1/vendedor/propiedades')->assertStatus(403);

        $pendiente = $this->usuario('vendedor', ['estado' => 'pendiente']);
        $this->actingAs($pendiente)->getJson('/api/v1/vendedor/propiedades')->assertStatus(403);
    }

    public function test_inicio_de_sesion_del_vendedor(): void
    {
        $this->postJson('/api/v1/vendedor/sesion', ['email' => $this->vendedor->email, 'password' => 'mala'])->assertStatus(401);

        $this->postJson('/api/v1/vendedor/sesion', ['email' => $this->vendedor->email, 'password' => 'Umbral2026*'])
            ->assertOk()->assertJsonPath('usuario.rol', 'vendedor');
        $this->getJson('/api/v1/vendedor/yo')->assertOk()->assertJsonPath('usuario.id', $this->vendedor->id);

        // Una inmobiliaria no entra por la puerta del vendedor
        $this->postJson('/api/v1/vendedor/salir')->assertOk();
        $inmo = $this->usuario('inmobiliaria');
        $this->postJson('/api/v1/vendedor/sesion', ['email' => $inmo->email, 'password' => 'Umbral2026*'])->assertStatus(403);
    }

    public function test_membresia_contactos_y_visitas_del_vendedor(): void
    {
        $this->actingAs($this->vendedor)->postJson('/api/v1/vendedor/membresia', ['plan' => 'quincenal'])
            ->assertCreated()->assertJsonPath('data.plan', 'quincenal');
        $this->getJson('/api/v1/vendedor/membresia')->assertOk()->assertJsonPath('vigente.plan', 'quincenal');

        $id = $this->postJson('/api/v1/vendedor/propiedades', $this->datosPropiedad())->assertJsonPath('data.estado', 'publicada')->json('data.id');

        // Un invitado deja su contacto y el vendedor lo ve en su panel
        auth()->logout();
        $this->postJson('/api/v1/public/leads', ['propiedad_id' => $id, 'nombre' => 'Camila', 'contacto' => '3104567890'])->assertCreated();

        $lead = $this->actingAs($this->vendedor)->getJson('/api/v1/vendedor/contactos')
            ->assertOk()->assertJsonCount(1, 'data')->json('data.0');
        $this->patchJson("/api/v1/vendedor/contactos/{$lead['id']}", ['estado' => 'en_seguimiento'])->assertOk();

        $this->postJson('/api/v1/vendedor/visitas', [
            'propiedad_id' => $id, 'lead_id' => $lead['id'], 'fecha' => now('America/Bogota')->addDays(3)->format('Y-m-d\TH:i'),
        ])->assertCreated();
        $this->getJson('/api/v1/vendedor/visitas')->assertOk()->assertJsonCount(1, 'data');
    }
}
