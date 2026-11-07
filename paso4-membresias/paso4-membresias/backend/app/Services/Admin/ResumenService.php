<?php

namespace App\Services\Admin;

use App\Models\Membresia;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Calcula las cifras del dashboard del administrador.
 * El controlador solo recibe la petición; la lógica vive aquí.
 */
class ResumenService
{
    private const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    public function datos(): array
    {
        $ahora = Carbon::now();
        $inicioMes = $ahora->copy()->startOfMonth();
        $inicioMesAnterior = $inicioMes->copy()->subMonth();

        // Solo cuentan los roles que usan el panel (no soporte ni invitado)
        $rolesPanel = fn ($consulta) => $consulta->whereIn('nombre', User::ROLES_PANEL);

        // ---------- Usuarios ----------
        $totalUsuarios = User::whereHas('role', $rolesPanel)->count();
        $usuariosEsteMes = User::whereHas('role', $rolesPanel)->where('created_at', '>=', $inicioMes)->count();
        $usuariosMesAnterior = User::whereHas('role', $rolesPanel)
            ->whereBetween('created_at', [$inicioMesAnterior, $inicioMes])->count();

        // ---------- Membresías ----------
        $membresiasActivas = Membresia::where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $ahora->toDateString())->count();
        $membresiasEsteMes = Membresia::where('created_at', '>=', $inicioMes)->count();
        $membresiasMesAnterior = Membresia::whereBetween('created_at', [$inicioMesAnterior, $inicioMes])->count();

        // ---------- Ingresos (todo lo que no fue cancelado) ----------
        $ingresosTotales = (float) Membresia::where('estado', '!=', 'cancelada')->sum('precio');
        $ingresosEsteMes = (float) Membresia::where('estado', '!=', 'cancelada')
            ->where('created_at', '>=', $inicioMes)->sum('precio');
        $ingresosMesAnterior = (float) Membresia::where('estado', '!=', 'cancelada')
            ->whereBetween('created_at', [$inicioMesAnterior, $inicioMes])->sum('precio');

        $pendientes = User::where('estado', 'pendiente')->count();

        return [
            'kpis' => [
                'usuarios' => [
                    'total' => $totalUsuarios,
                    'variacion' => self::porcentajeCambio($usuariosEsteMes, $usuariosMesAnterior),
                ],
                'membresias' => [
                    'total' => $membresiasActivas,
                    'variacion' => self::porcentajeCambio($membresiasEsteMes, $membresiasMesAnterior),
                ],
                'ingresos' => [
                    'total' => $ingresosTotales,
                    'variacion' => self::porcentajeCambio($ingresosEsteMes, $ingresosMesAnterior),
                ],
                'pendientes' => $pendientes,
            ],
            'grafica_registros' => $this->registrosPorMes($ahora),
            'grafica_roles' => $this->distribucionPorRol($rolesPanel),
        ];
    }

    /** Registros de los últimos 12 meses (los meses sin registros cuentan 0). */
    private function registrosPorMes(Carbon $ahora): array
    {
        $inicio12Meses = $ahora->copy()->subMonths(11)->startOfMonth();

        $registrosPorMes = User::selectRaw("to_char(created_at, 'YYYY-MM') as mes, count(*) as total")
            ->where('created_at', '>=', $inicio12Meses)
            ->groupBy('mes')
            ->pluck('total', 'mes');

        $etiquetas = [];
        $valores = [];

        for ($i = 11; $i >= 0; $i--) {
            $mes = $ahora->copy()->subMonths($i);
            $etiquetas[] = self::MESES[$mes->month - 1] . ' ' . $mes->format('y');
            $valores[] = (int) ($registrosPorMes[$mes->format('Y-m')] ?? 0);
        }

        return ['etiquetas' => $etiquetas, 'valores' => $valores];
    }

    /** Cuántos usuarios hay por rol. */
    private function distribucionPorRol(callable $rolesPanel): array
    {
        return User::whereHas('role', $rolesPanel)
            ->selectRaw('role_id, count(*) as total')
            ->groupBy('role_id')
            ->with('role:id,nombre')
            ->get()
            ->map(fn ($fila) => [
                'rol' => ucfirst($fila->role?->nombre ?? 'Sin rol'),
                'total' => (int) $fila->total,
            ])
            ->values()
            ->all();
    }

    /** Cambio porcentual entre el mes actual y el anterior. */
    private static function porcentajeCambio(float|int $actual, float|int $anterior): float
    {
        if ($anterior <= 0) {
            return $actual > 0 ? 100.0 : 0.0;
        }

        return round((($actual - $anterior) / $anterior) * 100, 1);
    }
}