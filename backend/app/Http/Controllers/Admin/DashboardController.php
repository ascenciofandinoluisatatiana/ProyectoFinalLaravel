<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Membresia;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\View\View;

/**
 * Panel principal: KPIs del portal y gráficas de actividad.
 * Todos los números salen de la base de datos (usuarios y membresías).
 */
class DashboardController extends Controller
{
    /** Nombres cortos de los meses para las gráficas. */
    private const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    public function index(): View
    {
        $ahora = Carbon::now();
        $inicioMes = $ahora->copy()->startOfMonth();
        $inicioMesAnterior = $inicioMes->copy()->subMonth();

        $rolesPanel = fn ($consulta) => $consulta->whereIn('nombre', User::ROLES_PANEL);

        // ---------- KPI: usuarios ----------
        $totalUsuarios = User::whereHas('role', $rolesPanel)->count();
        $usuariosEsteMes = User::whereHas('role', $rolesPanel)->where('created_at', '>=', $inicioMes)->count();
        $usuariosMesAnterior = User::whereHas('role', $rolesPanel)
            ->whereBetween('created_at', [$inicioMesAnterior, $inicioMes])->count();

        // ---------- KPI: membresías activas ----------
        $membresiasActivas = Membresia::where('estado', 'activa')->count();
        $membresiasEsteMes = Membresia::where('created_at', '>=', $inicioMes)->count();
        $membresiasMesAnterior = Membresia::whereBetween('created_at', [$inicioMesAnterior, $inicioMes])->count();

        // ---------- KPI: ingresos (COP) ----------
        $ingresosTotales = (float) Membresia::where('estado', '!=', 'cancelada')->sum('precio');
        $ingresosEsteMes = (float) Membresia::where('estado', '!=', 'cancelada')
            ->where('created_at', '>=', $inicioMes)->sum('precio');
        $ingresosMesAnterior = (float) Membresia::where('estado', '!=', 'cancelada')
            ->whereBetween('created_at', [$inicioMesAnterior, $inicioMes])->sum('precio');

        // ---------- KPI: cuentas por verificar ----------
        $pendientes = User::where('estado', 'pendiente')->count();

        // ---------- Gráfica de línea: registros por mes (últimos 12) ----------
        $inicio12Meses = $ahora->copy()->subMonths(11)->startOfMonth();

        $registrosPorMes = User::selectRaw("to_char(created_at, 'YYYY-MM') as mes, count(*) as total")
            ->where('created_at', '>=', $inicio12Meses)
            ->groupBy('mes')
            ->pluck('total', 'mes');

        $etiquetasRegistros = [];
        $valoresRegistros = [];
        for ($i = 11; $i >= 0; $i--) {
            $mes = $ahora->copy()->subMonths($i);
            $etiquetasRegistros[] = self::MESES[$mes->month - 1] . ' ' . $mes->format('y');
            $valoresRegistros[] = (int) ($registrosPorMes[$mes->format('Y-m')] ?? 0);
        }

        // ---------- Gráfica de dona: distribución por rol ----------
        $distribucionRoles = User::whereHas('role', $rolesPanel)
            ->selectRaw('role_id, count(*) as total')
            ->groupBy('role_id')
            ->with('role:id,nombre')
            ->get()
            ->map(fn ($fila) => [
                'rol' => ucfirst($fila->role?->nombre ?? 'Sin rol'),
                'total' => (int) $fila->total,
            ]);

        return view('admin.dashboard', [
            'kpiUsuarios' => [
                'total' => $totalUsuarios,
                'delta' => self::porcentajeCambio($usuariosEsteMes, $usuariosMesAnterior),
            ],
            'kpiMembresias' => [
                'total' => $membresiasActivas,
                'delta' => self::porcentajeCambio($membresiasEsteMes, $membresiasMesAnterior),
            ],
            'kpiIngresos' => [
                'total' => $ingresosTotales,
                'delta' => self::porcentajeCambio($ingresosEsteMes, $ingresosMesAnterior),
            ],
            'kpiPendientes' => $pendientes,
            'graficaRegistros' => [
                'etiquetas' => $etiquetasRegistros,
                'valores' => $valoresRegistros,
            ],
            'graficaRoles' => $distribucionRoles,
        ]);
    }

    /** Cambio porcentual del mes actual frente al anterior (−100 a +∞). */
    private static function porcentajeCambio(float|int $actual, float|int $anterior): float
    {
        if ($anterior <= 0) {
            return $actual > 0 ? 100.0 : 0.0;
        }

        return round((($actual - $anterior) / $anterior) * 100, 1);
    }
}
