@extends('layouts.app')

@section('titulo', 'Panel principal')

@section('contenido')
    <div class="mx-auto max-w-7xl space-y-6">

        {{-- Tarjeta de bienvenida --}}
        <div class="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-violet-600/15 via-slate-900 to-slate-900 p-6 sm:p-8">
            <div class="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl"></div>
            <div class="relative flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-violet-400">Panel de administración</p>
                    <h1 class="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Hola, {{ explode(' ', trim(auth()->user()->name))[0] }}</h1>
                    <p class="mt-1.5 max-w-xl text-sm text-slate-400">
                        Este es el estado del portal UMBRAL hoy, {{ now()->isoFormat('dddd D [de] MMMM [de] Y') }}.
                    </p>
                </div>
                <a href="{{ route('admin.usuarios.index') }}?crear=1"
                   class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 active:scale-[0.98]">
                    <i class="fa-solid fa-user-plus"></i>Nuevo usuario
                </a>
            </div>
        </div>

        {{-- Tarjetas de métricas (KPI) --}}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {{-- Usuarios --}}
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold {{ $kpiUsuarios['delta'] >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }}">
                        <i class="fa-solid {{ $kpiUsuarios['delta'] >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down' }}"></i>
                        {{ $kpiUsuarios['delta'] >= 0 ? '+' : '' }}{{ $kpiUsuarios['delta'] }}%
                    </span>
                </div>
                <p class="mt-4 text-3xl font-extrabold tracking-tight text-white">{{ number_format($kpiUsuarios['total']) }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Usuarios del portal</p>
            </div>

            {{-- Membresías activas --}}
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                        <i class="fa-solid fa-credit-card"></i>
                    </div>
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold {{ $kpiMembresias['delta'] >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }}">
                        <i class="fa-solid {{ $kpiMembresias['delta'] >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down' }}"></i>
                        {{ $kpiMembresias['delta'] >= 0 ? '+' : '' }}{{ $kpiMembresias['delta'] }}%
                    </span>
                </div>
                <p class="mt-4 text-3xl font-extrabold tracking-tight text-white">{{ number_format($kpiMembresias['total']) }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Membresías activas</p>
            </div>

            {{-- Ingresos --}}
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                        <i class="fa-solid fa-coins"></i>
                    </div>
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold {{ $kpiIngresos['delta'] >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }}">
                        <i class="fa-solid {{ $kpiIngresos['delta'] >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down' }}"></i>
                        {{ $kpiIngresos['delta'] >= 0 ? '+' : '' }}{{ $kpiIngresos['delta'] }}%
                    </span>
                </div>
                <p class="mt-4 text-3xl font-extrabold tracking-tight text-white">${{ number_format($kpiIngresos['total'], 0, ',', '.') }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Ingresos por membresías (COP)</p>
            </div>

            {{-- Pendientes de verificación --}}
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                        <i class="fa-solid fa-user-clock"></i>
                    </div>
                </div>
                <p class="mt-4 text-3xl font-extrabold tracking-tight text-white">{{ number_format($kpiPendientes) }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Cuentas pendientes de verificación</p>
            </div>
        </div>

        {{-- Gráficas --}}
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-white">Actividad mensual</h3>
                        <p class="text-xs text-slate-500">Nuevos registros de usuarios en los últimos 12 meses</p>
                    </div>
                    <span class="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-400"><i class="fa-regular fa-calendar mr-1"></i>12 meses</span>
                </div>
                <div class="h-72">
                    <canvas id="grafica-registros"></canvas>
                </div>
            </div>

            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div class="mb-4">
                    <h3 class="font-bold text-white">Distribución por rol</h3>
                    <p class="text-xs text-slate-500">Cómo se reparten las cuentas del portal</p>
                </div>
                <div class="h-72">
                    <canvas id="grafica-roles"></canvas>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('scripts')
<script>
    // Colores base de Chart.js para el tema oscuro
    Chart.defaults.color = '#64748b';
    Chart.defaults.borderColor = 'rgba(30, 41, 59, 0.8)';
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

    {{-- Datos que envía el controlador --}}
    var registros = @json($graficaRegistros);
    var roles = @json($graficaRoles);

    // ----- Línea: registros por mes -----
    new Chart(document.getElementById('grafica-registros'), {
        type: 'line',
        data: {
            labels: registros.etiquetas,
            datasets: [{
                label: 'Nuevos usuarios',
                data: registros.valores,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#a78bfa',
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: 3.5,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(30,41,59,0.7)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // ----- Dona: distribución por rol -----
    new Chart(document.getElementById('grafica-roles'), {
        type: 'doughnut',
        data: {
            labels: roles.map(function (r) { return r.rol; }),
            datasets: [{
                data: roles.map(function (r) { return r.total; }),
                backgroundColor: ['#8b5cf6', '#6366f1', '#22c55e', '#f59e0b', '#0ea5e9', '#ec4899'],
                borderColor: '#0f172a',
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } }
            }
        }
    });
</script>
@endpush
