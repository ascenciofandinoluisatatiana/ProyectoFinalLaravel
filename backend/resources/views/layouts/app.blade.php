<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('titulo', 'Panel') · UMBRAL</title>

    {{-- Recursos 100% locales (public/assets/admin): Tailwind compilado,
         FontAwesome, Chart.js y la fuente Inter. Así el panel se ve completo
         sin internet y sin paso de build de Node en el contenedor. --}}
    <link rel="stylesheet" href="{{ asset('assets/admin/admin.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/admin/fontawesome/css/fontawesome.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/admin/fontawesome/css/solid.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/admin/fontawesome/css/regular.min.css') }}">
    <script src="{{ asset('assets/admin/chart.umd.min.js') }}"></script>

    <style>
        /* Barra de desplazamiento oscura y discreta */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
    </style>
</head>
<body class="bg-slate-950 text-slate-200 font-sans antialiased">

    <div class="min-h-screen">
        @include('partials.sidebar')

        {{-- Contenido: en escritorio deja el espacio del menú lateral fijo --}}
        <div class="flex min-h-screen flex-col lg:pl-72 transition-all duration-300">
            @include('partials.navbar')

            <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                @if (session('exito'))
                    <div class="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg shadow-emerald-950/20">
                        <i class="fa-solid fa-circle-check mt-0.5"></i>
                        <span>{{ session('exito') }}</span>
                    </div>
                @endif
                @yield('contenido')
            </main>

            <footer class="border-t border-slate-800/60 px-6 py-4 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <span>UMBRAL · El paso hacia un nuevo hogar</span>
                <span>Panel de administración · Colombia</span>
            </footer>
        </div>
    </div>

    {{-- Fondo oscurecido detrás del menú móvil --}}
    <div id="fondo-menu" class="fixed inset-0 z-30 hidden bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"></div>

    @stack('scripts')

    <script>
        // Menú lateral en pantallas pequeñas: botón hamburguesa + fondo clicable
        (function () {
            var menu = document.getElementById('menu-lateral');
            var fondo = document.getElementById('fondo-menu');
            var boton = document.getElementById('boton-menu');

            function abrirMenu() {
                menu.classList.remove('-translate-x-full');
                fondo.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
            function cerrarMenu() {
                menu.classList.add('-translate-x-full');
                fondo.classList.add('hidden');
                document.body.style.overflow = '';
            }

            boton && boton.addEventListener('click', abrirMenu);
            fondo && fondo.addEventListener('click', cerrarMenu);
            window.cerrarMenuLateral = cerrarMenu;
        })();
    </script>
</body>
</html>
