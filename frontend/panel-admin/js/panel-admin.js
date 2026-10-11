/* UMBRAL — Panel de administración (frontend)
   Código compartido por todas las pantallas del panel:
     - habla con la API (/api/v1/admin/...) usando la sesión del login actual
     - dibuja el menú lateral y la barra superior
     - muestra la pantalla solo cuando la sesión de administrador es válida
   Las pantallas de cada módulo (dashboard.js, ...) usan window.PanelAdmin. */
(function () {
    'use strict';

    // Mismo origen que la página: nginx reenvía /api a Laravel,
    // así la cookie de sesión viaja sola y no hace falta CORS.
    var BASE = '/api/v1/admin';
    var LOGIN = '/index.html';

    // Pantallas del panel. Mientras una pantalla no se haya pasado al frontend,
    // el menú sigue apuntando a su versión anterior (/admin/...).
    var PAGINAS = {
        panel:          { nuevo: '/panel-admin/dashboard.html',      viejo: '/admin' },
        usuarios:       { nuevo: '/panel-admin/usuarios.html',       viejo: '/admin/usuarios' },
        verificaciones: { nuevo: '/panel-admin/verificaciones.html', viejo: '/admin/verificaciones' },
        membresias:     { nuevo: '/panel-admin/membresias.html',     viejo: '/admin/membresias' },
        reportes:       { nuevo: '/panel-admin/reportes.html',       viejo: '/admin/reportes' },
        ajustes:        { nuevo: '/panel-admin/ajustes.html',        viejo: '/admin/ajustes' },
        perfil:         { nuevo: '/panel-admin/perfil.html',         viejo: '/admin/perfil' }
    };
    var MIGRADAS = ['panel', 'usuarios', 'verificaciones'];

    var cuerpo = document.body;
    var pagina = cuerpo.getAttribute('data-pagina') || 'panel';
    var titulo = cuerpo.getAttribute('data-titulo') || 'Panel';

    function url(nombre) {
        var p = PAGINAS[nombre];
        return MIGRADAS.indexOf(nombre) >= 0 ? p.nuevo : p.viejo;
    }

    // Escapa texto antes de ponerlo en HTML (los nombres los escribe cualquier usuario)
    function esc(texto) {
        return String(texto == null ? '' : texto).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function iniciales(nombre) {
        return String(nombre || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
            .map(function (palabra) { return palabra.charAt(0).toUpperCase(); }).join('');
    }

    function leerCookie(nombre) {
        var fila = document.cookie.split('; ').filter(function (f) { return f.indexOf(nombre + '=') === 0; })[0];
        return fila ? decodeURIComponent(fila.substring(nombre.length + 1)) : '';
    }

    function irAlLogin() {
        window.location.replace(LOGIN);
    }

    /* ---------------------------------------------------------
       Llamadas a la API
       api('/dashboard')                                  → GET
       api('/usuarios', { metodo: 'POST', cuerpo: {...} }) → POST con JSON
       Si no hay sesión (401) vuelve al inicio. Cualquier otro error
       se lanza como Error con .estado (código HTTP) y .datos (respuesta).
       --------------------------------------------------------- */
    async function api(ruta, opciones) {
        opciones = opciones || {};
        var metodo = (opciones.metodo || 'GET').toUpperCase();
        var cabeceras = { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
        var contenido;

        if (metodo !== 'GET') {
            cabeceras['Content-Type'] = 'application/json';
            // Protección CSRF: Laravel deja el token en la cookie XSRF-TOKEN
            var xsrf = leerCookie('XSRF-TOKEN');
            if (xsrf) cabeceras['X-XSRF-TOKEN'] = xsrf;
            if (opciones.cuerpo !== undefined) contenido = JSON.stringify(opciones.cuerpo);
        }

        var respuesta = await fetch(BASE + ruta, {
            method: metodo,
            credentials: 'same-origin',
            headers: cabeceras,
            body: contenido
        });
        var datos = await respuesta.json().catch(function () { return {}; });

        if (respuesta.status === 401) irAlLogin();

        if (!respuesta.ok) {
            var error = new Error(datos.message || datos.mensaje || ('Error ' + respuesta.status));
            error.estado = respuesta.status;
            error.datos = datos;
            throw error;
        }
        return datos;
    }

    /* ---------------------------------------------------------
       Menú lateral
       --------------------------------------------------------- */
    function enlaceMenu(nombre, icono, texto, insignia) {
        var activo = nombre === pagina;
        return '<a href="' + url(nombre) + '" class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ' +
            (activo
                ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white ring-1 ring-violet-500/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200') + '">' +
            '<i class="fa-solid ' + icono + ' w-5 text-center ' +
            (activo ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300') + '"></i>' +
            texto + (insignia || '') + '</a>';
    }

    var INSIGNIA_PRONTO = '<span class="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500">pronto</span>';

    function htmlMenu(resumen) {
        var totalUsuarios = Number(resumen.total_usuarios || 0);
        var pendientes = Number(resumen.total_pendientes || 0);
        var sistema = resumen.sistema || {};

        return '' +
        '<aside id="menu-lateral" class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-slate-800 bg-slate-900/70 backdrop-blur transition-transform duration-300 lg:translate-x-0">' +
            '<div class="flex items-center gap-3 border-b border-slate-800 px-6 py-5">' +
                '<div class="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">' +
                    '<i class="fa-solid fa-door-open text-lg text-white"></i>' +
                '</div>' +
                '<div class="leading-tight">' +
                    '<p class="text-lg font-extrabold tracking-[0.18em] text-white">UMBRAL</p>' +
                    '<p class="text-[11px] font-medium tracking-wide text-slate-400">Panel de administración</p>' +
                '</div>' +
                '<button type="button" data-cierra-menu class="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 lg:hidden">' +
                    '<i class="fa-solid fa-xmark"></i>' +
                '</button>' +
            '</div>' +
            '<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">' +
                '<p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Principal</p>' +
                enlaceMenu('panel', 'fa-gauge-high', 'Panel') +
                enlaceMenu('usuarios', 'fa-users', 'Gestión de usuarios',
                    '<span class="ml-auto rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-300 ring-1 ring-violet-500/30">' + totalUsuarios + '</span>') +
                enlaceMenu('verificaciones', 'fa-user-check', 'Verificaciones',
                    '<span id="badge-pendientes" class="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-500/30 ' + (pendientes > 0 ? '' : 'hidden') + '">' + pendientes + '</span>') +
                enlaceMenu('membresias', 'fa-credit-card', 'Membresías', INSIGNIA_PRONTO) +
                enlaceMenu('reportes', 'fa-chart-line', 'Reportes', INSIGNIA_PRONTO) +
                '<p class="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Sistema</p>' +
                enlaceMenu('ajustes', 'fa-gear', 'Ajustes') +
                enlaceMenu('perfil', 'fa-user', 'Mi perfil') +
            '</nav>' +
            '<div class="mx-3 mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">' +
                '<p class="mb-2 font-semibold uppercase tracking-wider text-slate-500">Estado del sistema</p>' +
                '<ul class="space-y-1.5 text-slate-400">' +
                    '<li class="flex items-center justify-between"><span>Laravel</span>' +
                        '<span class="flex items-center gap-1.5 font-medium text-slate-300"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>v' + esc(sistema.laravel) + '</span></li>' +
                    '<li class="flex items-center justify-between"><span>PHP</span>' +
                        '<span class="flex items-center gap-1.5 font-medium text-slate-300"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>' + esc(sistema.php) + '</span></li>' +
                    '<li class="flex items-center justify-between"><span>PostgreSQL</span>' +
                        '<span class="flex items-center gap-1.5 font-medium text-emerald-400"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Operativo</span></li>' +
                '</ul>' +
            '</div>' +
        '</aside>';
    }

    /* ---------------------------------------------------------
       Barra superior
       --------------------------------------------------------- */
    function htmlNotificacion(n) {
        var colores = n.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400';
        var enlace = n.tipo === 'registro' && n.referencia
            ? url('usuarios') + '?q=' + encodeURIComponent(n.referencia)
            : null;

        var contenido =
            '<span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ' + colores + '">' +
                '<i class="fa-solid ' + esc(n.icono) + ' text-xs"></i>' +
            '</span>' +
            '<div class="min-w-0">' +
                '<p class="truncate text-sm font-medium text-slate-200">' + esc(n.titulo) + '</p>' +
                '<p class="truncate text-xs text-slate-500">' + esc(n.detalle) + '</p>' +
                '<p class="mt-0.5 text-[11px] text-slate-600">' + esc(n.hace) + '</p>' +
            '</div>';

        return '<li>' + (enlace
            ? '<a href="' + esc(enlace) + '" class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-800/50">' + contenido + '</a>'
            : '<div class="flex items-start gap-3 px-4 py-3">' + contenido + '</div>') + '</li>';
    }

    function htmlBarra(usuario, resumen) {
        var notificaciones = resumen.notificaciones || [];
        var lista = notificaciones.length
            ? notificaciones.map(htmlNotificacion).join('')
            : '<li class="px-4 py-8 text-center text-sm text-slate-500">Sin actividad por ahora.</li>';

        return '' +
        '<header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">' +
            '<div class="flex items-center gap-3 px-4 py-3 sm:px-6">' +
                '<button type="button" id="boton-menu" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-800 text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200 lg:hidden">' +
                    '<i class="fa-solid fa-bars"></i>' +
                '</button>' +
                '<h2 class="hidden truncate text-base font-bold text-white sm:block">' + esc(titulo) + '</h2>' +
                '<form action="' + url('usuarios') + '" method="GET" class="relative ml-auto hidden w-64 md:block lg:w-80">' +
                    '<i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500"></i>' +
                    '<input type="search" name="q" placeholder="Buscar usuarios por nombre o correo…" class="w-full rounded-xl border border-slate-800 bg-slate-900/70 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">' +
                '</form>' +
                '<div class="ml-auto flex items-center gap-2 md:ml-0">' +
                    '<button type="button" id="boton-tema" class="tema-boton" title="Cambiar entre modo claro y oscuro" aria-label="Cambiar entre modo claro y oscuro">' +
                        '<i class="fa-solid fa-moon icono-luna"></i><i class="fa-solid fa-sun icono-sol"></i>' +
                    '</button>' +
                    '<div class="relative">' +
                        '<button type="button" data-abre="menu-notificaciones" class="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200">' +
                            '<i class="fa-regular fa-bell"></i>' +
                        '</button>' +
                        '<div id="menu-notificaciones" data-menu="notificaciones" class="absolute right-0 mt-2 hidden w-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50">' +
                            '<div class="border-b border-slate-800 px-4 py-3">' +
                                '<p class="text-sm font-bold text-white">Actividad reciente</p>' +
                                '<p class="text-[11px] text-slate-500">Últimos registros y pagos del portal</p>' +
                            '</div>' +
                            '<ul class="max-h-80 divide-y divide-slate-800/70 overflow-y-auto">' + lista + '</ul>' +
                            '<a href="' + url('usuarios') + '" class="block border-t border-slate-800 px-4 py-2.5 text-center text-xs font-medium text-violet-400 transition-colors hover:bg-slate-800/50 hover:text-violet-300">Ver gestión de usuarios</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="relative">' +
                        '<button type="button" data-abre="menu-perfil" class="flex items-center gap-2.5 rounded-xl border border-slate-800 py-1.5 pl-1.5 pr-3 transition-all hover:bg-slate-800">' +
                            '<span class="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow shadow-violet-500/30">' + esc(iniciales(usuario.name)) + '</span>' +
                            '<span class="hidden text-left leading-tight sm:block">' +
                                '<span class="block max-w-[10rem] truncate text-sm font-semibold text-slate-200">' + esc(usuario.name) + '</span>' +
                                '<span class="block text-[11px] text-violet-400">Administrador</span>' +
                            '</span>' +
                            '<i class="fa-solid fa-chevron-down hidden text-[10px] text-slate-500 sm:block"></i>' +
                        '</button>' +
                        '<div id="menu-perfil" data-menu="perfil" class="absolute right-0 mt-2 hidden w-56 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 py-1.5 shadow-2xl shadow-black/50">' +
                            '<div class="border-b border-slate-800 px-4 pb-2.5 pt-2">' +
                                '<p class="truncate text-sm font-semibold text-white">' + esc(usuario.name) + '</p>' +
                                '<p class="truncate text-xs text-slate-500">' + esc(usuario.email) + '</p>' +
                            '</div>' +
                            '<a href="' + url('perfil') + '" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/70"><i class="fa-solid fa-user w-4 text-center text-slate-500"></i>Mi perfil</a>' +
                            '<a href="' + url('ajustes') + '" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/70"><i class="fa-solid fa-gear w-4 text-center text-slate-500"></i>Ajustes de cuenta</a>' +
                            '<div class="my-1 border-t border-slate-800"></div>' +
                            '<button type="button" data-salir class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-950/40"><i class="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>Cerrar sesión</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</header>';
    }

    /* ---------------------------------------------------------
       Comportamientos: menú móvil, menús desplegables, tema y salir
       --------------------------------------------------------- */
    function activarComportamientos() {
        var menu = document.getElementById('menu-lateral');
        var fondo = document.getElementById('fondo-menu');
        var botonMenu = document.getElementById('boton-menu');

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

        if (botonMenu) botonMenu.addEventListener('click', abrirMenu);
        if (fondo) fondo.addEventListener('click', cerrarMenu);
        document.querySelectorAll('[data-cierra-menu]').forEach(function (b) { b.addEventListener('click', cerrarMenu); });

        // Menús desplegables de la barra superior
        function cerrarTodos() {
            document.querySelectorAll('[data-menu]').forEach(function (m) { m.classList.add('hidden'); });
        }
        document.querySelectorAll('[data-abre]').forEach(function (boton) {
            boton.addEventListener('click', function (evento) {
                evento.stopPropagation();
                var desplegable = document.getElementById(boton.getAttribute('data-abre'));
                var estabaAbierto = !desplegable.classList.contains('hidden');
                cerrarTodos();
                if (!estabaAbierto) desplegable.classList.remove('hidden');
            });
        });
        document.addEventListener('click', function (evento) {
            if (!evento.target.closest('[data-menu]')) cerrarTodos();
        });

        // Tema claro / oscuro (se recuerda en el navegador)
        var botonTema = document.getElementById('boton-tema');
        if (botonTema) {
            botonTema.addEventListener('click', function () {
                var raiz = document.documentElement;
                var nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                raiz.classList.add('cambiando-tema');
                raiz.setAttribute('data-theme', nuevo);
                try { localStorage.setItem('umbral-tema', nuevo); } catch (e) {}
                setTimeout(function () { raiz.classList.remove('cambiando-tema'); }, 450);
                // Avisa a las gráficas para que cambien de colores
                window.dispatchEvent(new CustomEvent('umbral:tema', { detail: nuevo }));
            });
        }

        // Cerrar sesión: la API cierra la sesión y volvemos al inicio
        document.querySelectorAll('[data-salir]').forEach(function (boton) {
            boton.addEventListener('click', async function () {
                boton.disabled = true;
                try { await api('/logout', { metodo: 'POST' }); } catch (e) { /* si ya no había sesión, igual salimos */ }
                irAlLogin();
            });
        });
    }

    /* ---------------------------------------------------------
       Arranque: comprueba la sesión y dibuja el menú y la barra
       --------------------------------------------------------- */
    function mostrarErrorGeneral(texto) {
        var app = document.getElementById('app');
        if (!app) return;
        app.innerHTML =
            '<div class="mx-auto max-w-md px-6 py-8 text-center">' +
                '<p class="text-lg font-bold text-white">No se pudo cargar el panel</p>' +
                '<p class="mt-2 text-sm text-slate-400">' + esc(texto) + '</p>' +
                '<button type="button" onclick="window.location.reload()" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Reintentar</button>' +
            '</div>';
        app.style.visibility = 'visible';
    }

    var listo = (async function () {
        var yo = await api('/yo');            // 401 → vuelve al inicio; 403 → no es administrador
        var resumen = await api('/menu');

        document.getElementById('zona-menu').innerHTML = htmlMenu(resumen);
        document.getElementById('zona-barra').innerHTML = htmlBarra(yo.usuario, resumen);

        // Enlaces fijos del contenido de la página (data-ir="usuarios")
        document.querySelectorAll('[data-ir]').forEach(function (a) {
            a.setAttribute('href', url(a.getAttribute('data-ir')) + (a.getAttribute('data-sufijo') || ''));
        });

        activarComportamientos();
        document.getElementById('app').style.visibility = 'visible';
        return { usuario: yo.usuario, resumen: resumen };
    })();

    listo.catch(function (error) {
        if (error && error.estado === 401) return;            // ya se redirigió
        if (error && error.estado === 403) { irAlLogin(); return; }
        mostrarErrorGeneral('Revisa tu conexión y que el servidor esté encendido, e inténtalo de nuevo.');
    });

    window.PanelAdmin = { api: api, listo: listo, esc: esc, url: url };
})();
