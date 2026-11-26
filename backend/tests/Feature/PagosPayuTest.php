<?php

namespace Tests\Feature;

use App\Models\Membresia;
use App\Models\Pago;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PagosPayuTest extends TestCase
{
    use RefreshDatabase;

    private const API_KEY = '4Vj8eK4rloUd272L48hsrarnUA';

    private User $inmo;

    protected function setUp(): void
    {
        parent::setUp();
        $rol = Role::firstOrCreate(['nombre' => 'inmobiliaria'], ['descripcion' => 'inmobiliaria']);
        $this->inmo = User::forceCreate([
            'name' => 'Inmo PayU', 'email' => 'payu' . uniqid() . '@umbral.test', 'password' => 'Umbral2026*',
            'role_id' => $rol->id, 'estado' => 'activo', 'telefono' => '3001234567',
        ]);
        config([
            'services.payu.merchant_id' => '508029',
            'services.payu.account_id' => '512321',
            'services.payu.api_key' => self::API_KEY,
            'services.payu.checkout_url' => 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/',
            'services.payu.test' => true,
            'services.payu.confirmation_url' => null,
            'portal.frontend_url' => 'https://umbral.test',
        ]);
    }

    private function iniciar(): Pago
    {
        $r = $this->actingAs($this->inmo)->postJson('/api/v1/inmobiliaria/membresia', ['plan' => 'semanal'])->assertOk();
        $pago = Pago::sole();
        $this->assertSame('https://umbral.test/pago/payu.html?ref=' . $pago->referencia, $r->json('checkout_url'));
        $this->assertSame('Te llevamos a PayU para hacer el pago.', $r->json('message'));

        return $pago;
    }

    private function confirmacion(Pago $pago, string $estado, string $valor = '19900.00', ?string $firma = null): array
    {
        $nuevo = number_format((float) $valor, 1, '.', '');

        return [
            'merchant_id' => '508029',
            'reference_sale' => $pago->referencia,
            'value' => $valor,
            'currency' => 'COP',
            'state_pol' => $estado,
            'transaction_id' => 'tx-' . $estado,
            'payment_method_name' => 'VISA',
            'sign' => $firma ?? md5(self::API_KEY . '~508029~' . $pago->referencia . '~' . $nuevo . '~COP~' . $estado),
        ];
    }

    public function test_con_llaves_de_payu_el_pago_queda_pendiente_y_lleva_a_payu(): void
    {
        $pago = $this->iniciar();

        $this->assertSame(['pendiente', 'payu', 1990000], [$pago->estado, $pago->proveedor, $pago->monto_centavos]);
        $this->assertSame(0, Membresia::count());
        $this->getJson('/api/v1/inmobiliaria/membresia')->assertJsonPath('simulado', false)->assertJsonPath('pasarela', 'PayU');
    }

    public function test_formulario_lleva_la_firma_md5_correcta(): void
    {
        $pago = $this->iniciar();

        $r = $this->getJson('/api/v1/public/pagos/payu/formulario?ref=' . $pago->referencia)->assertOk();
        $campos = $r->json('data.campos');
        $this->assertSame('https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/', $r->json('data.accion'));
        $this->assertSame(['508029', '512321', '19900', 'COP', '1'], [$campos['merchantId'], $campos['accountId'], $campos['amount'], $campos['currency'], $campos['test']]);
        $this->assertSame(md5(self::API_KEY . '~508029~' . $pago->referencia . '~19900~COP'), $campos['signature']);
        $this->assertSame('https://umbral.test/pago/resultado.html', $campos['responseUrl']);
        $this->assertSame('https://umbral.test/api/v1/pagos/payu/confirmacion', $campos['confirmationUrl']);

        $this->getJson('/api/v1/public/pagos/payu/formulario?ref=NO-EXISTE')->assertNotFound();
    }

    public function test_confirmacion_aprobada_activa_la_membresia_una_sola_vez(): void
    {
        $pago = $this->iniciar();
        $datos = $this->confirmacion($pago, '4');

        $this->post('/api/v1/pagos/payu/confirmacion', $datos)->assertOk();
        $this->post('/api/v1/pagos/payu/confirmacion', $datos)->assertOk();

        $pago->refresh();
        $this->assertSame(['aprobado', 'VISA', 'tx-4'], [$pago->estado, $pago->metodo, $pago->transaccion_id]);
        $this->assertSame(1, Membresia::count());
        $this->getJson('/api/v1/public/pagos/payu/formulario?ref=' . $pago->referencia)->assertStatus(409);
    }

    public function test_confirmacion_con_firma_falsa_o_valor_alterado_no_activa_nada(): void
    {
        $pago = $this->iniciar();

        $this->post('/api/v1/pagos/payu/confirmacion', $this->confirmacion($pago, '4', '19900.00', 'firmafalsa'))->assertStatus(400);
        $this->assertSame('pendiente', $pago->fresh()->estado);

        $this->post('/api/v1/pagos/payu/confirmacion', $this->confirmacion($pago, '4', '100.00'))->assertOk();
        $this->assertSame('error', $pago->fresh()->estado);
        $this->assertSame(0, Membresia::count());
    }

    public function test_confirmacion_rechazada_deja_el_pago_rechazado(): void
    {
        $pago = $this->iniciar();

        $this->post('/api/v1/pagos/payu/confirmacion', $this->confirmacion($pago, '6'))->assertOk();
        $this->assertSame('rechazado', $pago->fresh()->estado);
        $this->assertSame(0, Membresia::count());
    }

    public function test_vuelta_del_navegador_valida_la_firma_de_respuesta(): void
    {
        $pago = $this->iniciar();
        $base = [
            'merchantId' => '508029', 'referenceCode' => $pago->referencia, 'TX_VALUE' => '19900.00',
            'currency' => 'COP', 'transactionState' => '4', 'transactionId' => 'tx-vuelta', 'lapPaymentMethod' => 'VISA',
        ];

        $this->getJson('/api/v1/public/pagos/estado?' . http_build_query($base + ['signature' => 'falsa']))
            ->assertOk()->assertJsonPath('data.estado', 'pendiente');

        $firma = md5(self::API_KEY . '~508029~' . $pago->referencia . '~19900.0~COP~4');
        $this->getJson('/api/v1/public/pagos/estado?' . http_build_query($base + ['signature' => $firma]))
            ->assertOk()->assertJsonPath('data.estado', 'aprobado')->assertJsonPath('data.metodo', 'VISA')
            ->assertJsonPath('data.volver', '/inmobiliaria/membresia.html');
        $this->assertSame(1, Membresia::count());
    }
}
