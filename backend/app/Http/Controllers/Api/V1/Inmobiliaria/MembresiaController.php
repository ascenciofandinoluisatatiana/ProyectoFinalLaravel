<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Membresia;
use App\Models\Pago;
use App\Models\PaqueteMembresia;
use App\Models\PlanMembresia;
use App\Models\Propiedad;
use App\Services\Pagos\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Membresía de la inmobiliaria (RF-048 a RF-056).
 * La membresía se compra POR PUBLICACIÓN (POST /propiedades/{id}/destacar): solo esa
 * propiedad sube en el portal, según el plan (mensual > quincenal > semanal) (RF-053).
 * Las publicaciones sin membresía siguen visibles, después de las destacadas.
 * "contratar" (membresía de toda la cuenta) se conserva para el vendedor y para las
 * membresías que ya existían.
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

        // Membresía de toda la cuenta (la del vendedor o las que existían antes)
        $vigente = Membresia::where('user_id', $usuario->id)
            ->whereNull('propiedad_id')
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)
            ->orderByDesc('fecha_fin')
            ->first();

        $propias = Propiedad::where('user_id', $usuario->id)->get(['id', 'tipo', 'barrio', 'ciudad', 'estado']);
        $titulos = $propias->mapWithKeys(fn ($p) => [$p->id => $this->tituloPropiedad($p)])->all();

        $historial = Membresia::where('user_id', $usuario->id)
            ->orderByDesc('fecha_inicio')->orderByDesc('id')
            ->get()
            ->map(fn (Membresia $m) => $this->formato($m, $titulos));

        // Publicaciones destacadas hoy, de la que vence más tarde a la que vence primero
        $destacados = $this->destacados($propias->pluck('id')->all());
        $destacadas = $propias->filter(fn ($p) => isset($destacados[$p->id]))
            ->map(fn ($p) => ['id' => $p->id, 'titulo' => $titulos[$p->id], 'estado' => $p->estado] + $destacados[$p->id])
            ->sortByDesc('fecha_fin')->values();

        $planes = collect(PlanMembresia::precios())->map(fn ($precio, $plan) => [
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
            'destacadas' => $destacadas->all(),
            'paquete' => $this->datosPaquete(PaqueteMembresia::vigenteDe($usuario->id), $titulos),
            'paquete_oferta' => [
                'publicaciones' => PaqueteMembresia::PUBLICACIONES,
                'dias' => PaqueteMembresia::DIAS,
                'descuento' => PaqueteMembresia::DESCUENTO,
                'precio' => PaqueteMembresia::precio(),
                'precio_normal' => (int) round((float) (PlanMembresia::precios()['mensual'] ?? 0) * PaqueteMembresia::PUBLICACIONES),
            ],
            'publicaciones' => $propias->count(),
            // Para elegir qué publicaciones van en el paquete (las cerradas no se pueden destacar)
            'mis_publicaciones' => $propias->reject(fn ($p) => in_array($p->estado, ['vendida', 'arrendada'], true))
                ->map(fn ($p) => ['id' => $p->id, 'titulo' => $titulos[$p->id], 'estado' => $p->estado])->values()->all(),
            'planes' => $planes->all(),
            // Últimos intentos de pago, con su resultado (RF-051)
            'pagos' => Pago::where('user_id', $usuario->id)->where('concepto', 'membresia')
                ->latest('id')->take(10)->get()
                ->map(fn (Pago $p) => [
                    'referencia' => $p->referencia,
                    'propiedad_id' => $p->propiedad_id,
                    'plan' => $p->plan === PaqueteMembresia::PLAN
                        ? 'Paquete ' . PaqueteMembresia::PUBLICACIONES . ' publicaciones'
                        : (Membresia::NOMBRES_PLAN[$p->plan] ?? $p->plan),
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
        $datos = $request->validate(['plan' => ['required', Rule::in(array_keys(PlanMembresia::precios()))]]);
        $usuario = $this->inmobiliaria($request);

        $hoy = Carbon::now(self::ZONA)->toDateString();
        $renovacion = Membresia::where('user_id', $usuario->id)->whereNull('propiedad_id')->where('estado', 'activa')
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

    /**
     * POST /propiedades/{id}/destacar  { plan } — membresía para UNA publicación.
     * Con Wompi devuelve "checkout_url"; en modo simulado queda activa de una vez (201).
     */
    public function destacar(Request $request, PagoService $pagos, $id): JsonResponse
    {
        $datos = $request->validate(['plan' => ['required', Rule::in(array_keys(PlanMembresia::precios()))]]);
        $usuario = $this->inmobiliaria($request);
        $propiedad = $this->propiedadPropia($request, $id);

        if (in_array($propiedad->estado, ['vendida', 'arrendada'], true)) {
            throw ValidationException::withMessages(['plan' => 'Esta propiedad ya está cerrada; no se puede destacar.']);
        }

        $renovacion = isset($this->destacados([$propiedad->id])[$propiedad->id]);
        $resultado = $pagos->iniciarMembresia($usuario, $datos['plan'], $propiedad);
        $pago = $resultado['pago'];

        if (! $pagos->simulado()) {
            return response()->json([
                'message' => 'Te llevamos a Wompi para hacer el pago.',
                'checkout_url' => $resultado['url'],
                'referencia' => $pago->referencia,
            ]);
        }

        $destacado = $this->destacados([$propiedad->id])[$propiedad->id];

        return response()->json([
            'message' => $this->tituloPropiedad($propiedad) . ($renovacion ? ': membresía renovada' : ': destacada')
                . ' hasta el ' . Carbon::parse($destacado['fecha_fin'])->format('d/m/Y') . ' (pago simulado).',
            'destacado' => $destacado,
            'checkout_url' => null,
        ], 201);
    }

    /* =================== Paquete de 10 publicaciones =================== */

    /** POST /membresia/paquete — compra el paquete mensual (uno vigente a la vez). */
    public function comprarPaquete(Request $request, PagoService $pagos): JsonResponse
    {
        $usuario = $this->inmobiliaria($request);
        $vigente = PaqueteMembresia::vigenteDe($usuario->id);
        if ($vigente) {
            throw ValidationException::withMessages([
                'paquete' => 'Ya tienes un paquete activo hasta el ' . $vigente->fecha_fin->format('d/m/Y') . '. Podrás comprar otro cuando termine.',
            ]);
        }

        $resultado = $pagos->iniciarMembresia($usuario, PaqueteMembresia::PLAN);
        if (! $pagos->simulado()) {
            return response()->json([
                'message' => 'Te llevamos a Wompi para hacer el pago.',
                'checkout_url' => $resultado['url'],
                'referencia' => $resultado['pago']->referencia,
            ]);
        }

        $paquete = PaqueteMembresia::vigenteDe($usuario->id);

        return response()->json([
            'message' => 'Paquete activo hasta el ' . $paquete->fecha_fin->format('d/m/Y') . ' (pago simulado). Ya puedes elegir tus ' . $paquete->cupos . ' publicaciones.',
            'checkout_url' => null,
        ], 201);
    }

    /** POST /membresia/paquete/publicaciones  { propiedad_id } — usa un cupo del paquete. */
    public function agregarAlPaquete(Request $request): JsonResponse
    {
        $datos = $request->validate(['propiedad_id' => ['required', 'integer']]);
        $usuario = $this->inmobiliaria($request);
        $paquete = $this->paqueteVigente($usuario->id);
        $propiedad = $this->propiedadPropia($request, $datos['propiedad_id']);

        if (in_array($propiedad->estado, ['vendida', 'arrendada'], true)) {
            throw ValidationException::withMessages(['propiedad_id' => 'Esta propiedad ya está cerrada; no se puede destacar.']);
        }
        if ($paquete->membresiasActivas()->where('propiedad_id', $propiedad->id)->exists()) {
            throw ValidationException::withMessages(['propiedad_id' => 'Esta publicación ya está en tu paquete.']);
        }
        if ($paquete->membresiasActivas()->count() >= $paquete->cupos) {
            throw ValidationException::withMessages(['propiedad_id' => 'Ya usaste los ' . $paquete->cupos . ' cupos. Quita una publicación para poner otra.']);
        }

        // forceCreate: propiedad_id y paquete_id no están en el $fillable del modelo (que es de otro módulo)
        Membresia::forceCreate([
            'user_id' => $usuario->id,
            'propiedad_id' => $propiedad->id,
            'paquete_id' => $paquete->id,
            'plan' => 'mensual',                       // las del paquete cuentan como plan mensual en el portal
            'precio' => 0,                             // lo pagado está en el paquete
            'estado' => 'activa',
            'fecha_inicio' => Carbon::now(self::ZONA)->toDateString(),
            'fecha_fin' => $paquete->fecha_fin->toDateString(),
            'referencia_pago' => $paquete->referencia_pago,
        ]);

        $usados = $paquete->membresiasActivas()->count();

        return response()->json([
            'message' => $this->tituloPropiedad($propiedad) . ' agregada al paquete (' . $usados . ' de ' . $paquete->cupos . ').',
        ], 201);
    }

    /** DELETE /membresia/paquete/publicaciones/{propiedad} — libera el cupo para otra publicación. */
    public function quitarDelPaquete(Request $request, $propiedadId): JsonResponse
    {
        $usuario = $this->inmobiliaria($request);
        $paquete = $this->paqueteVigente($usuario->id);
        $propiedad = $this->propiedadPropia($request, $propiedadId);

        $quitadas = $paquete->membresiasActivas()->where('propiedad_id', $propiedad->id)->update(['estado' => 'cancelada']);
        abort_if($quitadas === 0, 404, 'Esa publicación no está en tu paquete.');

        return response()->json(['message' => $this->tituloPropiedad($propiedad) . ' salió del paquete. Tienes un cupo libre.']);
    }

    private function paqueteVigente(int $userId): PaqueteMembresia
    {
        $paquete = PaqueteMembresia::vigenteDe($userId);
        if (! $paquete) {
            throw ValidationException::withMessages(['paquete' => 'No tienes un paquete activo.']);
        }

        return $paquete;
    }

    private function datosPaquete(?PaqueteMembresia $paquete, array $titulos): ?array
    {
        if (! $paquete) {
            return null;
        }
        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $elegidas = $paquete->membresiasActivas()->pluck('propiedad_id')->all();

        return [
            'id' => $paquete->id,
            'cupos' => $paquete->cupos,
            'usados' => count($elegidas),
            'precio' => (float) $paquete->precio,
            'fecha_inicio' => $paquete->fecha_inicio->toDateString(),
            'fecha_fin' => $paquete->fecha_fin->toDateString(),
            'dias_restantes' => (int) $hoy->diffInDays(Carbon::parse($paquete->fecha_fin->toDateString(), self::ZONA)),
            'referencia' => $paquete->referencia_pago,
            'publicaciones' => array_map(fn ($id) => ['id' => $id, 'titulo' => $titulos[$id] ?? 'Publicación'], $elegidas),
        ];
    }

    private function formato(Membresia $m, array $titulos = []): array
    {
        return [
            'id' => $m->id,
            'en_paquete' => $m->paquete_id !== null,
            // null = membresía de toda la cuenta
            'propiedad' => $m->propiedad_id
                ? ['id' => $m->propiedad_id, 'titulo' => $titulos[$m->propiedad_id] ?? 'Propiedad']
                : null,
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
