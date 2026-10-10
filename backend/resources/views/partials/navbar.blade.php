{{-- ============================================================
     Barra superior: búsqueda global, actividad reciente y perfil
     ============================================================ --}}
@php
    $usuarioPanel = auth()->user();
    $iniciales = collect(explode(' ', trim($usuarioPanel?->name ?? '')))
        ->filter()->take(2)->map(fn ($palabra) => mb_strtoupper(mb_substr($palabra, 0, 1)))->implode('');
@endphp

<header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
    <div class="flex items-center gap-3 px-4 py-3 sm:px-6">
        {{-- Botón del menú en pantallas pequeñas --}}
        <button type="button" id="boton-menu"
                class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-800 text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200 lg:hidden">
            <i class="fa-solid fa-bars"></i>
        </button>

        <h2 class="hidden truncate text-base font-bold text-white sm:block">@yield('titulo')</h2>

        {{-- Búsqueda global: lleva a la gestión de usuarios --}}
        <form action="{{ route('admin.usuarios.index') }}" method="GET" class="relative ml-auto hidden w-64 md:block lg:w-80">
            <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500"></i>
            <input type="search" name="q" value="{{ request('q') }}" placeholder="Buscar usuarios por nombre o correo…"
                   class="w-full rounded-xl border border-slate-800 bg-slate-900/70 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">
        </form>

        <div class="ml-auto flex items-center gap-2 md:ml-0">
            {{-- Actividad reciente: registros y pagos reales del portal --}}
            <div class="relative">
                <button type="button" data-abre="menu-notificaciones"
                        class="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200">
                    <i class="fa-regular fa-bell"></i>
                </button>

                <div id="menu-notificaciones" data-menu="notificaciones" class="absolute right-0 mt-2 hidden w-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50">
                    <div class="border-b border-slate-800 px-4 py-3">
                        <p class="text-sm font-bold text-white">Actividad reciente</p>
                        <p class="text-[11px] text-slate-500">Últimos registros y pagos del portal</p>
                    </div>
                    <ul class="max-h-80 divide-y divide-slate-800/70 overflow-y-auto">
                        @forelse ($notificaciones as $notificacion)
                            <li>
                                @if ($notificacion['url'])
                                    <a href="{{ $notificacion['url'] }}" class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-800/50">
                                @else
                                    <div class="flex items-start gap-3 px-4 py-3">
                                @endif
                                        <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg
                                                     {{ $notificacion['color'] === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400' }}">
                                            <i class="fa-solid {{ $notificacion['icono'] }} text-xs"></i>
                                        </span>
                                        <div class="min-w-0">
                                            <p class="truncate text-sm font-medium text-slate-200">{{ $notificacion['titulo'] }}</p>
                                            <p class="truncate text-xs text-slate-500">{{ $notificacion['detalle'] }}</p>
                                            <p class="mt-0.5 text-[11px] text-slate-600">{{ $notificacion['fecha']->diffForHumans() }}</p>
                                        </div>
                                @if ($notificacion['url'])
                                    </a>
                                @else
                                    </div>
                                @endif
                            </li>
                        @empty
                            <li class="px-4 py-8 text-center text-sm text-slate-500">Sin actividad por ahora.</li>
                        @endforelse
                    </ul>
                    <a href="{{ route('admin.usuarios.index') }}"
                       class="block border-t border-slate-800 px-4 py-2.5 text-center text-xs font-medium text-violet-400 transition-colors hover:bg-slate-800/50 hover:text-violet-300">
                        Ver gestión de usuarios
                    </a>
                </div>
            </div>

            {{-- Perfil del usuario autenticado --}}
            <div class="relative">
                <button type="button" data-abre="menu-perfil"
                        class="flex items-center gap-2.5 rounded-xl border border-slate-800 py-1.5 pl-1.5 pr-3 transition-all hover:bg-slate-800">
                    <span class="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow shadow-violet-500/30">{{ $iniciales }}</span>
                    <span class="hidden text-left leading-tight sm:block">
                        <span class="block max-w-[10rem] truncate text-sm font-semibold text-slate-200">{{ $usuarioPanel?->name }}</span>
                        <span class="block text-[11px] text-violet-400">Administrador</span>
                    </span>
                    <i class="fa-solid fa-chevron-down hidden text-[10px] text-slate-500 sm:block"></i>
                </button>

                <div id="menu-perfil" class="absolute right-0 mt-2 hidden w-56 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 py-1.5 shadow-2xl shadow-black/50">
                    <div class="border-b border-slate-800 px-4 pb-2.5 pt-2">
                        <p class="truncate text-sm font-semibold text-white">{{ $usuarioPanel?->name }}</p>
                        <p class="truncate text-xs text-slate-500">{{ $usuarioPanel?->email }}</p>
                    </div>
                    <a href="{{ route('admin.perfil') }}" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/70">
                        <i class="fa-solid fa-user w-4 text-center text-slate-500"></i>Mi perfil
                    </a>
                    <a href="{{ route('admin.ajustes') }}" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/70">
                        <i class="fa-solid fa-gear w-4 text-center text-slate-500"></i>Ajustes de cuenta
                    </a>
                    <div class="my-1 border-t border-slate-800"></div>
                    <form method="POST" action="{{ route('admin.logout') }}">
                        @csrf
                        <button type="submit" class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-950/40">
                            <i class="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>Cerrar sesión
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</header>

<script>
    // Menús desplegables de la barra superior: se abren con su botón
    // y se cierran al hacer clic fuera de ellos.
    (function () {
        function cerrarTodos() {
            document.querySelectorAll('[data-menu]').forEach(function (m) { m.classList.add('hidden'); });
        }

        document.querySelectorAll('[data-abre]').forEach(function (boton) {
            boton.addEventListener('click', function (evento) {
                evento.stopPropagation();
                var menu = document.getElementById(boton.getAttribute('data-abre'));
                var estabaAbierto = !menu.classList.contains('hidden');
                cerrarTodos();
                if (!estabaAbierto) menu.classList.remove('hidden');
            });
        });

        document.addEventListener('click', function (evento) {
            if (!evento.target.closest('[data-menu]')) cerrarTodos();
        });
    })();
</script>
