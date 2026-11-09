<?php

namespace App\Http\Controllers\Api\V1\Vendedor;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\OfertaVendedor;
use App\Models\Pago;
use App\Models\PaqueteMembresia;
use App\Models\PlanMembresia;
use App\Models\Propiedad;
use App\Services\Pagos\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Membresía del vendedor: paquetes que crea el administrador (ofertas_vendedor).
 *
 * Publicar es gratis y deja el inmueble en la zona normal de la búsqueda.
 * Al comprar un paquete, las propiedades que el vendedor ponga en él suben a la zona del
 * paquete (Oro = mensual, Plata = quincenal, Bronce = semanal) mientras esté vigente.
 * Un paquete puede incluir varias propiedades ("cupos"), igual que los de inmobiliaria.
 *
 *   GET    /vendedor/membresia                          → paquetes a la venta, los comprados, vigentes por inmueble y pagos
 *   POST   /vendedor/membresia                          → { oferta_id, propiedad_id } compra un paquete y pone esa propiedad
 *   POST   /vendedor/membresia/paquete/publicaciones    → { paquete_id, propiedad_id } usa otro cupo del paquete
 *   DELETE /vendedor/membresia/paquete/publicaciones/{propiedad} → libera el cupo
 */
class MembresiaController extends Controller
{
    private const ZONA = 'America/Bogota';

    /** Un inmueble vendido o arrendado ya salió del portal: no tiene sentido posicionarlo. */
    private const ESTADOS_POSICIONABLES = ['borrador', 'publicada', 'pausada'];

    public function show(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $propias = Propiedad::where('user_id', $usuario->id)->get();
        $titulos = $propias->mapWithKeys(fn ($p) => [$p->id => $this->titulo($p)])->all();

        $planes = collect(PlanMembresia::precios())->map(fn ($precio, $plan) => [
            'plan' => $plan,
            'nombre' => Membresia::NOMBRES_PLAN[$plan],
            'precio' => $precio,
            'dias' => ['semanal' => 7, 'quincenal' => 15, 'mensual' => 30][$plan] ?? null,
        ])->values();

        return response()->json([
            'planes' => $planes->all(),
            'ofertas' => $this->ofertas(),
            'paquetes' => PaqueteMembresia::vigentesDe($usuario->id)
                ->map(fn (PaqueteMembresia $p) => $this->datosPaquete($p, $titulos))->values()->all(),
            'mis_publicaciones' => $propias->filter(fn ($p) => in_array($p->estado, self::ESTADOS_POSICIONABLES, true))
                ->map(fn ($p) => ['id' => $p->id, 'titulo' => $titulos[$p->id], 'estado' => $p->estado])->values()->all(),
            'vigentes' => self::vigentesPorPropiedad($usuario->id)
                ->map(fn (Membresia $m) => self::formato($m))->values()->all(),
            'pagos' => Pago::where('user_id', $usuario->id)->where('concepto', 'membresia')
                ->latest('id')->take(10)->get()
                ->map(fn (Pago $p) => [
                    'referencia' => $p->referencia,
                    'plan' => $p->plan === PaqueteMembresia::PLAN
                        ? 'Paquete ' . (json_decode((string) $p->oferta_datos, true)['nombre'] ?? '')
                        : (Membresia::NOMBRES_PLAN[$p->plan] ?? $p->plan),
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
     * Compra un paquete y pone en él la propiedad elegida.
     * Con Wompi responde 200 con "checkout_url" (el frontend lleva a la persona a pagar).
     * En modo simulado responde 201 con el paquete ya activo.
     */
    public function contratar(Request $request, PagoService $pagos): JsonResponse
    {
        $datos = $request->validate([
            'oferta_id' => ['required', 'integer'],
            'propiedad_id' => ['required', 'integer'],
        ], [
            'oferta_id.required' => 'Elige un paquete.',
            'propiedad_id.required' => 'Elige el inmueble que quieres posicionar.',
        ]);
        $usuario = $request->user();

        $oferta = OfertaVendedor::where('activa', true)->find($datos['oferta_id']);
        if (! $oferta) {
            throw ValidationException::withMessages(['oferta_id' => 'Ese paquete ya no está disponible.']);
        }

        // Solo se puede pagar por un inmueble propio (de otro vendedor responde 404)
        $propiedad = Propiedad::where('user_id', $usuario->id)->findOrFail($datos['propiedad_id']);
        $this->validarPosicionable($usuario->id, $propiedad);

        $resultado = $pagos->iniciarPaqueteVendedor($usuario, $oferta, $propiedad);

        if (! $pagos->simulado()) {
            return response()->json([
                'message' => 'Te llevamos a Wompi para hacer el pago.',
                'checkout_url' => $resultado['url'],
                'referencia' => $resultado['pago']->referencia,
            ]);
        }

        $paquete = PaqueteMembresia::where('pago_id', $resultado['pago']->id)->first();
        $libres = $paquete->cupos - $paquete->membresiasActivas()->count();

        return response()->json([
            'message' => 'Paquete ' . $oferta->nombre . ' activo hasta el ' . $paquete->fecha_fin->format('d/m/Y')
                . ' (pago simulado). ' . $this->titulo($propiedad) . ' ya está posicionado.'
                . ($libres > 0 ? ' Te quedan ' . $libres . ($libres === 1 ? ' cupo' : ' cupos') . ' para otros inmuebles.' : ''),
            'checkout_url' => null,
        ], 201);
    }

    /** Usa otro cupo de un paquete ya comprado. */
    public function agregar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'paquete_id' => ['required', 'integer'],
            'propiedad_id' => ['required', 'integer'],
        ], [
            'paquete_id.required' => 'Elige el paquete.',
            'propiedad_id.required' => 'Elige un inmueble.',
        ]);
        $usuario = $request->user();

        $paquete = PaqueteMembresia::vigentesDe($usuario->id)->firstWhere('id', (int) $datos['paquete_id']);
        if (! $paquete) {
            throw ValidationException::withMessages(['paquete_id' => 'Ese paquete no está vigente.']);
        }
        $propiedad = Propiedad::where('user_id', $usuario->id)->findOrFail($datos['propiedad_id']);
        $this->validarPosicionable($usuario->id, $propiedad);

        if ($paquete->membresiasActivas()->count() >= $paquete->cupos) {
            throw ValidationException::withMessages(['propiedad_id' => 'Ya usaste los ' . $paquete->cupos . ' cupos de este paquete. Quita un inmueble para poner otro.']);
        }

        $paquete->asignarPropiedad($propiedad->id);

        return response()->json([
            'message' => $this->titulo($propiedad) . ' agregado al paquete ' . $paquete->nombreVisible()
                . ' (' . $paquete->membresiasActivas()->count() . ' de ' . $paquete->cupos . ').',
        ], 201);
    }

    /** Libera el cupo de un inmueble para poner otro. */
    public function quitar(Request $request, $propiedadId): JsonResponse
    {
        $usuario = $request->user();
        $propiedad = Propiedad::where('user_id', $usuario->id)->findOrFail($propiedadId);
        $hoy = Carbon::now(self::ZONA)->toDateString();

        $quitadas = Membresia::where('user_id', $usuario->id)
            ->where('propiedad_id', $propiedad->id)
            ->whereNotNull('paquete_id')->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)
            ->update(['estado' => 'cancelada']);
        abort_if($quitadas === 0, 404, 'Ese inmueble no está en ningún paquete.');

        return response()->json(['message' => $this->titulo($propiedad) . ' salió del paquete. Tienes un cupo libre.']);
    }

    /** El inmueble debe seguir en el portal y no estar posicionado ya. */
    private function validarPosicionable(int $userId, Propiedad $propiedad): void
    {
        if (! in_array($propiedad->estado, self::ESTADOS_POSICIONABLES, true)) {
            throw ValidationException::withMessages([
                'propiedad_id' => 'Este inmueble ya salió del portal; no se puede posicionar.',
            ]);
        }

        $vigente = self::vigentesPorPropiedad($userId)->get($propiedad->id);
        if ($vigente) {
            throw ValidationException::withMessages([
                'propiedad_id' => 'Este inmueble ya está posicionado hasta el ' . $vigente->fecha_fin->format('d/m/Y') . '.',
            ]);
        }
    }

    /** Paquetes que el administrador ofrece hoy a los vendedores. */
    private function ofertas(): array
    {
        return OfertaVendedor::where('activa', true)->orderBy('dias')->orderBy('id')->get()
            ->map(fn (OfertaVendedor $o) => [
                'id' => $o->id,
                'nombre' => $o->nombre,
                'dias' => $o->dias,
                'precio' => $o->precio,
                'propiedades' => $o->propiedades,
                'zona' => $o->zona,
                'nombre_zona' => $o->nombreZona(),
            ])->all();
    }

    private function datosPaquete(PaqueteMembresia $paquete, array $titulos): array
    {
        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $elegidas = $paquete->membresiasActivas()->pluck('propiedad_id')->all();

        return [
            'id' => $paquete->id,
            'nombre' => $paquete->nombreVisible(),
            'zona' => $paquete->planPortal(),
            'nombre_zona' => OfertaVendedor::ZONAS[$paquete->planPortal()] ?? null,
            'cupos' => $paquete->cupos,
            'usados' => count($elegidas),
            'precio' => (float) $paquete->precio,
            'fecha_fin' => $paquete->fecha_fin->toDateString(),
            'dias_restantes' => max(0, (int) $hoy->diffInDays(Carbon::parse($paquete->fecha_fin->toDateString(), self::ZONA)->startOfDay())),
            'publicaciones' => array_map(fn ($id) => ['id' => $id, 'titulo' => $titulos[$id] ?? 'Inmueble'], $elegidas),
        ];
    }

    private function titulo(Propiedad $p): string
    {
        return ucfirst((string) $p->tipo) . ' en ' . $p->barrio;
    }

    /** La membresía vigente de cada inmueble (la que vence más tarde), indexada por propiedad_id. */
    public static function vigentesPorPropiedad(int $userId)
    {
        $vigentes = Membresia::where('user_id', $userId)
            ->whereNotNull('propiedad_id')
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', Carbon::now(self::ZONA)->toDateString())
            ->orderByDesc('fecha_fin')
            ->get()
            ->unique('propiedad_id')
            ->keyBy('propiedad_id');

        // Nombre del paquete al que pertenece cada una (para mostrarlo en la tarjeta del inmueble)
        $nombres = PaqueteMembresia::whereIn('id', $vigentes->pluck('paquete_id')->filter()->all())->pluck('nombre', 'id');
        $vigentes->each(fn (Membresia $m) => $m->setAttribute('nombre_paquete', $m->paquete_id ? ($nombres[$m->paquete_id] ?? 'Paquete') : null));

        return $vigentes;
    }

    public static function formato(Membresia $m): array
    {
        $hoy = Carbon::now(self::ZONA)->startOfDay();

        return [
            'id' => $m->id,
            'propiedad_id' => $m->propiedad_id,
            'plan' => $m->plan,
            'nombre_plan' => $m->getAttribute('nombre_paquete') ?: (Membresia::NOMBRES_PLAN[$m->plan] ?? $m->plan),
            'en_paquete' => $m->paquete_id !== null,
            'paquete_id' => $m->paquete_id,
            'zona' => OfertaVendedor::ZONAS[$m->plan] ?? null,
            'precio' => (float) $m->precio,
            'estado' => $m->estado,
            'fecha_inicio' => $m->fecha_inicio->toDateString(),
            'fecha_fin' => $m->fecha_fin->toDateString(),
            'dias_restantes' => max(0, (int) $hoy->diffInDays(Carbon::parse($m->fecha_fin->toDateString(), self::ZONA)->startOfDay())),
            'referencia' => $m->referencia_pago,
        ];
    }
}
