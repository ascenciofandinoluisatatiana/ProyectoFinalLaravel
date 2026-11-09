<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\OfertaPaquete;
use App\Models\OfertaVendedor;
use App\Models\PlanMembresia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Membresías vistas por el administrador (RF-048, RF-056/057, RF-060).
 *   GET  /membresias                 → cifras, planes y lista paginada
 *   PUT  /membresias/planes/{plan}   → cambiar el precio de un plan
 *   POST /membresias/{id}/cancelar   → cancelar una membresía (ajuste manual)
 *   GET    /membresias/paquetes      → paquetes que se ofrecen a las inmobiliarias
 *   POST   /membresias/paquetes      → crear un paquete
 *   PUT    /membresias/paquetes/{id} → editar o activar/desactivar un paquete
 *   DELETE /membresias/paquetes/{id} → borrar un paquete
 *   GET    /membresias/vendedor      → paquetes (planes) que se ofrecen a los vendedores
 *   POST   /membresias/vendedor      → crear un paquete de vendedor
 *   PUT    /membresias/vendedor/{id} → editar o activar/desactivar
 *   DELETE /membresias/vendedor/{id} → borrar
 */
class MembresiaController extends Controller
{
    private const ZONA = 'America/Bogota';
    private const DIAS_POR_VENCER = 7;
    private const POR_PAGINA = 10;

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'in:vigente,por_vencer,vencida,cancelada'],
            'plan' => ['nullable', 'in:semanal,quincenal,mensual'],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
            'monto_min' => ['nullable', 'numeric', 'min:0'],
            'monto_max' => ['nullable', 'numeric', 'min:0'],
        ]);

        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $limite = $hoy->copy()->addDays(self::DIAS_POR_VENCER);

        $consulta = Membresia::with('usuario.role')->orderByDesc('created_at')->orderByDesc('id');

        if (! empty($filtros['plan'])) {
            $consulta->where('plan', $filtros['plan']);
        }

        // Si las fechas vienen al revés, se invierten
        if (! empty($filtros['desde']) && ! empty($filtros['hasta']) && $filtros['desde'] > $filtros['hasta']) {
            [$filtros['desde'], $filtros['hasta']] = [$filtros['hasta'], $filtros['desde']];
        }

        // Fecha del pago (día completo, en hora de Colombia)
        if (! empty($filtros['desde'])) {
            $consulta->where('created_at', '>=',
                Carbon::parse($filtros['desde'], self::ZONA)->startOfDay()->setTimezone(config('app.timezone')));
        }
        if (! empty($filtros['hasta'])) {
            $consulta->where('created_at', '<=',
                Carbon::parse($filtros['hasta'], self::ZONA)->endOfDay()->setTimezone(config('app.timezone')));
        }

        // Monto pagado
        if (isset($filtros['monto_min'])) {
            $consulta->where('precio', '>=', $filtros['monto_min']);
        }
        if (isset($filtros['monto_max'])) {
            $consulta->where('precio', '<=', $filtros['monto_max']);
        }

        match ($filtros['estado'] ?? null) {
            'vigente' => $consulta->where('estado', 'activa')->whereDate('fecha_fin', '>=', $hoy->toDateString()),
            'por_vencer' => $consulta->where('estado', 'activa')
                ->whereDate('fecha_fin', '>=', $hoy->toDateString())
                ->whereDate('fecha_fin', '<=', $limite->toDateString()),
            'vencida' => $consulta->where('estado', 'activa')->whereDate('fecha_fin', '<', $hoy->toDateString()),
            'cancelada' => $consulta->where('estado', 'cancelada'),
            default => null,
        };

        if (! empty($filtros['q'])) {
            $texto = '%' . mb_strtolower($filtros['q']) . '%';
            $consulta->whereHas('usuario', fn ($u) => $u
                ->whereRaw('LOWER(name) LIKE ?', [$texto])
                ->orWhereRaw('LOWER(email) LIKE ?', [$texto]));
        }

        $pagina = $consulta->paginate(self::POR_PAGINA)
            ->through(fn (Membresia $m) => $this->formato($m, $hoy));

        return response()->json([
            'resumen' => $this->resumen($hoy, $limite),
            'planes' => $this->planes(),
            'datos' => $pagina->items(),
            'total' => $pagina->total(),
            'desde' => $pagina->firstItem() ?? 0,
            'hasta' => $pagina->lastItem() ?? 0,
            'pagina_actual' => $pagina->currentPage(),
            'ultima_pagina' => $pagina->lastPage(),
        ]);
    }

    /** PUT /membresias/planes/{plan} { precio } — el cambio no afecta pagos ya hechos (RF-058). */
    public function actualizarPlan(Request $request, string $plan): JsonResponse
    {
        $datos = $request->validate([
            'precio' => ['required', 'numeric', 'min:1000', 'max:100000000'],
        ], [
            'precio.required' => 'Escribe el precio del plan.',
            'precio.numeric' => 'El precio debe ser un número.',
            'precio.min' => 'El precio mínimo es $1.000 COP.',
            'precio.max' => 'El precio es demasiado alto.',
        ]);

        $registro = PlanMembresia::where('plan', $plan)->firstOrFail();
        $anterior = (float) $registro->precio;

        $registro->precio = round((float) $datos['precio']);
        $registro->save();

        Log::info('Precio de plan de membresía modificado', [
            'admin_id' => $request->user()->id,
            'plan' => $plan,
            'anterior' => $anterior,
            'nuevo' => (float) $registro->precio,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'mensaje' => 'Precio del plan ' . $registro->nombre . ' actualizado.',
            'planes' => $this->planes(),
        ]);
    }

    /** POST /membresias/{membresia}/cancelar */
    public function cancelar(Request $request, Membresia $membresia): JsonResponse
    {
        if ($membresia->estado !== 'activa') {
            return response()->json(['message' => 'Esta membresía ya no está activa.'], 422);
        }

        $membresia->estado = 'cancelada';
        $membresia->save();

        Log::info('Membresía cancelada por el administrador', [
            'admin_id' => $request->user()->id,
            'membresia_id' => $membresia->id,
            'usuario_id' => $membresia->user_id,
            'ip' => $request->ip(),
        ]);

        return response()->json(['mensaje' => 'Membresía cancelada.']);
    }

    /* ---------------------------------------------------------- */
    /* Paquetes de publicaciones para inmobiliarias                */
    /* ---------------------------------------------------------- */

    /** GET /membresias/paquetes */
    public function paquetes(): JsonResponse
    {
        return response()->json(['datos' => $this->listaPaquetes()]);
    }

    /** POST /membresias/paquetes { nombre, plan, publicaciones, descuento } */
    public function crearPaquete(Request $request): JsonResponse
    {
        $datos = $this->validarPaquete($request);

        $oferta = OfertaPaquete::create($datos + ['dirigido_a' => 'inmobiliaria', 'activa' => true]);

        Log::info('Paquete de membresía creado', [
            'admin_id' => $request->user()->id,
            'paquete_id' => $oferta->id,
            'nombre' => $oferta->nombre,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'mensaje' => 'Paquete «' . $oferta->nombre . '» creado.',
            'datos' => $this->listaPaquetes(),
        ], 201);
    }

    /** PUT /membresias/paquetes/{id} — edita los datos o, si solo llega "activa", lo activa/desactiva. */
    public function actualizarPaquete(Request $request, int $id): JsonResponse
    {
        $oferta = OfertaPaquete::findOrFail($id);

        if ($request->has('activa') && ! $request->has('nombre')) {
            $activa = $request->validate(['activa' => ['required', 'boolean']])['activa'];
            $oferta->activa = (bool) $activa;
            $oferta->save();
            $mensaje = 'Paquete «' . $oferta->nombre . '» ' . ($oferta->activa ? 'activado.' : 'desactivado.');
        } else {
            $oferta->fill($this->validarPaquete($request, $oferta->id))->save();
            $mensaje = 'Paquete «' . $oferta->nombre . '» actualizado.';
        }

        Log::info('Paquete de membresía modificado', [
            'admin_id' => $request->user()->id,
            'paquete_id' => $oferta->id,
            'ip' => $request->ip(),
        ]);

        return response()->json(['mensaje' => $mensaje, 'datos' => $this->listaPaquetes()]);
    }

    /** DELETE /membresias/paquetes/{id} */
    public function eliminarPaquete(Request $request, int $id): JsonResponse
    {
        $oferta = OfertaPaquete::findOrFail($id);
        $nombre = $oferta->nombre;
        $oferta->delete();

        Log::info('Paquete de membresía eliminado', [
            'admin_id' => $request->user()->id,
            'paquete_id' => $id,
            'nombre' => $nombre,
            'ip' => $request->ip(),
        ]);

        return response()->json(['mensaje' => 'Paquete «' . $nombre . '» eliminado.', 'datos' => $this->listaPaquetes()]);
    }

    private function validarPaquete(Request $request, ?int $ignorar = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:60', Rule::unique('ofertas_paquete', 'nombre')->ignore($ignorar)],
            'plan' => ['required', 'in:semanal,quincenal,mensual'],
            'publicaciones' => ['required', 'integer', 'min:1', 'max:100'],
            'descuento' => ['required', 'integer', 'min:0', 'max:90'],
        ], [
            'nombre.required' => 'Escribe el nombre del paquete.',
            'nombre.max' => 'El nombre es muy largo (máximo 60 letras).',
            'nombre.unique' => 'Ya existe un paquete con ese nombre.',
            'plan.required' => 'Elige el plan.',
            'plan.in' => 'El plan no es válido.',
            'publicaciones.required' => 'Escribe cuántas publicaciones incluye.',
            'publicaciones.integer' => 'Las publicaciones deben ser un número entero.',
            'publicaciones.min' => 'Debe incluir al menos 1 publicación.',
            'publicaciones.max' => 'El máximo es 100 publicaciones.',
            'descuento.required' => 'Escribe el descuento (0 si no tiene).',
            'descuento.integer' => 'El descuento debe ser un número entero.',
            'descuento.min' => 'El descuento no puede ser negativo.',
            'descuento.max' => 'El descuento máximo es 90 %.',
        ]);
    }

    private function listaPaquetes(): array
    {
        return OfertaPaquete::orderBy('id')->get()->map(fn (OfertaPaquete $o) => [
            'id' => $o->id,
            'nombre' => $o->nombre,
            'plan' => $o->plan,
            'nombre_plan' => Membresia::NOMBRES_PLAN[$o->plan] ?? $o->plan,
            'publicaciones' => $o->publicaciones,
            'descuento' => $o->descuento,
            'dias' => $o->dias(),
            'precio' => $o->precio(),
            'activa' => $o->activa,
        ])->all();
    }

    /* ---------------------------------------------------------- */
    /* Paquetes (planes) para vendedores                           */
    /* ---------------------------------------------------------- */

    /** GET /membresias/vendedor */
    public function vendedores(): JsonResponse
    {
        return response()->json(['datos' => $this->listaVendedor()]);
    }

    /** POST /membresias/vendedor { nombre, dias, precio, propiedades } */
    public function crearVendedor(Request $request): JsonResponse
    {
        $datos = $this->validarVendedor($request);

        $oferta = OfertaVendedor::create($datos + ['activa' => true]);

        Log::info('Paquete de vendedor creado', [
            'admin_id' => $request->user()->id,
            'paquete_id' => $oferta->id,
            'nombre' => $oferta->nombre,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'mensaje' => 'Paquete «' . $oferta->nombre . '» creado.',
            'datos' => $this->listaVendedor(),
        ], 201);
    }

    /** PUT /membresias/vendedor/{id} — edita los datos o, si solo llega "activa", lo activa/desactiva. */
    public function actualizarVendedor(Request $request, int $id): JsonResponse
    {
        $oferta = OfertaVendedor::findOrFail($id);

        if ($request->has('activa') && ! $request->has('nombre')) {
            $activa = $request->validate(['activa' => ['required', 'boolean']])['activa'];
            $oferta->activa = (bool) $activa;
            $oferta->save();
            $mensaje = 'Paquete «' . $oferta->nombre . '» ' . ($oferta->activa ? 'activado.' : 'desactivado.');
        } else {
            $datos = $this->validarVendedor($request, $oferta->id);

            // Los 3 planes de origen conservan sus días y propiedades
            if ($oferta->esBase()) {
                unset($datos['dias'], $datos['propiedades']);
            }

            $oferta->fill($datos)->save();

            // Mientras el resto del sistema lea planes_membresia, su precio se mantiene al día
            if ($oferta->esBase()) {
                PlanMembresia::where('plan', $oferta->plan_base)->update(['precio' => $oferta->precio]);
            }

            $mensaje = 'Paquete «' . $oferta->nombre . '» actualizado.';
        }

        Log::info('Paquete de vendedor modificado', [
            'admin_id' => $request->user()->id,
            'paquete_id' => $oferta->id,
            'precio' => $oferta->precio,
            'ip' => $request->ip(),
        ]);

        return response()->json(['mensaje' => $mensaje, 'datos' => $this->listaVendedor()]);
    }

    /** DELETE /membresias/vendedor/{id} */
    public function eliminarVendedor(Request $request, int $id): JsonResponse
    {
        $oferta = OfertaVendedor::findOrFail($id);
        $nombre = $oferta->nombre;
        $oferta->delete();

        Log::info('Paquete de vendedor eliminado', [
            'admin_id' => $request->user()->id,
            'paquete_id' => $id,
            'nombre' => $nombre,
            'ip' => $request->ip(),
        ]);

        return response()->json(['mensaje' => 'Paquete «' . $nombre . '» eliminado.', 'datos' => $this->listaVendedor()]);
    }

    private function validarVendedor(Request $request, ?int $ignorar = null): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:60', Rule::unique('ofertas_vendedor', 'nombre')->ignore($ignorar)],
            'dias' => ['required', 'integer', 'min:1', 'max:365'],
            'precio' => ['required', 'integer', 'min:1000', 'max:100000000'],
            'propiedades' => ['required', 'integer', 'min:1', 'max:100'],
        ], [
            'nombre.required' => 'Escribe el nombre del paquete.',
            'nombre.max' => 'El nombre es muy largo (máximo 60 letras).',
            'nombre.unique' => 'Ya existe un paquete con ese nombre.',
            'dias.required' => 'Escribe cuántos días dura.',
            'dias.integer' => 'Los días deben ser un número entero.',
            'dias.min' => 'Debe durar al menos 1 día.',
            'dias.max' => 'El máximo es 365 días.',
            'precio.required' => 'Escribe el precio.',
            'precio.integer' => 'El precio debe ser un número entero.',
            'precio.min' => 'El precio mínimo es $1.000 COP.',
            'precio.max' => 'El precio es demasiado alto.',
            'propiedades.required' => 'Escribe cuántas propiedades incluye.',
            'propiedades.integer' => 'Las propiedades deben ser un número entero.',
            'propiedades.min' => 'Debe incluir al menos 1 propiedad.',
            'propiedades.max' => 'El máximo es 100 propiedades.',
        ]);
    }

    private function listaVendedor(): array
    {
        return OfertaVendedor::orderBy('dias')->orderBy('id')->get()->map(fn (OfertaVendedor $o) => [
            'id' => $o->id,
            'nombre' => $o->nombre,
            'dias' => $o->dias,
            'precio' => $o->precio,
            'propiedades' => $o->propiedades,
            'base' => $o->esBase(),
            'activa' => $o->activa,
        ])->all();
    }

    /* ---------------------------------------------------------- */

    private function planes(): array
    {
        return PlanMembresia::orderBy('dias')->get()->map(fn (PlanMembresia $p) => [
            'plan' => $p->plan,
            'nombre' => $p->nombre,
            'dias' => $p->dias,
            'precio' => (float) $p->precio,
            'activas' => Membresia::where('plan', $p->plan)->where('estado', 'activa')
                ->whereDate('fecha_fin', '>=', Carbon::now(self::ZONA)->toDateString())->count(),
        ])->all();
    }

    /** Cuentas (no filas) con membresía vigente, por vencer o vencida, e ingresos. */
    private function resumen(Carbon $hoy, Carbon $limite): array
    {
        $hoyTxt = $hoy->toDateString();
        $limiteTxt = $limite->toDateString();

        $conVigente = Membresia::where('estado', 'activa')->whereDate('fecha_fin', '>=', $hoyTxt)->select('user_id');
        $conLargaVigencia = Membresia::where('estado', 'activa')->whereDate('fecha_fin', '>', $limiteTxt)->select('user_id');

        $vigentes = Membresia::where('estado', 'activa')->whereDate('fecha_fin', '>=', $hoyTxt)
            ->distinct()->count('user_id');

        $porVencer = Membresia::where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoyTxt)->whereDate('fecha_fin', '<=', $limiteTxt)
            ->whereNotIn('user_id', $conLargaVigencia)
            ->distinct()->count('user_id');

        $vencidas = Membresia::where('estado', 'activa')->whereDate('fecha_fin', '<', $hoyTxt)
            ->whereNotIn('user_id', $conVigente)
            ->distinct()->count('user_id');

        $inicioMes = $hoy->copy()->startOfMonth();

        return [
            'vigentes' => $vigentes,
            'por_vencer' => $porVencer,
            'vencidas' => $vencidas,
            'ingresos_mes' => (float) Membresia::where('estado', '!=', 'cancelada')
                ->where('created_at', '>=', $inicioMes)->sum('precio'),
            'ingresos_total' => (float) Membresia::where('estado', '!=', 'cancelada')->sum('precio'),
        ];
    }

    private function formato(Membresia $m, Carbon $hoy): array
    {
        $fin = Carbon::parse($m->fecha_fin->toDateString(), self::ZONA)->startOfDay();
        $dias = (int) $hoy->diffInDays($fin, false);

        $estado = match (true) {
            $m->estado === 'cancelada' => 'cancelada',
            $dias < 0 => 'vencida',
            $dias <= self::DIAS_POR_VENCER => 'por_vencer',
            default => 'vigente',
        };

        return [
            'id' => $m->id,
            'usuario' => $m->usuario?->name ?? 'Usuario eliminado',
            'correo' => $m->usuario?->email,
            'rol' => $m->usuario?->role?->nombre,
            'plan' => $m->plan,
            'nombre_plan' => Membresia::NOMBRES_PLAN[$m->plan] ?? $m->plan,
            'precio' => (float) $m->precio,
            'estado' => $estado,
            'dias_restantes' => $dias,
            'fecha_inicio' => $m->fecha_inicio->toDateString(),
            'fecha_fin' => $m->fecha_fin->toDateString(),
            'referencia' => $m->referencia_pago,
            'creada' => optional($m->created_at)->toIso8601String(),
        ];
    }
}
