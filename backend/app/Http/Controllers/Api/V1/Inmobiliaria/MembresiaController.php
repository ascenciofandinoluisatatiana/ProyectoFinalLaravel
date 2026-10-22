<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Membresia;
use App\Models\Pago;
use App\Services\Pagos\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Membresía de la inmobiliaria (RF-048 a RF-056).
 * La membresía da mejor posicionamiento a las propiedades (RF-053).
 *
 * El cobro se hace con la pasarela Wompi (PSE, tarjeta, Nequi) a través de PagoService:
 * "contratar" crea el pago y devuelve la URL del checkout; la membresía se activa SOLO
 * cuando Wompi confirma el pago como aprobado. Sin llaves de Wompi el pago es simulado
 * y la membresía se activa de una vez (como antes).
 * El vendedor usa este mismo controlador (rutas /api/v1/vendedor/membresia).
 */
class MembresiaController extends BaseInmobiliariaController
{
    private const ZONA = 'America/Bogota';

    /** GET /membresia — vigente, historial y planes disponibles */
    public function show(Request $request): JsonResponse
    {
        $usuario = $this->inmobiliaria($request);
        $hoy = Carbon::now(self::ZONA)->toDateString();

        $vigente = Membresia::where('user_id', $usuario->id)
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)
            ->orderByDesc('fecha_fin')
            ->first();

        $historial = Membresia::where('user_id', $usuario->id)
            ->orderByDesc('fecha_inicio')->orderByDesc('id')
            ->get()
            ->map(fn (Membresia $m) => $this->formato($m));

        $planes = collect(Membresia::PRECIOS_PLAN)->map(fn ($precio, $plan) => [
            'plan' => $plan,
            'nombre' => Membresia::NOMBRES_PLAN[$plan],
            'precio' => $precio,
            'dias' => ['semanal' => 7, 'quincenal' => 15, 'mensual' => 30][$plan] ?? null,
        ])->values();

        return response()->json([
            'vigente' => $vigente ? $this->formato($vigente) + [
                'dias_restantes' => (int) Carbon::parse($hoy)->diffInDays(Carbon::parse($vigente->fecha_fin->toDateString())),
            ] : null,
            'historial' => $historial->all(),
            'planes' => $planes->all(),
            // Últimos intentos de pago, con su resultado (RF-051)
            'pagos' => Pago::where('user_id', $usuario->id)->where('concepto', 'membresia')
                ->latest('id')->take(10)->get()
                ->map(fn (Pago $p) => [
                    'referencia' => $p->referencia,
                    'plan' => Membresia::NOMBRES_PLAN[$p->plan] ?? $p->plan,
                    'monto' => $p->monto,
                    'estado' => $p->estado,
                    'metodo' => $p->metodo,
                    'fecha' => $p->created_at?->toIso8601String(),
                ])->all(),
            'simulado' => app(PagoService::class)->simulado(),
        ]);
    }

    /**
     * POST /membresia  { plan } — contrata o renueva.
     * Con Wompi responde 200 con "checkout_url" (el frontend lleva a la persona a pagar).
     * En modo simulado responde 201 con la membresía ya activa.
     */
    public function contratar(Request $request, PagoService $pagos): JsonResponse
    {
        $datos = $request->validate(['plan' => ['required', Rule::in(array_keys(Membresia::PRECIOS_PLAN))]]);
        $usuario = $this->inmobiliaria($request);

        $hoy = Carbon::now(self::ZONA)->toDateString();
        $renovacion = Membresia::where('user_id', $usuario->id)->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)->exists();

        $resultado = $pagos->iniciarMembresia($usuario, $datos['plan']);
        $pago = $resultado['pago'];

        if (! $pagos->simulado()) {
            return response()->json([
                'message' => 'Te llevamos a Wompi para hacer el pago.',
                'checkout_url' => $resultado['url'],
                'referencia' => $pago->referencia,
            ]);
        }

        $membresia = $pago->membresia;

        return response()->json([
            'message' => ($renovacion ? 'Membresía renovada hasta el ' : 'Membresía activada hasta el ')
                . $membresia->fecha_fin->format('d/m/Y') . ' (pago simulado).',
            'data' => $this->formato($membresia),
            'checkout_url' => null,
        ], 201);
    }

    private function formato(Membresia $m): array
    {
        return [
            'id' => $m->id,
            'plan' => $m->plan,
            'nombre_plan' => Membresia::NOMBRES_PLAN[$m->plan] ?? $m->plan,
            'precio' => (float) $m->precio,
            'estado' => $m->estado,
            'fecha_inicio' => $m->fecha_inicio->toDateString(),
            'fecha_fin' => $m->fecha_fin->toDateString(),
            'referencia' => $m->referencia_pago,
        ];
    }
}
