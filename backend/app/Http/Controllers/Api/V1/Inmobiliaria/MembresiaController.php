<?php

namespace App\Http\Controllers\Api\V1\Inmobiliaria;

use App\Models\Membresia;
use App\Models\OfertaPaquete;
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
            // Paquetes comprados y vigentes (puede haber varios a la vez) y los que se pueden comprar
            'paquetes' => PaqueteMembresia::vigentesDe($usuario->id)
                ->map(fn (PaqueteMembresia $p) => $this->datosPaquete($p, $titulos))->values()->all(),
            'ofertas' => $this->ofertas(),
            'publicaciones' => $propias->count(),
            // Para elegir qué publicaciones van en el paquete (las cerradas no se pueden destacar)
            'mis_publicaciones' => $propias->reject(fn ($p) => in_array($p->estado, ['vendida', 'arrendada'], true))
                ->map(fn ($p) => ['id' => $p->id, 'titulo' => $titulos[$p->id], 'estado' => $p->estado])->values()->all(),
            'planes' => $planes->all(),
            // Últimos intentos de pago, con su resultado (RF-051)
            'pagos' => Pago::where('user_id', $usuario->id)->where('concepto', 'membresia')
                ->latest('id')->take(10)->get()
                ->map(fn (Pago $p) => $this->formatoPago($p))->all(),
            'simulado' => app(PagoService::class)->simulado(),
        ]);
    }

    /**
     * GET /membresia/pagos?estado=&desde=&hasta=&propiedad_id=&pagina=
     * Historial de pagos de membresías con filtros y paginación (RF-051, RF-056).
     */
    public function pagos(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'estado' => ['nullable', Rule::in(Pago::ESTADOS)],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'propiedad_id' => ['nullable'],
        ], [
            'hasta.after_or_equal' => 'La fecha final debe ser igual o posterior a la inicial.',
        ]);
        $usuario = $this->inmobiliaria($request);

        $consulta = Pago::where('user_id', $usuario->id)->where('concepto', 'membresia');
        if (! empty($datos['estado'])) {
            $consulta->where('estado', $datos['estado']);
        }
        if (! empty($datos['desde'])) {
            $consulta->where('created_at', '>=', Carbon::parse($datos['desde'], self::ZONA)->startOfDay()->utc());
        }
        if (! empty($datos['hasta'])) {
            $consulta->where('created_at', '<=', Carbon::parse($datos['hasta'], self::ZONA)->endOfDay()->utc());
        }
        if (($datos['propiedad_id'] ?? null) === 'paquetes') {
            $consulta->where('plan', PaqueteMembresia::PLAN);
        } elseif (! empty($datos['propiedad_id'])) {
            $consulta->where('propiedad_id', (int) $datos['propiedad_id']);
        }

        $totalAprobado = (clone $consulta)->where('estado', 'aprobado')->sum('monto_centavos');
        $titulos = Propiedad::where('user_id', $usuario->id)->get(['id', 'tipo', 'barrio', 'ciudad'])
            ->mapWithKeys(fn ($p) => [$p->id => $this->tituloPropiedad($p)])->all();

        return response()->json($this->listado(
            $consulta->latest('id'), $request,
            fn (Pago $p) => $this->formatoPago($p) + ['publicacion' => $p->propiedad_id ? ($titulos[$p->propiedad_id] ?? 'Publicación') : null]
        ) + [
            'total_aprobado' => intdiv((int) $totalAprobado, 100),
            'publicaciones' => collect($titulos)->map(fn ($t, $id) => ['id' => $id, 'titulo' => $t])->values()->all(),
        ]);
    }

    private function formatoPago(Pago $p): array
    {
        return [
            'referencia' => $p->referencia,
            'propiedad_id' => $p->propiedad_id,
            'plan' => $p->plan === PaqueteMembresia::PLAN
                ? 'Paquete ' . (json_decode((string) $p->oferta_datos, true)['nombre'] ?? PaqueteMembresia::PUBLICACIONES . ' publicaciones')
                : (Membresia::NOMBRES_PLAN[$p->plan] ?? $p->plan),
            'monto' => $p->monto,
            'estado' => $p->estado,
            'metodo' => $p->metodo,
            'fecha' => $p->created_at?->toIso8601String(),
        ];
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

    /* =================== Paquetes de publicaciones =================== */

    /** POST /membresia/paquete  { oferta_id } — compra el paquete que el administrador ofrece. */
    public function comprarPaquete(Request $request, PagoService $pagos): JsonResponse
    {
        $datos = $request->validate(['oferta_id' => ['required', 'integer']], [
            'oferta_id.required' => 'Elige un paquete.',
        ]);
        $usuario = $this->inmobiliaria($request);

        $oferta = OfertaPaquete::where('id', $datos['oferta_id'])
            ->where('dirigido_a', 'inmobiliaria')->where('activa', true)->first();
        if (! $oferta) {
            throw ValidationException::withMessages(['oferta_id' => 'Ese paquete ya no está disponible.']);
        }

        $resultado = $pagos->iniciarPaquete($usuario, $oferta);
        if (! $pagos->simulado()) {
            return response()->json([
                'message' => 'Te llevamos a Wompi para hacer el pago.',
                'checkout_url' => $resultado['url'],
                'referencia' => $resultado['pago']->referencia,
            ]);
        }

        $paquete = PaqueteMembresia::where('pago_id', $resultado['pago']->id)->first();

        return response()->json([
            'message' => 'Paquete ' . $oferta->nombre . ' activo hasta el ' . $paquete->fecha_fin->format('d/m/Y')
                . ' (pago simulado). Ya puedes elegir tus ' . $paquete->cupos . ' publicaciones.',
            'checkout_url' => null,
        ], 201);
    }

    /** POST /membresia/paquete/publicaciones  { paquete_id, propiedad_id } — usa un cupo de ese paquete. */
    public function agregarAlPaquete(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'paquete_id' => ['required', 'integer'],
            'propiedad_id' => ['required', 'integer'],
        ], [
            'paquete_id.required' => 'Elige el paquete.',
            'propiedad_id.required' => 'Elige una publicación.',
        ]);
        $usuario = $this->inmobiliaria($request);
        $paquete = $this->paqueteVigente($usuario->id, (int) $datos['paquete_id']);
        $propiedad = $this->propiedadPropia($request, $datos['propiedad_id']);
        $hoy = Carbon::now(self::ZONA)->toDateString();

        if (in_array($propiedad->estado, ['vendida', 'arrendada'], true)) {
            throw ValidationException::withMessages(['propiedad_id' => 'Esta propiedad ya está cerrada; no se puede destacar.']);
        }
        // Una publicación va en un solo paquete a la vez
        $yaEnPaquete = Membresia::where('propiedad_id', $propiedad->id)
            ->whereNotNull('paquete_id')->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)->exists();
        if ($yaEnPaquete) {
            throw ValidationException::withMessages(['propiedad_id' => 'Esta publicación ya está en un paquete vigente.']);
        }
        if ($paquete->membresiasActivas()->count() >= $paquete->cupos) {
            throw ValidationException::withMessages(['propiedad_id' => 'Ya usaste los ' . $paquete->cupos . ' cupos de este paquete. Quita una publicación para poner otra.']);
        }

        // forceCreate: propiedad_id y paquete_id no están en el $fillable del modelo (que es de otro módulo)
        Membresia::forceCreate([
            'user_id' => $usuario->id,
            'propiedad_id' => $propiedad->id,
            'paquete_id' => $paquete->id,
            'plan' => $paquete->planPortal(),          // se posiciona según el plan del paquete
            'precio' => 0,                             // lo pagado está en el paquete
            'estado' => 'activa',
            'fecha_inicio' => $hoy,
            'fecha_fin' => $paquete->fecha_fin->toDateString(),
            'referencia_pago' => $paquete->referencia_pago,
        ]);

        $usados = $paquete->membresiasActivas()->count();

        return response()->json([
            'message' => $this->tituloPropiedad($propiedad) . ' agregada al paquete ' . $paquete->nombreVisible() . ' (' . $usados . ' de ' . $paquete->cupos . ').',
        ], 201);
    }

    /** DELETE /membresia/paquete/publicaciones/{propiedad} — libera el cupo para otra publicación. */
    public function quitarDelPaquete(Request $request, $propiedadId): JsonResponse
    {
        $usuario = $this->inmobiliaria($request);
        $propiedad = $this->propiedadPropia($request, $propiedadId);
        $hoy = Carbon::now(self::ZONA)->toDateString();

        $quitadas = Membresia::where('user_id', $usuario->id)
            ->where('propiedad_id', $propiedad->id)
            ->whereNotNull('paquete_id')->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)
            ->update(['estado' => 'cancelada']);
        abort_if($quitadas === 0, 404, 'Esa publicación no está en ningún paquete.');

        return response()->json(['message' => $this->tituloPropiedad($propiedad) . ' salió del paquete. Tienes un cupo libre.']);
    }

    private function paqueteVigente(int $userId, int $paqueteId): PaqueteMembresia
    {
        $paquete = PaqueteMembresia::vigentesDe($userId)->firstWhere('id', $paqueteId);
        if (! $paquete) {
            throw ValidationException::withMessages(['paquete_id' => 'Ese paquete no está vigente.']);
        }

        return $paquete;
    }

    /** Paquetes que el administrador ofrece hoy a las inmobiliarias. */
    private function ofertas(): array
    {
        $precios = PlanMembresia::precios();

        return OfertaPaquete::where('dirigido_a', 'inmobiliaria')->where('activa', true)
            ->orderBy('id')->get()
            ->map(fn (OfertaPaquete $o) => [
                'id' => $o->id,
                'nombre' => $o->nombre,
                'plan' => $o->plan,
                'nombre_plan' => Membresia::NOMBRES_PLAN[$o->plan] ?? $o->plan,
                'publicaciones' => $o->publicaciones,
                'dias' => $o->dias(),
                'descuento' => $o->descuento,
                'precio' => $o->precio(),
                'precio_normal' => (int) round((float) ($precios[$o->plan] ?? 0) * $o->publicaciones),
            ])->all();
    }

    private function datosPaquete(PaqueteMembresia $paquete, array $titulos): array
    {
        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $elegidas = $paquete->membresiasActivas()->pluck('propiedad_id')->all();

        return [
            'id' => $paquete->id,
            'nombre' => $paquete->nombreVisible(),
            'plan' => $paquete->planPortal(),
            'nombre_plan' => Membresia::NOMBRES_PLAN[$paquete->planPortal()] ?? $paquete->planPortal(),
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
