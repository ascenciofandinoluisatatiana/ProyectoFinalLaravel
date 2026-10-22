<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\PlanMembresia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Membresías vistas por el administrador (RF-048, RF-056/057, RF-060).
 *   GET  /membresias                 → cifras, planes y lista paginada
 *   PUT  /membresias/planes/{plan}   → cambiar el precio de un plan
 *   POST /membresias/{id}/cancelar   → cancelar una membresía (ajuste manual)
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
        ]);

        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $limite = $hoy->copy()->addDays(self::DIAS_POR_VENCER);

        $consulta = Membresia::with('usuario.role')->orderByDesc('created_at')->orderByDesc('id');

        if (! empty($filtros['plan'])) {
            $consulta->where('plan', $filtros['plan']);
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
