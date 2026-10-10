<?php

namespace App\Providers;

use App\Models\Membresia;
use App\Models\User;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fechas relativas ("hace 2 horas") en español
        \Illuminate\Support\Carbon::setLocale('es');

        // Datos que el panel de administración muestra en todas sus páginas:
        // contador de usuarios (badge) y actividad reciente real del portal
        // (sin estados de "leído" inventados: lo que se ve son los últimos eventos).
        View::composer(['partials.sidebar', 'partials.navbar'], function ($view) {
            $totalUsuarios = User::whereHas('role', function ($consulta) {
                $consulta->whereIn('nombre', User::ROLES_PANEL);
            })->count();

            // Cuentas esperando verificación (insignia del menú lateral)
            $totalPendientes = User::where('estado', 'pendiente')->count();

            $notificaciones = collect();

            User::with('role')->latest()->take(4)->get()
                ->each(function (User $usuario) use ($notificaciones) {
                    $notificaciones->push([
                        'icono' => 'fa-user-plus',
                        'color' => 'violet',
                        'titulo' => 'Nuevo registro: ' . $usuario->name,
                        'detalle' => 'Rol: ' . ($usuario->role?->nombre ?? 'sin rol'),
                        'fecha' => $usuario->created_at,
                        'url' => route('admin.usuarios.index', ['q' => $usuario->email]),
                    ]);
                });

            Membresia::with('usuario')->latest()->take(4)->get()
                ->each(function (Membresia $membresia) use ($notificaciones) {
                    $notificaciones->push([
                        'icono' => 'fa-credit-card',
                        'color' => 'emerald',
                        'titulo' => 'Pago de membresía ' . (Membresia::NOMBRES_PLAN[$membresia->plan] ?? $membresia->plan),
                        'detalle' => ($membresia->usuario?->name ?? 'Usuario') . ' · $' . number_format((float) $membresia->precio, 0, ',', '.') . ' COP',
                        'fecha' => $membresia->created_at,
                        // El módulo de membresías llega en una fase posterior del SRS
                        'url' => null,
                    ]);
                });

            $notificaciones = $notificaciones->sortByDesc('fecha')->take(5)->values();

            $view->with([
                'totalUsuarios' => $totalUsuarios,
                'totalPendientes' => $totalPendientes,
                'notificaciones' => $notificaciones,
            ]);
        });
    }
}
