<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\Pago;
use App\Models\PlanMembresia;
use App\Models\Propiedad;
use App\Services\Pagos\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Membresía POR PUBLICACIÓN del vendedor.
 *
 * Publicar es gratis y deja el inmueble en la zona normal de la búsqueda.
 * Pagar una membresía para un inmueble lo sube a las zonas posicionadas
 * (Oro = mensual, Plata = quincenal, Bronce = semanal) mientras esté vigente.
 *
 *   GET  /vendedor/membresia   → planes, membresías vigentes por inmueble y últimos pagos
 *   POST /vendedor/membresia   → { plan, propiedad_id } paga la membresía de ese inmueble
 */
class MembresiaController extends Controller
{
    private const ZONA = 'America/Bogota';

    /** Un inmueble vendido o arrendado ya salió del portal: no tiene sentido posicionarlo. */
    private const ESTADOS_POSICIONABLES = ['borrador', 'publicada', 'pausada'];

    public function show(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $planes = collect(PlanMembresia::precios())->map(fn ($precio, $plan) => [
            'plan' => $plan,
            'nombre' => Membresia::NOMBRES_PLAN[$plan],
            'precio' => $precio,
            'dias' => ['semanal' => 7, 'quincenal' => 15, 'mensual' => 30][$plan] ?? null,
        ])->values();

        return response()->json([
            'planes' => $planes->all(),
            'vigentes' => self::vigentesPorPropiedad($usuario->id)
                ->map(fn (Membresia $m) => self::formato($m))->values()->all(),
            'pagos' => Pago::with('propiedad')->where('user_id', $usuario->id)->where('concepto', 'membresia')
                ->latest('id')->take(10)->get()
                ->map(fn (Pago $p) => [
                    'referencia' => $p->referencia,
                    'plan' => Membresia::NOMBRES_PLAN[$p->plan] ?? $p->plan,
                    'propiedad_id' => $p->propiedad_id,
                    'monto' => $p->monto,
                    'estado' => $p->estado,
                    'metodo' => $p->metodo,
                    'fecha' => $p->created_at?->toIso8601String(),
                ])->all(),
            'simulado' => app(PagoService::class)->simulado(),
        ]);
    }

    /**
     * Con Wompi responde 200 con "checkout_url" (el frontend lleva a la persona a pagar).
     * En modo simulado responde 201 con la membresía ya activa.
     */
    public function contratar(Request $request, PagoService $pagos): JsonResponse
    {
        $datos = $request->validate([
            'plan' => ['required', Rule::in(array_keys(PlanMembresia::precios()))],
            'propiedad_id' => ['required', 'integer'],
        ], [
            'propiedad_id.required' => 'Elige el inmueble que quieres posicionar.',
        ]);
        $usuario = $request->user();

        // Solo se puede pagar por un inmueble propio (de otro vendedor responde 404)
        $propiedad = Propiedad::where('user_id', $usuario->id)->findOrFail($datos['propiedad_id']);

        if (! in_array($propiedad->estado, self::ESTADOS_POSICIONABLES, true)) {
            throw ValidationException::withMessages([
                'propiedad_id' => 'Este inmueble ya salió del portal; no se puede posicionar.',
            ]);
        }

        $hoy = Carbon::now(self::ZONA)->toDateString();
        $renovacion = Membresia::where('user_id', $usuario->id)->where('propiedad_id', $propiedad->id)
            ->where('estado', 'activa')->whereDate('fecha_fin', '>=', $hoy)->exists();

        $resultado = $pagos->iniciarMembresia($usuario, $datos['plan'], $propiedad);
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
            'message' => ($renovacion ? 'Posicionamiento renovado hasta el ' : 'Inmueble posicionado hasta el ')
                . $membresia->fecha_fin->format('d/m/Y') . ' (pago simulado).',
            'data' => self::formato($membresia),
            'checkout_url' => null,
        ], 201);
    }

    /** La membresía vigente de cada inmueble (la que vence más tarde), indexada por propiedad_id. */
    public static function vigentesPorPropiedad(int $userId)
    {
        return Membresia::where('user_id', $userId)
            ->whereNotNull('propiedad_id')
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', Carbon::now(self::ZONA)->toDateString())
            ->orderByDesc('fecha_fin')
            ->get()
            ->unique('propiedad_id')
            ->keyBy('propiedad_id');
    }

    public static function formato(Membresia $m): array
    {
        $hoy = Carbon::now(self::ZONA)->startOfDay();

        return [
            'id' => $m->id,
            'propiedad_id' => $m->propiedad_id,
            'plan' => $m->plan,
            'nombre_plan' => Membresia::NOMBRES_PLAN[$m->plan] ?? $m->plan,
            'precio' => (float) $m->precio,
            'estado' => $m->estado,
            'fecha_inicio' => $m->fecha_inicio->toDateString(),
            'fecha_fin' => $m->fecha_fin->toDateString(),
            'dias_restantes' => max(0, (int) $hoy->diffInDays(Carbon::parse($m->fecha_fin->toDateString(), self::ZONA)->startOfDay())),
            'referencia' => $m->referencia_pago,
        ];
    }
}