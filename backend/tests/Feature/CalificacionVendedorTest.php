<?php

namespace Tests\Feature;

use App\Models\CalificacionVendedor;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Calificaciones y comentarios que un invitado deja a un vendedor o inmobiliaria. */
class CalificacionVendedorTest extends TestCase
{
    use RefreshDatabase;

    private User $vendedor;
    private Propiedad $propiedad;

    protected function setUp(): void
    {
        parent::setUp();
        $rol = Role::firstOrCreate(['nombre' => 'vendedor'], ['descripcion' => 'vendedor']);
        $this->vendedor = User::forceCreate([
            'name' => 'Vendedor Reseñas', 'email' => 'resenas' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => 'activo', 'telefono' => '3000000000',
        ]);
        $this->propiedad = $this->propiedad($this->vendedor);
    }

    private function propiedad(User $dueno, string $estado = 'publicada'): Propiedad
    {
        return Propiedad::create([
            'user_id' => $dueno->id, 'tipo' => 'casa', 'operacion' => 'venta', 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén', 'direccion' => 'Cra 1 # ' . uniqid(),
            'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 120,
            'estado' => $estado,
        ]);
    }

    private function url(?int $id = null): string
    {
        return '/api/v1/public/vendedores/' . ($id ?? $this->vendedor->id) . '/calificaciones';
    }

    private function datos(array $extra = []): array
    {
        return array_merge([
            'nombre' => 'Laura', 'estrellas' => 5, 'comentario' => 'Muy atento y puntual',
            'propiedad_id' => $this->propiedad->id, 'huella' => 'dispositivo-aaaaaaaaaaaa',
        ], $extra);
    }

    public function test_sin_resenas_el_promedio_es_cero(): void
    {
        $this->getJson($this->url())->assertOk()
            ->assertJsonPath('promedio', 0)->assertJsonPath('total', 0)
            ->assertJsonPath('distribucion.5', 0)->assertJsonCount(0, 'data');
    }

    public function test_un_invitado_puede_calificar_y_comentar(): void
    {
        $this->postJson($this->url(), $this->datos())->assertCreated()
            ->assertJsonPath('ok', true)->assertJsonPath('promedio', 5)->assertJsonPath('total', 1);

        $this->getJson($this->url())->assertOk()
            ->assertJsonPath('data.0.nombre', 'Laura')
            ->assertJsonPath('data.0.comentario', 'Muy atento y puntual')
            ->assertJsonMissingPath('data.0.huella');
    }

    public function test_el_mismo_dispositivo_actualiza_su_resena_en_vez_de_duplicarla(): void
    {
        $this->postJson($this->url(), $this->datos(['estrellas' => 2]))->assertCreated();
        $this->postJson($this->url(), $this->datos(['estrellas' => 4, 'comentario' => 'Mejoró']))
            ->assertOk()->assertJsonPath('actualizada', true)->assertJsonPath('total', 1)->assertJsonPath('promedio', 4);

        $this->assertSame(1, CalificacionVendedor::count());
    }

    public function test_el_promedio_y_la_distribucion_se_calculan_con_varios_dispositivos(): void
    {
        $this->postJson($this->url(), $this->datos(['estrellas' => 5, 'huella' => 'dispositivo-1111111111']))->assertCreated();
        $this->postJson($this->url(), $this->datos(['estrellas' => 4, 'huella' => 'dispositivo-2222222222']))->assertCreated();
        $this->postJson($this->url(), $this->datos(['estrellas' => 2, 'huella' => 'dispositivo-3333333333']))->assertCreated();

        $this->getJson($this->url())->assertOk()
            ->assertJsonPath('total', 3)->assertJsonPath('promedio', 3.7)
            ->assertJsonPath('distribucion.5', 1)->assertJsonPath('distribucion.4', 1)
            ->assertJsonPath('distribucion.2', 1)->assertJsonPath('distribucion.3', 0);
    }

    public function test_el_visitante_reconoce_su_propia_resena(): void
    {
        $this->postJson($this->url(), $this->datos(['huella' => 'dispositivo-1111111111']))->assertCreated();
        $this->postJson($this->url(), $this->datos(['nombre' => 'Otro', 'huella' => 'dispositivo-2222222222']))->assertCreated();

        $res = $this->getJson($this->url() . '?huella=dispositivo-1111111111')->assertOk()->json('data');
        $this->assertEquals(['Laura' => true, 'Otro' => false], collect($res)->pluck('mia', 'nombre')->all());
    }

    public function test_valida_estrellas_nombre_y_longitud_del_comentario(): void
    {
        $this->postJson($this->url(), $this->datos(['estrellas' => 0]))->assertUnprocessable()->assertJsonValidationErrors('estrellas');
        $this->postJson($this->url(), $this->datos(['estrellas' => 6]))->assertUnprocessable()->assertJsonValidationErrors('estrellas');
        $this->postJson($this->url(), $this->datos(['nombre' => '']))->assertUnprocessable()->assertJsonValidationErrors('nombre');
        $this->postJson($this->url(), $this->datos(['comentario' => str_repeat('a', 601)]))->assertUnprocessable()->assertJsonValidationErrors('comentario');
        $this->postJson($this->url(), $this->datos(['huella' => 'corta']))->assertUnprocessable()->assertJsonValidationErrors('huella');
        $this->assertSame(0, CalificacionVendedor::count());
    }

    public function test_el_comentario_es_opcional_y_se_limpia_de_html(): void
    {
        $this->postJson($this->url(), $this->datos(['comentario' => '<script>alert(1)</script>Excelente   trato']))->assertCreated();
        $this->assertSame('alert(1)Excelente trato', CalificacionVendedor::first()->comentario);

        $this->postJson($this->url(), $this->datos(['comentario' => null, 'huella' => 'dispositivo-2222222222']))->assertCreated();
        $this->assertNull(CalificacionVendedor::latest('id')->first()->comentario);
    }

    public function test_no_se_puede_calificar_a_quien_no_tiene_propiedades_publicadas(): void
    {
        $rol = Role::firstOrCreate(['nombre' => 'vendedor'], ['descripcion' => 'vendedor']);
        $sin = User::forceCreate([
            'name' => 'Sin publicar', 'email' => 'sin' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => 'activo',
        ]);
        $this->propiedad($sin, 'borrador');

        $this->postJson($this->url($sin->id), $this->datos())->assertNotFound();
        $this->getJson($this->url(999999))->assertNotFound();
    }

    public function test_la_propiedad_indicada_debe_ser_del_vendedor(): void
    {
        $rol = Role::firstOrCreate(['nombre' => 'vendedor'], ['descripcion' => 'vendedor']);
        $otro = User::forceCreate([
            'name' => 'Otro dueño', 'email' => 'otro' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => 'activo',
        ]);
        $ajena = $this->propiedad($otro);

        $this->postJson($this->url(), $this->datos(['propiedad_id' => $ajena->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('propiedad_id');
    }

    public function test_el_listado_publico_de_propiedades_trae_el_promedio_del_vendedor(): void
    {
        $this->postJson($this->url(), $this->datos(['estrellas' => 5, 'huella' => 'dispositivo-1111111111']))->assertCreated();
        $this->postJson($this->url(), $this->datos(['estrellas' => 4, 'huella' => 'dispositivo-2222222222']))->assertCreated();

        $this->getJson('/api/v1/public/propiedades')->assertOk()
            ->assertJsonPath('data.0.seller.rating', 4.5)->assertJsonPath('data.0.seller.reviews', 2);
        $this->getJson('/api/v1/public/propiedades/' . $this->propiedad->id)->assertOk()
            ->assertJsonPath('data.seller.rating', 4.5)->assertJsonPath('data.seller.reviews', 2);
    }

    public function test_un_vendedor_sin_resenas_aparece_con_cero(): void
    {
        $this->getJson('/api/v1/public/propiedades')->assertOk()
            ->assertJsonPath('data.0.seller.rating', 0)->assertJsonPath('data.0.seller.reviews', 0);
    }
}
