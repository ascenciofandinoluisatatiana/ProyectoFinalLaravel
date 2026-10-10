{{-- ============================================================
     Menú lateral del panel (fijo en escritorio, cajón en móvil)
     ============================================================ --}}
<aside id="menu-lateral"
       class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-slate-800 bg-slate-900/70 backdrop-blur transition-transform duration-300 lg:translate-x-0">

    {{-- Marca --}}
    <div class="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <i class="fa-solid fa-door-open text-lg text-white"></i>
        </div>
        <div class="leading-tight">
            <p class="text-lg font-extrabold tracking-[0.18em] text-white">UMBRAL</p>
            <p class="text-[11px] font-medium tracking-wide text-slate-400">Panel de administración</p>
        </div>
        <button type="button" onclick="cerrarMenuLateral()"
                class="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 lg:hidden">
            <i class="fa-solid fa-xmark"></i>
        </button>
    </div>

    {{-- Navegación --}}
    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Principal</p>

        <a href="{{ route('admin.panel') }}"
           class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                  {{ request()->routeIs('admin.panel') ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
            <i class="fa-solid fa-gauge-high w-5 text-center {{ request()->routeIs('admin.panel') ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300' }}"></i>
            Panel
        </a>

        <a href="{{ route('admin.usuarios.index') }}"
           class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                  {{ request()->routeIs('admin.usuarios.*') ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
            <i class="fa-solid fa-users w-5 text-center {{ request()->routeIs('admin.usuarios.*') ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300' }}"></i>
            Gestión de usuarios
            <span class="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-300 ring-1 ring-violet-500/30">{{ $totalUsuarios }}</span>
        </a>

        <a href="{{ route('admin.verificaciones.index') }}"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                {{ request()->routeIs('admin.verificaciones.*') ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
            <i class="fa-solid fa-user-check w-5 text-center {{ request()->routeIs('admin.verificaciones.*') ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300' }}"></i>
            Verificaciones
            <span id="badge-pendientes" class="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-500/30 {{ $totalPendientes > 0 ? '' : 'hidden' }}">{{ $totalPendientes }}</span>
        </a>

        <a href="{{ route('admin.membresias') }}"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                {{ request()->routeIs('admin.membresias') ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
            <i class="fa-solid fa-credit-card w-5 text-center text-slate-500 group-hover:text-slate-300"></i>
            Membresías
            <span class="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500">pronto</span>
        </a>

        <a href="{{ route('admin.reportes') }}"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                {{ request()->routeIs('admin.reportes') ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
            <i class="fa-solid fa-chart-line w-5 text-center text-slate-500 group-hover:text-slate-300"></i>
            Reportes
            <span class="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500">pronto</span>
        </a>

        <p class="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Sistema</p>

        <a href="{{ route('admin.ajustes') }}"
           class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                  {{ request()->routeIs('admin.ajustes') ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
            <i class="fa-solid fa-gear w-5 text-center {{ request()->routeIs('admin.ajustes') ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300' }}"></i>
            Ajustes
        </a>

        <a href="{{ route('admin.perfil') }}"
           class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                  {{ request()->routeIs('admin.perfil') ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
            <i class="fa-solid fa-user w-5 text-center {{ request()->routeIs('admin.perfil') ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300' }}"></i>
            Mi perfil
        </a>
    </nav>

    {{-- Estado del sistema --}}
    <div class="mx-3 mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
        <p class="mb-2 font-semibold uppercase tracking-wider text-slate-500">Estado del sistema</p>
        <ul class="space-y-1.5 text-slate-400">
            <li class="flex items-center justify-between">
                <span>Laravel</span>
                <span class="flex items-center gap-1.5 font-medium text-slate-300">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>v{{ app()->version() }}
                </span>
            </li>
            <li class="flex items-center justify-between">
                <span>PHP</span>
                <span class="flex items-center gap-1.5 font-medium text-slate-300">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>{{ PHP_VERSION }}
                </span>
            </li>
            <li class="flex items-center justify-between">
                <span>PostgreSQL</span>
                <span class="flex items-center gap-1.5 font-medium text-emerald-400">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Operativo
                </span>
            </li>
        </ul>
    </div>
</aside>
