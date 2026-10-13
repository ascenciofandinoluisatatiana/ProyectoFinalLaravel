<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Membresia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Membresía de la inmobiliaria (RF-048 a RF-056).
 * La membresía da mejor posicionamiento a las propiedades (RF-053).
 *
 * IMPORTANTE: el cobro por PSE todavía no está integrado (el proveedor no se ha
 * definido, RF-050). Por eso "contratar" registra un pago SIMULADO con referencia
 * "SIM-...". Cuando llegue el proveedor, solo cambia el método contratar().
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
            'simulado' => true,
        ]);
    }

    /** POST /membresia  { plan } — contrata o renueva (si hay una vigente, la nueva empieza cuando esa termina) */
    public function contratar(Request $request): JsonResponse
    {
        $datos = $request->validate(['plan' => ['required', Rule::in(array_keys(Membresia::PRECIOS_PLAN))]]);
        $usuario = $this->inmobiliaria($request);
        $hoy = Carbon::now(self::ZONA)->startOfDay();

        $ultimaVigente = Membresia::where('user_id', $usuario->id)
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy->toDateString())
            ->orderByDesc('fecha_fin')
            ->first();

        // Renovar antes de vencer no hace perder días (RF-055)
        $inicio = $ultimaVigente ? Carbon::parse($ultimaVigente->fecha_fin->toDateString()) : $hoy;

        $membresia = Membresia::create([
            'user_id' => $usuario->id,
            'plan' => $datos['plan'],
            'precio' => Membresia::PRECIOS_PLAN[$datos['plan']],   // se guarda el precio aplicado (RF-058)
            'estado' => 'activa',
            'fecha_inicio' => $inicio->toDateString(),
            'fecha_fin' => Membresia::calcularFin($datos['plan'], $inicio)->toDateString(),
            'referencia_pago' => 'SIM-' . strtoupper(Str::random(10)),
        ]);

        return response()->json([
            'message' => $ultimaVigente
                ? 'Membresía renovada hasta el ' . $membresia->fecha_fin->format('d/m/Y') . ' (pago simulado).'
                : 'Membresía activada hasta el ' . $membresia->fecha_fin->format('d/m/Y') . ' (pago simulado).',
            'data' => $this->formato($membresia),
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
