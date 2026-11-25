<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** API pública que usa el perfil Invitado: listado, contactos, visitas, actividad y chatbot. */
class InvitadoPublicoTest extends TestCase
{
    use RefreshDatabase;

    private User $vendedor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->vendedor = $this->vendedor('activo');
    }

    private function vendedor(string $estado): User
    {
        $rol = Role::firstOrCreate(['nombre' => 'vendedor'], ['descripcion' => 'vendedor']);

        return User::forceCreate([
            'name' => 'Vendedor ' . uniqid(), 'email' => 'v' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => $estado, 'telefono' => '3000000000',
        ]);
    }

    private function propiedad(array $extra = [], ?User $dueno = null): Propiedad
    {
        return Propiedad::create($extra + [
            'user_id' => ($dueno ?? $this->vendedor)->id, 'tipo' => 'casa', 'operacion' => 'venta', 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén', 'direccion' => 'Cra 1 # ' . uniqid(),
            'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 120,
            'estrato' => 4, 'estado' => 'publicada',
        ]);
    }

    private function fechaVisita(int $dias = 3, int $hora = 10): string
    {
        return now('America/Bogota')->addDays($dias)->setTime($hora, 0)->format('Y-m-d\TH:i');
    }

    // ---------- Listado público ----------

    public function test_el_listado_solo_muestra_lo_publicado_vigente_y_de_cuentas_activas(): void
    {
        $visible = $this->propiedad();
        $this->propiedad(['estado' => 'borrador']);
        $this->propiedad(['publicada_hasta' => now()->subDay()]);
        $this->propiedad([], $this->vendedor('inactivo'));

        $ids = collect($this->getJson('/api/v1/public/propiedades')->assertOk()->json('data'))->pluck('id')->all();

        $this->assertSame([$visible->id], $ids);
    }

    public function test_el_detalle_de_algo_no_publicado_es_404(): void
    {
        $this->getJson('/api/v1/public/propiedades/' . $this->propiedad(['estado' => 'borrador'])->id)->assertNotFound();
        $this->getJson('/api/v1/public/propiedades/' . $this->propiedad()->id)->assertOk();
    }

    public function test_los_filtros_del_listado(): void
    {
        $casa = $this->propiedad(['tipo' => 'casa', 'operacion' => 'venta', 'precio' => 300000000, 'area' => 200, 'banos' => 3, 'estrato' => 5]);
        $apto = $this->propiedad(['tipo' => 'apartamento', 'operacion' => 'arriendo', 'precio' => 2000000, 'area' => 60, 'banos' => 1, 'estrato' => 3]);

        $ids = fn (string $q) => collect($this->getJson('/api/v1/public/propiedades?' . $q)->assertOk()->json('data'))->pluck('id')->all();

        $this->assertSame([$casa->id], $ids('tipo=casa'));
        $this->assertSame([$apto->id], $ids('operacion=arriendo'));
        $this->assertSame([$apto->id], $ids('precio_max=5000000'));
        $this->assertSame([$casa->id], $ids('area_min=100'));
        $this->assertSame([$casa->id], $ids('banos_min=2'));
        $this->assertSame([$apto->id], $ids('estrato=3'));
        // valores inválidos se ignoran (no rompen ni filtran)
        $this->assertCount(2, $ids('tipo=castillo&precio_max=abc&estrato=9'));
    }

    public function test_la_mas_nueva_va_primero_entre_normales(): void
    {
        $vieja = $this->propiedad();
        $vieja->forceFill(['created_at' => now()->subDays(5)])->save();
        $nueva = $this->propiedad();

        $ids = collect($this->getJson('/api/v1/public/propiedades')->json('data'))->pluck('id')->all();

        $this->assertSame([$nueva->id, $vieja->id], $ids);
    }

    public function test_ubicaciones_responde_con_datos(): void
    {
        $this->getJson('/api/v1/public/ubicaciones')->assertOk()->assertJsonStructure(['data']);
    }

    // ---------- Contactos ----------

    public function test_un_invitado_deja_su_contacto(): void
    {
        $p = $this->propiedad();

        $this->postJson('/api/v1/public/leads', ['propiedad_id' => $p->id, 'nombre' => 'Camila', 'contacto' => '3104567890', 'mensaje' => 'Hola'])
            ->assertCreated();

        $this->assertDatabaseHas('leads', ['propiedad_id' => $p->id, 'nombre' => 'Camila', 'estado' => 'nuevo']);
    }

    public function test_no_se_recibe_contacto_de_lo_que_no_esta_disponible(): void
    {
        $datos = fn (Propiedad $p) => ['propiedad_id' => $p->id, 'nombre' => 'Camila', 'contacto' => '3104567890'];

        $this->postJson('/api/v1/public/leads', $datos($this->propiedad(['estado' => 'borrador'])))->assertNotFound();
        $this->postJson('/api/v1/public/leads', $datos($this->propiedad(['publicada_hasta' => now()->subDay()])))->assertNotFound();
        $this->postJson('/api/v1/public/leads', $datos($this->propiedad([], $this->vendedor('inactivo'))))->assertNotFound();
        $this->postJson('/api/v1/public/leads', ['propiedad_id' => 999999, 'nombre' => 'Camila', 'contacto' => '3104567890'])->assertNotFound();

        $this->assertSame(0, Lead::count());
    }

    public function test_el_contacto_exige_nombre_y_medio_de_contacto(): void
    {
        $this->postJson('/api/v1/public/leads', ['propiedad_id' => $this->propiedad()->id])
            ->assertStatus(422)->assertJsonValidationErrors(['nombre', 'contacto']);
    }

    // ---------- Visitas ----------

    public function test_un_invitado_pide_una_visita(): void
    {
        $p = $this->propiedad();

        $this->postJson('/api/v1/public/visitas', [
            'propiedad_id' => $p->id, 'nombre' => 'Laura', 'contacto' => 'laura@example.com', 'fecha' => $this->fechaVisita(),
        ])->assertCreated()->assertJsonPath('ok', true);

        $this->assertSame(1, Lead::where('propiedad_id', $p->id)->count());
        $this->assertSame('pendiente', Visita::where('propiedad_id', $p->id)->value('estado'));
    }

    public function test_la_visita_respeta_horario_y_fecha_futura(): void
    {
        $p = $this->propiedad();
        $base = ['propiedad_id' => $p->id, 'nombre' => 'Laura', 'contacto' => 'laura@example.com'];

        $this->postJson('/api/v1/public/visitas', $base + ['fecha' => $this->fechaVisita(3, 5)])->assertStatus(422)->assertJsonValidationErrors('fecha');
        $this->postJson('/api/v1/public/visitas', $base + ['fecha' => $this->fechaVisita(3, 20)])->assertStatus(422)->assertJsonValidationErrors('fecha');
        $this->postJson('/api/v1/public/visitas', $base + ['fecha' => $this->fechaVisita(-2)])->assertStatus(422)->assertJsonValidationErrors('fecha');
        $this->postJson('/api/v1/public/visitas', $base + ['fecha' => $this->fechaVisita(90)])->assertStatus(422)->assertJsonValidationErrors('fecha');
        $this->postJson('/api/v1/public/visitas', $base + ['fecha' => 'mañana'])->assertStatus(422);

        $this->assertSame(0, Visita::count());
    }

    public function test_no_se_repite_la_visita_de_la_misma_persona(): void
    {
        $p = $this->propiedad();
        $datos = ['propiedad_id' => $p->id, 'nombre' => 'Laura', 'contacto' => 'laura@example.com', 'fecha' => $this->fechaVisita()];

        $this->postJson('/api/v1/public/visitas', $datos)->assertCreated();
        $this->postJson('/api/v1/public/visitas', $datos)->assertStatus(422);

        $this->assertSame(1, Visita::count());
    }

    public function test_no_se_piden_visitas_de_lo_que_no_esta_disponible(): void
    {
        $fecha = $this->fechaVisita();
        $pide = fn (Propiedad $p) => $this->postJson('/api/v1/public/visitas', ['propiedad_id' => $p->id, 'nombre' => 'Laura', 'contacto' => 'l@example.com', 'fecha' => $fecha]);

        $pide($this->propiedad(['estado' => 'borrador']))->assertNotFound();
        $pide($this->propiedad(['publicada_hasta' => now()->subDay()]))->assertNotFound();
        $pide($this->propiedad([], $this->vendedor('inactivo')))->assertNotFound();

        $this->assertSame(0, Visita::count());
    }

    // ---------- Actividad del invitado ----------

    private function actividad(array $d, string $agente = 'Mozilla/5.0 (X11; Linux) Chrome/120')
    {
        return $this->withHeaders(['User-Agent' => $agente])->postJson('/api/v1/public/actividad', $d);
    }

    public function test_la_actividad_cuenta_una_visita_y_una_sola_vista_por_sesion(): void
    {
        $p = $this->propiedad();
        $huella = 'huella-de-prueba-0001';

        $this->actividad(['huella' => $huella, 'tipo' => 'visita'])->assertOk();
        $this->actividad(['huella' => $huella, 'tipo' => 'ver_publicacion', 'propiedad_id' => $p->id])->assertOk();
        $this->actividad(['huella' => $huella, 'tipo' => 'ver_publicacion', 'propiedad_id' => $p->id])->assertOk();

        $this->assertSame(1, DB::table('invitados')->count());
        $this->assertSame(1, (int) DB::table('invitados')->value('visitas'));
        $this->assertSame(1, DB::table('invitado_eventos')->where('tipo', 'ver_publicacion')->count());
    }

    public function test_la_actividad_ignora_robots_y_guarda_la_ip_enmascarada(): void
    {
        $this->actividad(['huella' => 'huella-de-prueba-0002', 'tipo' => 'visita'], 'Googlebot/2.1')
            ->assertOk()->assertJsonPath('ignorado', true);
        $this->assertSame(0, DB::table('invitados')->count());

        $this->actividad(['huella' => 'huella-de-prueba-0003', 'tipo' => 'visita'])->assertOk();
        $this->assertStringEndsWith('.x.x', (string) DB::table('invitados')->value('ip'));
    }

    public function test_la_actividad_valida_sus_datos(): void
    {
        $this->actividad(['huella' => 'corta', 'tipo' => 'visita'])->assertStatus(422);
        $this->actividad(['huella' => 'huella-de-prueba-0004', 'tipo' => 'inventado'])->assertStatus(422);
        $this->actividad(['huella' => 'huella-de-prueba-0004', 'tipo' => 'favorito_agregado'])->assertStatus(422);
        $this->actividad(['huella' => 'huella-de-prueba-0004', 'tipo' => 'favorito_agregado', 'propiedad_id' => 999999])->assertStatus(422);
        $this->actividad(['huella' => 'huella-de-prueba-0004', 'tipo' => 'contacto', 'propiedad_id' => $this->propiedad()->id])->assertStatus(422);
    }

    // ---------- Chatbot ----------

    private function chat(array $extra = [])
    {
        return $this->postJson('/api/v1/public/chatbot', $extra + ['mensajes' => [['rol' => 'user', 'texto' => 'Hola']]]);
    }

    public function test_el_chatbot_valida_idioma_y_mensajes(): void
    {
        $this->chat(['idioma' => 'klingon'])->assertStatus(422);
        $this->chat(['mensajes' => []])->assertStatus(422);
        $this->chat(['mensajes' => [['rol' => 'user', 'texto' => str_repeat('a', 601)]]])->assertStatus(422);
        $this->chat(['mensajes' => [['rol' => 'user', 'texto' => 'Hola'], ['rol' => 'assistant', 'texto' => 'Hola']]])->assertStatus(422);
    }

    public function test_el_chatbot_acepta_los_12_idiomas(): void
    {
        foreach (['es', 'en', 'pt', 'fr', 'ar', 'de', 'it', 'zh', 'ja', 'ko', 'ru', 'hi'] as $idioma) {
            $this->assertNotSame(422, $this->chat(['idioma' => $idioma])->status(), $idioma);
        }
    }

    public function test_el_chatbot_tiene_tope_diario_por_visitante(): void
    {
        Cache::put('chatbot:127.0.0.1:' . now()->format('Ymd'), 80, now()->endOfDay());

        $this->chat()->assertStatus(429)->assertJsonPath('limite', true);
    }
}
