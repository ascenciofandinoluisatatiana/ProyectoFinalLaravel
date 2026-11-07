<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Reportes del administrador (RF-057, RF-100, RF-103, RF-104).
 *   GET /reportes/resumen                 → cifras del portal
 *   GET /reportes/visitas                 → visitas agendadas y usuarios por país
 *   GET /reportes/transacciones           → pagos de membresías (paginado)
 *   GET /reportes/exportar/transacciones  → CSV de pagos
 *   GET /reportes/exportar/inmuebles      → CSV de inmuebles
 *
 * Usa solo las tablas reales del proyecto: users, roles, membresias,
 * propiedades y visitas.
 */
class ReporteController extends Controller
{
    private const ZONA = 'America/Bogota';
    private const DIAS_POR_VENCER = 7;

    /** Lee el rango de fechas del filtro (por defecto: del día 1 del mes a hoy). */
    private function rango(Request $request): array
    {
        $datos = $request->validate([
            'fecha_inicio' => ['nullable', 'date_format:Y-m-d'],
            'fecha_fin' => ['nullable', 'date_format:Y-m-d'],
        ], [
            'fecha_inicio.date_format' => 'La fecha de inicio no es válida.',
            'fecha_fin.date_format' => 'La fecha final no es válida.',
        ]);

        $hoy = Carbon::now(self::ZONA);
        $inicio = $datos['fecha_inicio'] ?? $hoy->copy()->startOfMonth()->toDateString();
        $fin = $datos['fecha_fin'] ?? $hoy->toDateString();

        if ($inicio > $fin) {
            [$inicio, $fin] = [$fin, $inicio];
        }

        return [$inicio . ' 00:00:00', $fin . ' 23:59:59', $inicio, $fin];
    }

    /** GET /reportes/resumen */
    public function resumenGlobal(Request $request): JsonResponse
    {
        [$desdeHora, $hastaHora, $desde, $hasta] = $this->rango($request);

        $hoy = Carbon::now(self::ZONA)->toDateString();
        $limite = Carbon::now(self::ZONA)->addDays(self::DIAS_POR_VENCER)->toDateString();

        // Usuarios por rol
        $usuariosPorRol = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->select('roles.nombre', DB::raw('count(*) as total'))
            ->groupBy('roles.nombre')
            ->pluck('total', 'nombre');

        // Inmuebles por estado
        $propiedades = DB::table('propiedades')
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $totalPropiedades = (int) $propiedades->sum();
        $publicadas = (int) $propiedades->get('publicada', 0);

        // Membresías (mismos criterios que la pantalla de Membresías)
        $activas = DB::table('membresias')
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)
            ->count();

        $porVencer = DB::table('membresias')
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy)
            ->whereDate('fecha_fin', '<=', $limite)
            ->count();

        $vencidas = DB::table('membresias')
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '<', $hoy)
            ->count();

        // Ingresos: membresías pagadas dentro del periodo (COP)
        $pagos = DB::table('membresias')->whereBetween('created_at', [$desdeHora, $hastaHora]);

        $ingresos = (clone $pagos)->sum('precio');

        $porPlan = (clone $pagos)
            ->select('plan', DB::raw('SUM(precio) as total_cop'), DB::raw('count(*) as cantidad'))
            ->groupBy('plan')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'periodo' => ['desde' => $desde, 'hasta' => $hasta],
                'usuarios' => [
                    'administradores' => (int) $usuariosPorRol->get('administrador', 0),
                    'vendedores' => (int) $usuariosPorRol->get('vendedor', 0),
                    'inmobiliarias' => (int) $usuariosPorRol->get('inmobiliaria', 0),
                    'agentes' => (int) $usuariosPorRol->get('agente', 0),
                    'total' => (int) $usuariosPorRol->sum(),
                ],
                'publicaciones' => [
                    'activas' => $publicadas,
                    'otras' => $totalPropiedades - $publicadas,
                    'total' => $totalPropiedades,
                ],
                'membresias' => [
                    'activas' => $activas,
                    'por_vencer' => $porVencer,
                    'vencidas' => $vencidas,
                ],
                'finanzas' => [
                    'moneda' => 'COP',
                    'ingresos_totales' => (float) $ingresos,
                    'desglose_plan' => $porPlan,
                ],
            ],
        ]);
    }

    /** GET /reportes/visitas */
    public function visitasPorPaisEIdioma(Request $request): JsonResponse
    {
        [$desdeHora, $hastaHora] = $this->rango($request);

        // Visitas agendadas a inmuebles, según su estado
        $porEstado = DB::table('visitas')
            ->whereBetween('fecha', [$desdeHora, $hastaHora])
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->orderByDesc('total')
            ->get();

        // Cuentas registradas en el periodo, por país de residencia
        $porPais = DB::table('users')
            ->whereBetween('created_at', [$desdeHora, $hastaHora])
            ->select('pais_residencia', DB::raw('count(*) as total'))
            ->groupBy('pais_residencia')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'por_estado' => $porEstado,
                'por_pais' => $porPais,
            ],
        ]);
    }

    /** GET /reportes/transacciones */
    public function transacciones(Request $request): JsonResponse
    {
        [$desdeHora, $hastaHora] = $this->rango($request);
        $filtros = $this->filtrosPagos($request);

        $consulta = DB::table('membresias')
            ->join('users', 'membresias.user_id', '=', 'users.id')
            ->select(
                'membresias.id',
                'membresias.referencia_pago as referencia',
                'users.name as usuario_nombre',
                'users.email as usuario_email',
                'membresias.plan',
                'membresias.precio as monto',
                'membresias.estado',
                'membresias.created_at'
            )
            ->whereBetween('membresias.created_at', [$desdeHora, $hastaHora]);

        $this->aplicarFiltrosPagos($consulta, $filtros);

        $porPagina = min(max((int) $request->input('per_page', 15), 1), 50);

        $pagina = $consulta
            ->orderByDesc('membresias.created_at')
            ->orderByDesc('membresias.id')
            ->paginate($porPagina);

        // Opciones del selector "Plan": los planes que de verdad existen en los pagos
        $planes = DB::table('membresias')->distinct()->orderBy('plan')->pluck('plan');

        return response()->json(['success' => true, 'data' => $pagina, 'planes' => $planes]);
    }

    /**
     * Filtros de la tabla de pagos (todos opcionales y combinables):
     *   q          → nombre o correo del usuario, referencia de pago o ID del pago
     *   plan       → plan exacto
     *   estado     → estado del pago
     *   monto_min / monto_max → rango del monto en COP
     * La fecha se maneja aparte con fecha_inicio y fecha_fin.
     */
    private function filtrosPagos(Request $request): array
    {
        $filtros = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'plan' => ['nullable', 'string', 'max:40'],
            'estado' => ['nullable', 'string', 'max:20'],
            'monto_min' => ['nullable', 'numeric', 'min:0'],
            'monto_max' => ['nullable', 'numeric', 'min:0'],
        ], [
            'monto_min.numeric' => 'El monto mínimo debe ser un número.',
            'monto_max.numeric' => 'El monto máximo debe ser un número.',
        ]);

        // Si pusieron el mínimo mayor que el máximo, se acomodan solos
        if (isset($filtros['monto_min'], $filtros['monto_max']) && $filtros['monto_min'] > $filtros['monto_max']) {
            [$filtros['monto_min'], $filtros['monto_max']] = [$filtros['monto_max'], $filtros['monto_min']];
        }

        return $filtros;
    }

    private function aplicarFiltrosPagos(Builder $consulta, array $filtros): void
    {
        if (! empty($filtros['q'])) {
            $q = trim($filtros['q']);
            $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';

            $consulta->where(function ($sub) use ($q, $like) {
                $sub->where('users.email', 'ilike', $like)
                    ->orWhere('users.name', 'ilike', $like)
                    ->orWhere('membresias.referencia_pago', 'ilike', $like);

                // Si escribieron solo números, también se busca por el ID del pago
                if (ctype_digit($q) && strlen($q) <= 9) {
                    $sub->orWhere('membresias.id', (int) $q);
                }
            });
        }

        if (! empty($filtros['plan'])) {
            $consulta->where('membresias.plan', $filtros['plan']);
        }

        if (! empty($filtros['estado'])) {
            $consulta->where('membresias.estado', $filtros['estado']);
        }

        if (isset($filtros['monto_min'])) {
            $consulta->where('membresias.precio', '>=', $filtros['monto_min']);
        }

        if (isset($filtros['monto_max'])) {
            $consulta->where('membresias.precio', '<=', $filtros['monto_max']);
        }
    }

    /** GET /reportes/exportar/transacciones — CSV compatible con Excel. */
    public function exportarTransaccionesCsv(Request $request): StreamedResponse
    {
        [$desdeHora, $hastaHora] = $this->rango($request);
        $filtros = $this->filtrosPagos($request);

        $cabeceras = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="reporte_transacciones_umbral_' . date('Ymd_His') . '.csv"',
            'Cache-Control' => 'no-store',
        ];

        return response()->stream(function () use ($desdeHora, $hastaHora, $filtros) {
            $archivo = fopen('php://output', 'w');
            fwrite($archivo, "\xEF\xBB\xBF"); // BOM UTF-8: Excel muestra bien las tildes

            fputcsv($archivo, [
                'ID', 'Referencia de pago', 'Correo del usuario', 'Plan', 'Monto (COP)', 'Estado', 'Fecha de pago',
            ], ';', '"', '\\');

            $consulta = DB::table('membresias')
                ->join('users', 'membresias.user_id', '=', 'users.id')
                ->select(
                    'membresias.id',
                    'membresias.referencia_pago',
                    'users.email',
                    'membresias.plan',
                    'membresias.precio',
                    'membresias.estado',
                    'membresias.created_at'
                )
                ->whereBetween('membresias.created_at', [$desdeHora, $hastaHora]);

            $this->aplicarFiltrosPagos($consulta, $filtros);

            $consulta->orderBy('membresias.id')->chunk(200, function ($filas) use ($archivo) {
                foreach ($filas as $fila) {
                    fputcsv($archivo, [
                        $fila->id,
                        $fila->referencia_pago ?? 'N/A',
                        $fila->email,
                        ucfirst($fila->plan),
                        number_format((float) $fila->precio, 0, ',', '.'),
                        ucfirst($fila->estado),
                        $fila->created_at,
                    ], ';', '"', '\\');
                }
            });

            fclose($archivo);
        }, 200, $cabeceras);
    }

    /** GET /reportes/exportar/inmuebles — CSV de todos los inmuebles. */
    public function exportarPublicacionesCsv(Request $request): StreamedResponse
    {
        $cabeceras = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="reporte_inmuebles_umbral_' . date('Ymd_His') . '.csv"',
            'Cache-Control' => 'no-store',
        ];

        return response()->stream(function () {
            $archivo = fopen('php://output', 'w');
            fwrite($archivo, "\xEF\xBB\xBF");

            fputcsv($archivo, [
                'ID', 'Tipo', 'Operación', 'Precio (COP)', 'Estado', 'Verificada', 'Departamento', 'Ciudad', 'Fecha de creación',
            ], ';', '"', '\\');

            DB::table('propiedades')
                ->select('id', 'tipo', 'operacion', 'precio', 'estado', 'verificada', 'departamento', 'ciudad', 'created_at')
                ->orderBy('id')
                ->chunk(200, function ($filas) use ($archivo) {
                    foreach ($filas as $fila) {
                        fputcsv($archivo, [
                            $fila->id,
                            ucfirst($fila->tipo),
                            ucfirst($fila->operacion),
                            number_format((float) $fila->precio, 0, ',', '.'),
                            ucfirst($fila->estado),
                            $fila->verificada ? 'Sí' : 'No',
                            $fila->departamento,
                            $fila->ciudad,
                            $fila->created_at,
                        ], ';', '"', '\\');
                    }
                });

            fclose($archivo);
        }, 200, $cabeceras);
    }
}