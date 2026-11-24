<?php

namespace Tests\Feature;

use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Services\Publicaciones\LimiteGratisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Publicaciones gratis (servicio y cambio del administrador) y límites de intentos (error 429). */
class GratisYLimitesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.turnstile.site_key' => null, 'services.turnstile.secret_key' => null]);

        $dep = DB::table('departamentos')->insertGetId(['codigo_dane' => '73', 'nombre' => 'Tolima', 'activo' => true]);
        DB::table('municipios')->insert(['departamento_id' => $dep, 'codigo_dane' => '73001', 'nombre' => 'Ibagué', 'activo' => true]);
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

    private function propiedad(User $duenio, array $extra = []): Propiedad
    {
        return Propiedad::create(array_merge([
            'user_id' => $duenio->id, 'tipo' => 'casa', 'operacion' => 'venta',
            'precio' => 100000000, 'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén',
            'direccion' => 'Cl ' . uniqid(), 'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2,
            'parqueaderos' => 1, 'area' => 120, 'estado' => 'publicada',
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

    /* ---------------- LimiteGratisService ---------------- */

    public function test_con_una_gratis_la_segunda_publicacion_ya_no_cabe(): void
    {
        $u = $this->usuario('vendedor', ['publicaciones_gratis' => 1]);
        $servicio = new LimiteGratisService();

        $this->assertTrue($servicio->puedePublicar($u->id));

        $primera = $this->propiedad($u);
        $this->assertFalse($servicio->puedePublicar($u->id));
        // La propia propiedad que se está publicando no cuenta contra el límite
        $this->assertTrue($servicio->puedePublicar($u->id, $primera->id));
    }

    public function test_con_dos_gratis_caben_dos_y_las_pausadas_no_cuentan(): void
    {
        $u = $this->usuario('vendedor', ['publicaciones_gratis' => 2]);
        $servicio = new LimiteGratisService();

        $this->propiedad($u);
        $this->assertTrue($servicio->puedePublicar($u->id));
        $this->propiedad($u);
        $this->assertFalse($servicio->puedePublicar($u->id));

        $this->propiedad($u, ['estado' => 'pausada']);
        $this->propiedad($u, ['estado' => 'borrador']);
        $this->assertFalse($servicio->puedePublicar($u->id));   // siguen siendo 2 publicadas
    }

    public function test_cada_cuenta_cuenta_solo_sus_propias_publicaciones(): void
    {
        $a = $this->usuario('vendedor', ['publicaciones_gratis' => 1]);
        $b = $this->usuario('vendedor', ['publicaciones_gratis' => 1]);
        $this->propiedad($a);

        $this->assertTrue((new LimiteGratisService())->puedePublicar($b->id));
    }

    public function test_el_valor_para_cuentas_nuevas_se_guarda_y_se_mantiene_entre_0_y_5(): void
    {
        LimiteGratisService::fijarNuevas(3);
        $this->assertSame(3, LimiteGratisService::valorNuevas());

        DB::table('configuracion_general')->where('clave', LimiteGratisService::CLAVE_NUEVAS)->update(['valor' => '9']);
        $this->assertSame(5, LimiteGratisService::valorNuevas());

        DB::table('configuracion_general')->where('clave', LimiteGratisService::CLAVE_NUEVAS)->update(['valor' => '-2']);
        $this->assertSame(0, LimiteGratisService::valorNuevas());
    }

    public function test_la_publicacion_de_mas_queda_en_borrador_en_espera_de_pago(): void
    {
        $u = $this->usuario('vendedor', ['publicaciones_gratis' => 1]);
        $this->actingAs($u);

        $primera = $this->postJson('/api/v1/vendedor/propiedades', $this->datos())->assertCreated()->json('data.id');
        $segunda = $this->postJson('/api/v1/vendedor/propiedades', $this->datos(['direccion' => 'Cl 9 # 3-10']))
            ->assertSuccessful()->json('data.id');

        $this->assertSame('publicada', Propiedad::findOrFail($primera)->estado);
        $p = Propiedad::findOrFail($segunda);
        $this->assertSame('borrador', $p->estado);
        $this->assertTrue((bool) $p->en_espera_pago);
    }

    /* ---------------- El administrador cambia las gratis de las cuentas nuevas ---------------- */

    public function test_el_administrador_cambia_las_gratis_y_las_cuentas_existentes_no_se_tocan(): void
    {
        $admin = $this->usuario('administrador');
        $existente = $this->usuario('vendedor', ['publicaciones_gratis' => 1]);

        $this->actingAs($admin)->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => 3])
            ->assertOk()->assertJsonPath('nuevas', 3);

        $this->getJson('/api/v1/admin/membresias/gratis')->assertOk()->assertJsonPath('nuevas', 3);
        $this->assertSame(3, LimiteGratisService::valorNuevas());
        $this->assertSame(1, (int) $existente->fresh()->publicaciones_gratis);

        // Mismo valor otra vez: no hay cambio
        $this->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => 3])
            ->assertOk()->assertJsonPath('mensaje', 'Ya estaba en 3. No hubo cambios.');
    }

    public function test_las_gratis_solo_aceptan_numeros_de_0_a_5(): void
    {
        $this->actingAs($this->usuario('administrador'));

        $this->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => 6])->assertStatus(422)->assertJsonValidationErrors('nuevas');
        $this->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => -1])->assertStatus(422);
        $this->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => 'muchas'])->assertStatus(422);
        $this->putJson('/api/v1/admin/membresias/gratis', [])->assertStatus(422);
        $this->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => 0])->assertOk();
    }

    public function test_solo_el_administrador_cambia_las_gratis(): void
    {
        $this->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => 2])->assertStatus(401);

        $this->actingAs($this->usuario('vendedor'))
            ->putJson('/api/v1/admin/membresias/gratis', ['nuevas' => 2])->assertStatus(403);
    }

    /* ---------------- Límite de intentos: error 429 ---------------- */

    public function test_el_inicio_de_sesion_del_vendedor_se_bloquea_tras_10_intentos_por_minuto(): void
    {
        $u = $this->usuario('vendedor');

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/vendedor/sesion', ['email' => $u->email, 'password' => 'mala'])->assertStatus(401);
        }

        // El intento 11 ya no llega a revisar la clave, ni siquiera con la correcta
        $this->postJson('/api/v1/vendedor/sesion', ['email' => $u->email, 'password' => 'Umbral2026*'])->assertStatus(429);
    }

    public function test_el_inicio_de_sesion_de_la_inmobiliaria_se_bloquea_tras_10_intentos_por_minuto(): void
    {
        $u = $this->usuario('inmobiliaria');

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/inmobiliaria/sesion', ['email' => $u->email, 'password' => 'mala'])->assertStatus(401);
        }

        $this->postJson('/api/v1/inmobiliaria/sesion', ['email' => $u->email, 'password' => 'Umbral2026*'])->assertStatus(429);
    }

    public function test_recuperar_clave_se_bloquea_tras_5_solicitudes_por_minuto(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/recuperar-clave', ['email' => 'alguien@umbral.test']);
        }

        $this->postJson('/api/v1/recuperar-clave', ['email' => 'alguien@umbral.test'])->assertStatus(429);
    }

    public function test_el_limite_de_intentos_de_un_usuario_no_bloquea_a_otro_tipo_de_peticion(): void
    {
        $u = $this->usuario('vendedor');

        for ($i = 0; $i < 11; $i++) {
            $this->postJson('/api/v1/vendedor/sesion', ['email' => $u->email, 'password' => 'mala']);
        }

        // El límite es por ruta: leer información pública sigue funcionando
        $this->getJson('/api/v1/public/propiedades')->assertOk();
    }
}