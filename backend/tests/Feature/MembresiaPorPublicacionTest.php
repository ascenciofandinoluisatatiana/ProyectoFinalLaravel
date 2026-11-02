<?php

namespace Tests\Feature;

use App\Models\Membresia;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** Membresía por publicación: solo la propiedad pagada queda destacada. */
class MembresiaPorPublicacionTest extends TestCase
{
    use RefreshDatabase;

    private User $inmo;

    protected function setUp(): void
    {
        parent::setUp();
        $rol = Role::firstOrCreate(['nombre' => 'inmobiliaria'], ['descripcion' => 'inmobiliaria']);
        $this->inmo = User::forceCreate([
            'name' => 'Inmo Destacar', 'email' => 'destacar' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => 'activo', 'telefono' => '3000000000',
        ]);
    }

    private function propiedad(User $duenio, array $extra = []): Propiedad
    {
        return Propiedad::create(array_merge([
            'user_id' => $duenio->id, 'tipo' => 'apartamento', 'operacion' => 'venta', 'precio' => 300000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén', 'direccion' => 'Cl ' . uniqid(),
            'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 2, 'banos' => 1, 'parqueaderos' => 0, 'area' => 70,
            'estado' => 'publicada',
        ], $extra));
    }

    public function test_destacar_una_publicacion_no_destaca_las_demas(): void
    {
        $a = $this->propiedad($this->inmo);
        $b = $this->propiedad($this->inmo);

        $this->actingAs($this->inmo)->postJson("/api/v1/inmobiliaria/propiedades/{$a->id}/destacar", ['plan' => 'mensual'])
            ->assertCreated()
            ->assertJsonPath('destacado.plan', 'mensual');

        $this->assertSame($a->id, Membresia::sole()->propiedad_id);
        $this->assertSame($a->id, Pago::sole()->propiedad_id);

        $lista = collect($this->getJson('/api/v1/inmobiliaria/propiedades')->assertOk()->json('data'))->keyBy('id');
        $this->assertSame('mensual', $lista[$a->id]['destacado']['plan']);
        $this->assertNull($lista[$b->id]['destacado']);

        $this->getJson('/api/v1/inmobiliaria/membresia')->assertOk()
            ->assertJsonCount(1, 'destacadas')
            ->assertJsonPath('destacadas.0.id', $a->id)
            ->assertJsonPath('vigente', null);   // no hay membresía de toda la cuenta

        $this->getJson('/api/v1/inmobiliaria/resumen')->assertOk()->assertJsonPath('destacadas.total', 1);
    }

    public function test_renovar_una_publicacion_suma_dias_solo_a_ella(): void
    {
        $a = $this->propiedad($this->inmo);
        $b = $this->propiedad($this->inmo);
        $this->actingAs($this->inmo);

        $this->postJson("/api/v1/inmobiliaria/propiedades/{$a->id}/destacar", ['plan' => 'semanal'])->assertCreated();
        $this->postJson("/api/v1/inmobiliaria/propiedades/{$b->id}/destacar", ['plan' => 'semanal'])->assertCreated();
        $this->postJson("/api/v1/inmobiliaria/propiedades/{$a->id}/destacar", ['plan' => 'semanal'])->assertCreated();

        $deA = Membresia::where('propiedad_id', $a->id)->orderBy('id')->get();
        $this->assertSame($deA[0]->fecha_fin->toDateString(), $deA[1]->fecha_inicio->toDateString());
        // La de B empieza hoy: no se encadena con la de A
        $this->assertSame(now('America/Bogota')->toDateString(), Membresia::where('propiedad_id', $b->id)->sole()->fecha_inicio->toDateString());
    }

    public function test_cobra_el_precio_que_define_el_administrador(): void
    {
        DB::table('planes_membresia')->updateOrInsert(['plan' => 'mensual'], ['nombre' => 'Mensual', 'dias' => 30, 'precio' => 70000]);
        $a = $this->propiedad($this->inmo);

        $this->actingAs($this->inmo)->postJson("/api/v1/inmobiliaria/propiedades/{$a->id}/destacar", ['plan' => 'mensual'])->assertCreated();

        $this->assertSame(7000000, Pago::sole()->monto_centavos);
        $this->assertSame('70000.00', (string) Membresia::sole()->precio);
    }

    public function test_no_destaca_publicaciones_ajenas_ni_cerradas(): void
    {
        $otra = User::forceCreate([
            'name' => 'Otra', 'email' => 'otra' . uniqid() . '@umbral.test', 'password' => 'x',
            'role_id' => $this->inmo->role_id, 'estado' => 'activo',
        ]);
        $ajena = $this->propiedad($otra);
        $vendida = $this->propiedad($this->inmo, ['estado' => 'vendida']);

        $this->actingAs($this->inmo)->postJson("/api/v1/inmobiliaria/propiedades/{$ajena->id}/destacar", ['plan' => 'mensual'])->assertNotFound();
        $this->postJson("/api/v1/inmobiliaria/propiedades/{$vendida->id}/destacar", ['plan' => 'mensual'])->assertStatus(422);
        $this->postJson("/api/v1/inmobiliaria/propiedades/{$vendida->id}/destacar", ['plan' => 'anual'])->assertStatus(422);
        $this->assertSame(0, Pago::count());
    }

    public function test_con_wompi_se_destaca_solo_al_aprobar_y_vuelve_a_propiedades(): void
    {
        config(['services.wompi.public_key' => 'pub_test_abc', 'services.wompi.integrity_secret' => 'sec']);
        $a = $this->propiedad($this->inmo);

        $r = $this->actingAs($this->inmo)->postJson("/api/v1/inmobiliaria/propiedades/{$a->id}/destacar", ['plan' => 'quincenal'])->assertOk();
        $this->assertNotEmpty($r->json('checkout_url'));
        $this->assertSame(0, Membresia::count());

        $pago = Pago::sole();
        Http::fake(fn () => Http::response(['data' => [
            'id' => 'tx-9', 'reference' => $pago->referencia, 'status' => 'APPROVED',
            'amount_in_cents' => $pago->monto_centavos, 'payment_method_type' => 'PSE',
        ]]));

        $this->getJson('/api/v1/public/pagos/estado?id=tx-9')->assertOk()
            ->assertJsonPath('data.estado', 'aprobado')
            ->assertJsonPath('data.volver', '/inmobiliaria/propiedades.html');

        $this->assertSame($a->id, Membresia::sole()->propiedad_id);
    }
}
