<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Membresia;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** Pagos con Wompi: membresías, compra/arriendo del invitado, resultado y webhook. */
class PagosWompiTest extends TestCase
{
    use RefreshDatabase;

    private User $inmo;

    protected function setUp(): void
    {
        parent::setUp();
        $rol = Role::firstOrCreate(['nombre' => 'inmobiliaria'], ['descripcion' => 'inmobiliaria']);
        $this->inmo = User::forceCreate([
            'name' => 'Inmo Pagos', 'email' => 'pagos' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => 'activo', 'telefono' => '3000000000',
        ]);
    }

    private function conWompi(): void
    {
        config([
            'services.wompi.public_key' => 'pub_test_abc',
            'services.wompi.integrity_secret' => 'test_integrity_123',
            'services.wompi.events_secret' => 'test_events_456',
            'services.wompi.api_url' => 'https://sandbox.wompi.co/v1',
            'services.wompi.checkout_url' => 'https://checkout.wompi.co/p/',
        ]);
    }

    /** Wompi responde la transacción $id con este estado y valor. */
    private array $respuestaWompi = [];

    private function wompiResponde(string $id, string $referencia, string $estado, int $centavos): void
    {
        $this->respuestaWompi = [
            'id' => $id, 'reference' => $referencia, 'status' => $estado,
            'amount_in_cents' => $centavos, 'currency' => 'COP', 'payment_method_type' => 'PSE',
        ];
        // Se registra una sola vez y responde lo último que se configuró
        Http::fake(fn () => Http::response(['data' => $this->respuestaWompi]));
    }

    private function propiedad(array $extra = []): Propiedad
    {
        return Propiedad::create(array_merge([
            'user_id' => $this->inmo->id, 'tipo' => 'casa', 'operacion' => 'venta', 'precio' => 350000000,
            'departamento' => 'Tolima', 'ciudad' => 'Ibagué', 'barrio' => 'Belén', 'direccion' => 'Cra 1 # ' . uniqid(),
            'lat' => 4.43, 'lng' => -75.2, 'habitaciones' => 3, 'banos' => 2, 'parqueaderos' => 1, 'area' => 120,
            'estado' => 'publicada',
        ], $extra));
    }

    public function test_sin_llaves_la_membresia_se_simula_y_queda_registrada(): void
    {
        $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/membresia', ['plan' => 'mensual'])
            ->assertCreated()->assertJsonPath('checkout_url', null);

        $pago = Pago::sole();
        $this->assertSame(['aprobado', 'simulado'], [$pago->estado, $pago->proveedor]);
        $this->assertSame(5990000, $pago->monto_centavos);
        $this->assertNotNull($pago->membresia_id);
        $this->getJson('/api/v1/inmobiliaria/membresia')->assertJsonPath('simulado', true)->assertJsonCount(1, 'pagos');
    }

    public function test_membresia_con_wompi_se_activa_solo_cuando_wompi_aprueba(): void
    {
        $this->conWompi();

        $r = $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/membresia', ['plan' => 'semanal'])->assertOk();
        $pago = Pago::sole();

        // La URL lleva la firma de integridad correcta: SHA256(referencia + centavos + moneda + secreto)
        parse_str(parse_url($r->json('checkout_url'), PHP_URL_QUERY), $q);
        $this->assertStringStartsWith('https://checkout.wompi.co/p/?', $r->json('checkout_url'));
        $this->assertSame('1990000', $q['amount-in-cents']);
        $this->assertSame(hash('sha256', $pago->referencia . '1990000COPtest_integrity_123'), $q['signature:integrity']);
        $this->assertStringEndsWith('/pago/resultado.html', $q['redirect-url']);
        $this->assertSame(0, Membresia::count());

        // Vuelve de Wompi con ?id= y el pago fue aprobado
        $this->wompiResponde('tx-1', $pago->referencia, 'APPROVED', 1990000);
        $this->getJson('/api/v1/public/pagos/estado?id=tx-1')->assertOk()
            ->assertJsonPath('data.estado', 'aprobado')
            ->assertJsonPath('data.volver', '/inmobiliaria/membresia.html');

        // Consultar otra vez no crea una segunda membresía
        $this->getJson('/api/v1/public/pagos/estado?id=tx-1')->assertOk();
        $this->assertSame(1, Membresia::count());
        $this->assertSame($pago->referencia, Membresia::sole()->referencia_pago);
    }

    public function test_pago_rechazado_o_con_valor_alterado_no_activa_nada(): void
    {
        $this->conWompi();
        $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/membresia', ['plan' => 'mensual'])->assertOk();
        $pago = Pago::sole();

        $this->wompiResponde('tx-2', $pago->referencia, 'DECLINED', 5990000);
        $this->getJson('/api/v1/public/pagos/estado?id=tx-2')->assertJsonPath('data.estado', 'rechazado');

        $this->wompiResponde('tx-3', $pago->referencia, 'APPROVED', 100);   // alguien cambió el valor
        $this->getJson('/api/v1/public/pagos/estado?id=tx-3')->assertJsonPath('data.estado', 'error');
        $this->assertSame(0, Membresia::count());
    }

    public function test_invitado_compra_un_inmueble_y_queda_vendido(): void
    {
        $this->conWompi();
        $casa = $this->propiedad();

        $r = $this->postJson('/api/v1/public/pagos/propiedad', [
            'propiedad_id' => $casa->id, 'nombre' => 'Camila Ruiz', 'correo' => 'camila@correo.co',
            'documento' => '1110222333', 'consentimiento' => true,
        ])->assertOk();
        $this->assertStringStartsWith('https://checkout.wompi.co/p/', $r->json('url'));
        $pago = Pago::sole();
        $this->assertSame(35000000000, $pago->monto_centavos);

        $this->wompiResponde('tx-4', $pago->referencia, 'APPROVED', 35000000000);
        $this->getJson('/api/v1/public/pagos/estado?id=tx-4')->assertJsonPath('data.estado', 'aprobado');

        $this->assertSame('vendida', $casa->fresh()->estado);
        $this->assertSame('Camila Ruiz', Lead::sole()->nombre);

        // Ya no se puede volver a pagar
        $this->postJson('/api/v1/public/pagos/propiedad', [
            'propiedad_id' => $casa->id, 'nombre' => 'Otro', 'correo' => 'o@correo.co', 'documento' => '12345', 'consentimiento' => true,
        ])->assertStatus(422);
    }

    public function test_invitado_debe_aceptar_tratamiento_de_datos(): void
    {
        $casa = $this->propiedad(['operacion' => 'arriendo', 'precio' => 2500000]);
        $this->postJson('/api/v1/public/pagos/propiedad', [
            'propiedad_id' => $casa->id, 'nombre' => 'X', 'correo' => 'x@correo.co', 'documento' => '12345',
        ])->assertStatus(422)->assertJsonValidationErrors('consentimiento');
    }

    public function test_webhook_valida_la_firma_de_wompi(): void
    {
        $this->conWompi();
        $casa = $this->propiedad(['operacion' => 'arriendo', 'precio' => 2500000]);
        $this->postJson('/api/v1/public/pagos/propiedad', [
            'propiedad_id' => $casa->id, 'nombre' => 'Luis', 'correo' => 'l@correo.co', 'documento' => '98765', 'consentimiento' => true,
        ])->assertOk();
        $pago = Pago::sole();

        $evento = [
            'event' => 'transaction.updated',
            'data' => ['transaction' => [
                'id' => 'tx-5', 'reference' => $pago->referencia, 'status' => 'APPROVED',
                'amount_in_cents' => 250000000, 'payment_method_type' => 'NEQUI',
            ]],
            'signature' => ['properties' => ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']],
            'timestamp' => 1761000000,
        ];

        // Firma falsa → se ignora
        $this->postJson('/api/v1/pagos/wompi/eventos', $evento, ['X-Event-Checksum' => 'falsa'])->assertStatus(400);
        $this->assertSame('pendiente', $pago->fresh()->estado);

        $checksum = hash('sha256', 'tx-5APPROVED250000000' . '1761000000' . 'test_events_456');
        $this->postJson('/api/v1/pagos/wompi/eventos', $evento, ['X-Event-Checksum' => $checksum])->assertOk();

        $this->assertSame(['aprobado', 'NEQUI'], [$pago->fresh()->estado, $pago->fresh()->metodo]);
        $this->assertSame('arrendada', $casa->fresh()->estado);
    }
}
