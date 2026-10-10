@extends('layouts.app')

@section('titulo', 'Panel principal')

@section('contenido')
    <div class="mx-auto max-w-7xl space-y-6">

        {{-- Tarjeta de bienvenida --}}
        <div class="hero-admin relative overflow-hidden rounded-2xl border border-slate-800 p-6 sm:p-8">
            <span class="hero-blob hero-blob-1"></span>
            <span class="hero-blob hero-blob-2"></span>
            <span class="hero-blob hero-blob-3"></span>

            <div class="relative flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-violet-400">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Panel de administración
                    </p>
                    <h1 class="titulo-grad mt-1 text-2xl font-extrabold sm:text-3xl">
                        <span id="saludo-hora">Hola</span>, {{ explode(' ', trim(auth()->user()->name))[0] }}
                    </h1>
                    <p class="mt-1.5 max-w-xl text-sm text-slate-400">
                        Este es el estado del portal UMBRAL hoy, {{ now()->isoFormat('dddd D [de] MMMM [de] Y') }}.
                    </p>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <span class="chip"><i class="fa-regular fa-clock"></i><span id="reloj">--:--</span></span>
                        <span class="chip chip-celeste"><i class="fa-solid fa-location-dot"></i>Colombia</span>
                    </div>
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
            <div class="kpi kpi-violeta rounded-2xl border border-slate-800 bg-slate-900/60 p-5" style="--i:0">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold {{ $kpiUsuarios['delta'] >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }}">
                        <i class="fa-solid {{ $kpiUsuarios['delta'] >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down' }}"></i>
                        {{ $kpiUsuarios['delta'] >= 0 ? '+' : '' }}{{ $kpiUsuarios['delta'] }}%
                    </span>
                </div>
                <p data-contar class="mt-4 text-3xl font-extrabold tracking-tight text-white">{{ number_format($kpiUsuarios['total']) }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Usuarios del portal</p>
            </div>

            {{-- Membresías activas --}}
            <div class="kpi kpi-verde rounded-2xl border border-slate-800 bg-slate-900/60 p-5" style="--i:1">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                        <i class="fa-solid fa-credit-card"></i>
                    </div>
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold {{ $kpiMembresias['delta'] >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }}">
                        <i class="fa-solid {{ $kpiMembresias['delta'] >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down' }}"></i>
                        {{ $kpiMembresias['delta'] >= 0 ? '+' : '' }}{{ $kpiMembresias['delta'] }}%
                    </span>
                </div>
                <p data-contar class="mt-4 text-3xl font-extrabold tracking-tight text-white">{{ number_format($kpiMembresias['total']) }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Membresías activas</p>
            </div>

            {{-- Ingresos --}}
            <div class="kpi kpi-ambar rounded-2xl border border-slate-800 bg-slate-900/60 p-5" style="--i:2">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                        <i class="fa-solid fa-coins"></i>
                    </div>
                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold {{ $kpiIngresos['delta'] >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }}">
                        <i class="fa-solid {{ $kpiIngresos['delta'] >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down' }}"></i>
                        {{ $kpiIngresos['delta'] >= 0 ? '+' : '' }}{{ $kpiIngresos['delta'] }}%
                    </span>
                </div>
                <p data-contar class="mt-4 text-3xl font-extrabold tracking-tight text-white">${{ number_format($kpiIngresos['total'], 0, ',', '.') }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Ingresos por membresías (COP)</p>
            </div>

            {{-- Pendientes de verificación --}}
            <div class="kpi kpi-celeste rounded-2xl border border-slate-800 bg-slate-900/60 p-5" style="--i:3">
                <div class="flex items-start justify-between">
                    <div class="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                        <i class="fa-solid fa-user-clock"></i>
                    </div>
                </div>
                <p data-contar class="mt-4 text-3xl font-extrabold tracking-tight text-white">{{ number_format($kpiPendientes) }}</p>
                <p class="mt-0.5 text-sm text-slate-500">Cuentas pendientes de verificación</p>
            </div>
        </div>

        {{-- Accesos rápidos --}}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <a href="{{ route('admin.usuarios.index') }}" class="atajo atajo-violeta" style="--i:0">
                <span class="atajo-icono"><i class="fa-solid fa-users"></i></span>
                <span><b>Usuarios</b><small>Crear, editar y verificar</small></span>
                <i class="fa-solid fa-arrow-right flecha"></i>
            </a>
            <a href="{{ route('admin.membresias') }}" class="atajo atajo-verde" style="--i:1">
                <span class="atajo-icono"><i class="fa-solid fa-credit-card"></i></span>
                <span><b>Membresías</b><small>Planes y pagos</small></span>
                <i class="fa-solid fa-arrow-right flecha"></i>
            </a>
            <a href="{{ route('admin.reportes') }}" class="atajo atajo-ambar" style="--i:2">
                <span class="atajo-icono"><i class="fa-solid fa-chart-line"></i></span>
                <span><b>Reportes</b><small>Cifras del portal</small></span>
                <i class="fa-solid fa-arrow-right flecha"></i>
            </a>
            <a href="{{ route('admin.ajustes') }}" class="atajo atajo-celeste" style="--i:3">
                <span class="atajo-icono"><i class="fa-solid fa-gear"></i></span>
                <span><b>Ajustes</b><small>Configuración general</small></span>
                <i class="fa-solid fa-arrow-right flecha"></i>
            </a>
        </div>

        {{-- Gráficas --}}
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div class="panel-card rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2">
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

            <div class="panel-card rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
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
    {{-- Datos que envía el controlador --}}
    var registros = @json($graficaRegistros);
    var roles = @json($graficaRoles);

    // ----- Saludo según la hora y reloj en vivo -----
    (function () {
        var saludo = document.getElementById('saludo-hora');
        var reloj = document.getElementById('reloj');

        function actualizar() {
            var ahora = new Date();
            var h = ahora.getHours();
            saludo.textContent = h < 12 ? 'Buenos días' : (h < 19 ? 'Buenas tardes' : 'Buenas noches');
            reloj.textContent = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        }
        actualizar();
        setInterval(actualizar, 30000);
    })();

    // ----- Números de las tarjetas que "suben" hasta su valor -----
    (function () {
        var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function conPuntos(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

        document.querySelectorAll('[data-contar]').forEach(function (el) {
            var texto = el.textContent.trim();
            var prefijo = texto.charAt(0) === '$' ? '$' : '';
            var destino = parseInt(texto.replace(/\D/g, ''), 10) || 0;
            if (reducir || destino === 0) return;

            var inicio = null, duracion = 1000;
            function paso(t) {
                if (inicio === null) inicio = t;
                var avance = Math.min((t - inicio) / duracion, 1);
                var suave = 1 - Math.pow(1 - avance, 3);
                el.textContent = prefijo + conPuntos(Math.round(destino * suave));
                if (avance < 1) requestAnimationFrame(paso);
            }
            requestAnimationFrame(paso);
        });
    })();

    // ----- Gráficas (cambian de colores con el tema) -----
    var graficaLinea = null, graficaDona = null;

    function paleta() {
        var claro = document.documentElement.getAttribute('data-theme') === 'light';
        return {
            texto: claro ? '#5b6385' : '#94a3b8',
            fuerte: claro ? '#111936' : '#ffffff',
            rejilla: claro ? 'rgba(99, 102, 241, 0.12)' : 'rgba(148, 163, 184, 0.12)',
            borde: claro ? '#ffffff' : '#0f172a'
        };
    }

    // Texto con el total en el centro de la dona
    var textoCentro = {
        id: 'textoCentro',
        afterDraw: function (chart) {
            var c = paleta();
            var datos = chart.data.datasets[0].data;
            var total = datos.reduce(function (a, b) { return a + b; }, 0);
            var x = (chart.chartArea.left + chart.chartArea.right) / 2;
            var y = (chart.chartArea.top + chart.chartArea.bottom) / 2;
            var ctx = chart.ctx;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = c.fuerte;
            ctx.font = '800 28px Inter, system-ui, sans-serif';
            ctx.fillText(total, x, y - 8);
            ctx.fillStyle = c.texto;
            ctx.font = '500 12px Inter, system-ui, sans-serif';
            ctx.fillText('cuentas', x, y + 16);
            ctx.restore();
        }
    };

    function dibujarGraficas() {
        var c = paleta();
        if (graficaLinea) graficaLinea.destroy();
        if (graficaDona) graficaDona.destroy();

        Chart.defaults.color = c.texto;
        Chart.defaults.borderColor = c.rejilla;
        Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

        // Línea: registros por mes, con degradado de color
        graficaLinea = new Chart(document.getElementById('grafica-registros'), {
            type: 'line',
            data: {
                labels: registros.etiquetas,
                datasets: [{
                    label: 'Nuevos usuarios',
                    data: registros.valores,
                    borderColor: function (ctx) {
                        var a = ctx.chart.chartArea;
                        if (!a) return '#8b5cf6';
                        var g = ctx.chart.ctx.createLinearGradient(a.left, 0, a.right, 0);
                        g.addColorStop(0, '#0ea5e9');
                        g.addColorStop(0.5, '#8b5cf6');
                        g.addColorStop(1, '#ec4899');
                        return g;
                    },
                    backgroundColor: function (ctx) {
                        var a = ctx.chart.chartArea;
                        if (!a) return 'rgba(139, 92, 246, 0.2)';
                        var g = ctx.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
                        g.addColorStop(0, 'rgba(139, 92, 246, 0.38)');
                        g.addColorStop(1, 'rgba(139, 92, 246, 0)');
                        return g;
                    },
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: c.borde,
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: c.rejilla } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Dona: distribución por rol
        graficaDona = new Chart(document.getElementById('grafica-roles'), {
            type: 'doughnut',
            data: {
                labels: roles.map(function (r) { return r.rol; }),
                datasets: [{
                    data: roles.map(function (r) { return r.total; }),
                    backgroundColor: ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'],
                    borderColor: c.borde,
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '66%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } }
                }
            },
            plugins: [textoCentro]
        });
    }

    dibujarGraficas();
    window.addEventListener('umbral:tema', dibujarGraficas);
</script>
@endpush