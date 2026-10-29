<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Membresia;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Panel de la inmobiliaria: propiedades, agentes, contactos, visitas, membresía y perfil.
 * Las fotos de prueba se crean con create(..., 'image/jpeg') y no con image(): así no se
 * necesita la extensión GD de PHP, que el contenedor de Docker no trae.
 */
class InmobiliariaGestionTest extends TestCase
{
    use RefreshDatabase;

    private User $inmo;

    protected function setUp(): void
    {
        parent::setUp();
        // El captcha se prueba aparte (CaptchaComisionesPaqueteTest)
        config(['services.turnstile.site_key' => null, 'services.turnstile.secret_key' => null]);

        $dep = DB::table('departamentos')->insertGetId(['codigo_dane' => '73', 'nombre' => 'Tolima', 'activo' => true]);
        DB::table('municipios')->insert(['departamento_id' => $dep, 'codigo_dane' => '73001', 'nombre' => 'Ibagué', 'activo' => true]);

        Role::firstOrCreate(['nombre' => 'agente'], ['descripcion' => 'agente']);
        $this->inmo = $this->usuario('inmobiliaria');
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

    private function datosPropiedad(array $extra = []): array
    {
        return array_merge([
            'tipo' => 'apartamento', 'operacion' => 'venta', 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cra 4 # 12-30', 'lat' => 4.438, 'lng' => -75.205,
            'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 90, 'estrato' => 4,
        ], $extra);
    }

    private function propiedadDe(User $duenio, array $extra = []): Propiedad
    {
        return Propiedad::create(array_merge($this->datosPropiedad(['direccion' => 'Cl ' . uniqid()]), ['user_id' => $duenio->id, 'estado' => 'publicada'], $extra));
    }

    public function test_crea_edita_cambia_estado_y_elimina_una_propiedad(): void
    {
        Storage::fake('public');
        $agente = $this->usuario('agente', ['inmobiliaria_id' => $this->inmo->id]);

        $r = $this->actingAs($this->inmo)->post('/api/v1/inmobiliaria/propiedades',
            $this->datosPropiedad(['agente_id' => $agente->id, 'imagen' => UploadedFile::fake()->create('casa.jpg', 120, 'image/jpeg')]),
            ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.agente.id', $agente->id)
            ->assertJsonPath('data.estado', 'publicada');
        $id = $r->json('data.id');
        $this->assertStringStartsWith('/storage/propiedades/', $r->json('data.imagen'));

        $this->post("/api/v1/inmobiliaria/propiedades/{$id}", $this->datosPropiedad(['precio' => 400000000]), ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.precio', 400000000);

        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$id}/estado", ['estado' => 'arrendada'])->assertStatus(422);
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$id}/estado", ['estado' => 'vendida'])->assertOk();

        $this->deleteJson("/api/v1/inmobiliaria/propiedades/{$id}")->assertOk();
        $this->assertDatabaseMissing('propiedades', ['id' => $id]);
    }

    public function test_ficha_completa_y_galeria_llegan_al_portal_del_invitado(): void
    {
        Storage::fake('public');

        $r = $this->actingAs($this->inmo)->post('/api/v1/inmobiliaria/propiedades', $this->datosPropiedad([
            'imagen' => UploadedFile::fake()->create('principal.jpg', 120, 'image/jpeg'),
            'descripcion' => '  Apartamento con vista a la montaña.  ',
            'pisos' => 1,
            'antiguedad' => 5,
            'caracteristicas' => ['piscina', 'ascensor', 'piscina'],
        ]), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.descripcion', 'Apartamento con vista a la montaña.')
            ->assertJsonPath('data.caracteristicas', ['ascensor', 'piscina']); // sin repetir y en orden del catálogo
        $id = $r->json('data.id');

        // Galería: de a una foto, con tope
        $foto = $this->post("/api/v1/inmobiliaria/propiedades/{$id}/fotos", ['foto' => UploadedFile::fake()->create('sala.jpg', 120, 'image/jpeg')], ['Accept' => 'application/json'])
            ->assertCreated()->json('data');
        $this->post("/api/v1/inmobiliaria/propiedades/{$id}/fotos", ['foto' => UploadedFile::fake()->create('cocina.jpg', 120, 'image/jpeg')], ['Accept' => 'application/json'])
            ->assertCreated();
        $this->post("/api/v1/inmobiliaria/propiedades/{$id}/fotos", ['foto' => UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertStatus(422);

        // El invitado recibe la ficha completa y todas las fotos (principal primero)
        $publica = $this->getJson("/api/v1/public/propiedades/{$id}")->assertOk()
            ->assertJsonPath('data.desc', 'Apartamento con vista a la montaña.')
            ->assertJsonPath('data.floors', 1)
            ->assertJsonPath('data.age', 5)
            ->assertJsonPath('data.features.0.label', 'Ascensor')
            ->assertJsonPath('data.seller.phone', $this->inmo->telefono)
            ->assertJsonCount(3, 'data.photos');
        $this->assertSame($publica->json('data.img'), $publica->json('data.photos.0'));

        // Quitar una foto borra el archivo; al editar se pueden vaciar los campos opcionales
        $this->deleteJson("/api/v1/inmobiliaria/propiedades/{$id}/fotos/{$foto['id']}")->assertOk();
        Storage::disk('public')->assertMissing(str_replace('/storage/', '', $foto['url']));
        $this->post("/api/v1/inmobiliaria/propiedades/{$id}", $this->datosPropiedad(['caracteristicas' => '', 'pisos' => '']), ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.caracteristicas', [])->assertJsonPath('data.pisos', null)
            ->assertJsonPath('data.descripcion', 'Apartamento con vista a la montaña.') // lo que no se envía no se toca
            ->assertJsonCount(1, 'data.fotos');

        // Las fotos de otra inmobiliaria no se pueden tocar
        $otra = $this->usuario('inmobiliaria');
        $this->actingAs($otra)->deleteJson("/api/v1/inmobiliaria/propiedades/{$id}/fotos/{$foto['id']}")->assertNotFound();
    }

    public function test_rechaza_ubicacion_fuera_de_colombia_y_municipio_invalido(): void
    {
        $this->actingAs($this->inmo)
            ->postJson('/api/v1/inmobiliaria/propiedades', $this->datosPropiedad(['lat' => 40.4, 'lng' => -3.7]))
            ->assertStatus(422)->assertJsonValidationErrors(['lat', 'lng']);

        $this->postJson('/api/v1/inmobiliaria/propiedades', $this->datosPropiedad(['ciudad' => 'Medellín']))
            ->assertStatus(422)->assertJsonValidationErrors(['ciudad']);
    }

    public function test_no_puede_tocar_propiedades_ni_usar_agentes_de_otra_inmobiliaria(): void
    {
        $otra = $this->usuario('inmobiliaria');
        $ajena = $this->propiedadDe($otra);
        $agenteAjeno = $this->usuario('agente', ['inmobiliaria_id' => $otra->id]);
        $propia = $this->propiedadDe($this->inmo);

        $this->actingAs($this->inmo)->deleteJson("/api/v1/inmobiliaria/propiedades/{$ajena->id}")->assertNotFound();
        $this->patchJson("/api/v1/inmobiliaria/propiedades/{$propia->id}/agente", ['agente_id' => $agenteAjeno->id])
            ->assertStatus(422);
        $this->getJson('/api/v1/inmobiliaria/propiedades')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_agentes_alta_edicion_y_desactivacion_libera_propiedades(): void
    {
        $r = $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/agentes', [
            'name' => 'Laura Castillo', 'email' => 'laura@umbral.test', 'telefono' => '3001112233',
            'tipo_documento' => 'CC', 'numero_documento' => '1100220033',
            'password' => 'Clave12345', 'password_confirmation' => 'Clave12345',
        ])->assertCreated();
        $agente = User::find($r->json('data.id'));
        $this->assertSame($this->inmo->id, $agente->inmobiliaria_id);
        $this->assertTrue($agente->tieneRol('agente'));
        $this->assertTrue(Hash::check('Clave12345', $agente->password));

        $prop = $this->propiedadDe($this->inmo, ['agente_id' => $agente->id]);

        $this->putJson("/api/v1/inmobiliaria/agentes/{$agente->id}", ['name' => 'Laura C.', 'telefono' => '3009998877'])->assertOk();
        $this->patchJson("/api/v1/inmobiliaria/agentes/{$agente->id}/estado", ['estado' => 'inactivo'])->assertOk();

        $this->assertNull($prop->fresh()->agente_id);
        $this->getJson('/api/v1/inmobiliaria/agentes')->assertOk()->assertJsonPath('data.0.estado', 'inactivo');
    }

    public function test_contactos_se_asignan_y_visita_desde_contacto(): void
    {
        $agente = $this->usuario('agente', ['inmobiliaria_id' => $this->inmo->id]);
        $prop = $this->propiedadDe($this->inmo);
        $lead = Lead::create(['propiedad_id' => $prop->id, 'nombre' => 'Camila', 'contacto' => '3104567890']);

        $this->actingAs($this->inmo)->patchJson("/api/v1/inmobiliaria/contactos/{$lead->id}", ['agente_id' => $agente->id])
            ->assertOk()->assertJsonPath('data.agente.id', $agente->id);

        $fecha = now('America/Bogota')->addDays(2)->setTime(10, 0)->format('Y-m-d\TH:i');
        $v = $this->postJson('/api/v1/inmobiliaria/visitas', ['propiedad_id' => $prop->id, 'lead_id' => $lead->id, 'fecha' => $fecha])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Camila')
            ->assertJsonPath('data.agente.id', $agente->id)
            ->assertJsonPath('data.fecha_local', $fecha);

        $this->assertSame('en_seguimiento', $lead->fresh()->estado);

        $this->postJson('/api/v1/inmobiliaria/visitas', ['propiedad_id' => $prop->id, 'nombre' => 'X', 'contacto' => '1', 'fecha' => '2020-01-01T10:00'])
            ->assertStatus(422);

        $this->patchJson('/api/v1/inmobiliaria/visitas/' . $v->json('data.id'), ['estado' => 'confirmada'])
            ->assertOk()->assertJsonPath('data.estado', 'confirmada');
        $this->getJson('/api/v1/inmobiliaria/contactos?estado=en_seguimiento')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/inmobiliaria/visitas')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_membresia_renovar_extiende_la_vigencia(): void
    {
        $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/membresia', ['plan' => 'semanal'])->assertCreated();
        $this->postJson('/api/v1/inmobiliaria/membresia', ['plan' => 'semanal'])->assertCreated();

        $fechas = Membresia::where('user_id', $this->inmo->id)->orderBy('id')->get();
        $this->assertSame($fechas[0]->fecha_fin->toDateString(), $fechas[1]->fecha_inicio->toDateString());

        $this->getJson('/api/v1/inmobiliaria/membresia')->assertOk()
            ->assertJsonCount(2, 'historial')
            ->assertJsonCount(3, 'planes')
            ->assertJsonPath('vigente.dias_restantes', 14); // dos semanas seguidas
    }

    public function test_perfil_y_cambio_de_clave(): void
    {
        $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/perfil', [
            'name' => 'Inmobiliaria Tolima S.A.S.', 'representante_legal' => 'Carolina Méndez', 'telefono' => '6082770000',
        ])->assertOk()->assertJsonPath('data.nombre', 'Inmobiliaria Tolima S.A.S.');

        $this->postJson('/api/v1/inmobiliaria/perfil/clave', ['actual' => 'mala', 'password' => 'NuevaClave1', 'password_confirmation' => 'NuevaClave1'])
            ->assertStatus(422);
        $this->postJson('/api/v1/inmobiliaria/perfil/clave', ['actual' => 'Umbral2026*', 'password' => 'NuevaClave1', 'password_confirmation' => 'NuevaClave1'])
            ->assertOk();
        $this->assertTrue(Hash::check('NuevaClave1', $this->inmo->fresh()->password));
    }
}
