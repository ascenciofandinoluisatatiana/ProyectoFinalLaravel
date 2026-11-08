/* UMBRAL — Pantalla "Movimientos" del administrador.
   Cada pestaña (seguridad | administrador | inmobiliaria | agente | vendedor) dibuja varias tablas:
     seguridad → cambios de contraseña y bloqueos
     accesos   → inicios de sesión
     acciones  → lo que hacen en su panel (no sale en la pestaña Seguridad)
   Cada tabla tiene sus propios filtros y su propia paginación:
   /api/v1/admin/movimientos?tab=...&seccion=...&filtros
   La pestaña "invitado" (visitantes sin cuenta) tiene sus propias tablas: visitantes y contactos dejados
   (/api/v1/admin/invitados y /invitados/contactos) y una ventana "Ver" con el detalle de cada visitante. */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var tabActual = 'seguridad';
    var secciones = [];            // tablas de la pestaña actual

    /* ================= Textos y colores ================= */
    var ACCIONES = {
        login_fallido:           { texto: 'Intento de acceso fallido',        color: 'red' },
        cuenta_bloqueada:        { texto: 'Cuenta bloqueada',                 color: 'red' },
        recuperacion_solicitada: { texto: 'Pidió recuperar su contraseña',    color: 'amber' },
        clave_restablecida:      { texto: 'Cambió su contraseña',             color: 'emerald' },
        enlace_enviado_admin:    { texto: 'Se le envió enlace de contraseña', color: 'violet' },
        inicio_sesion:           { texto: 'Inicio de sesión',                 color: 'emerald' },
        cuenta_creada:           { texto: 'Creó una cuenta',                  color: 'emerald' },
        cuenta_editada:          { texto: 'Editó una cuenta',                 color: 'amber' },
        cuenta_eliminada:        { texto: 'Eliminó una cuenta',               color: 'red' },
        verificacion_aprobada:   { texto: 'Aprobó una verificación',          color: 'emerald' },
        verificacion_rechazada:  { texto: 'Rechazó una verificación',         color: 'red' },
        enlace_clave_enviado:    { texto: 'Envió enlace de contraseña',       color: 'violet' }
    };
    var COLORES = {
        red:     'bg-red-500/10 text-red-300 ring-red-500/30',
        amber:   'bg-amber-500/10 text-amber-300 ring-amber-500/30',
        emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
        violet:  'bg-violet-500/10 text-violet-300 ring-violet-500/30',
        sky:     'bg-sky-500/10 text-sky-300 ring-sky-500/30'
    };
    var COLORES_ROL = {
        administrador: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
        vendedor:      'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
        inmobiliaria:  'bg-sky-500/10 text-sky-300 ring-sky-500/30',
        agente:        'bg-amber-500/10 text-amber-300 ring-amber-500/30'
    };
    var DEF = {
        seguridad: { titulo: 'Cambios de contraseña y bloqueos', sub: 'Intentos fallidos, bloqueos y recuperaciones de contraseña.', icono: 'fa-shield-halved', conAccion: true,
                     vacio: 'Aquí aparecerán los intentos fallidos, los bloqueos y los cambios de contraseña.' },
        accesos:   { titulo: 'Inicios de sesión', sub: 'Cada vez que alguien entra a su panel.', icono: 'fa-right-to-bracket', conAccion: false,
                     vacio: 'Aquí aparecerá cada inicio de sesión (se guardan desde ahora en adelante).' },
        acciones:  { titulo: 'Acciones en su panel', sub: 'Lo que hacen dentro de su panel.', icono: 'fa-list-check', conAccion: true,
                     vacio: 'Aparecerán aquí cuando este panel empiece a registrar sus acciones.' }
    };
    var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

    function mayuscula(t) { t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
    function infoAccion(clave) {
        return ACCIONES[clave] || { texto: mayuscula(String(clave || '').replace(/_/g, ' ')), color: 'sky' };
    }
    function iniciales(nombre) {
        return String(nombre || '?').trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
    }
    function hora(texto) {
        var m = /[ T](\d{2}):(\d{2})/.exec(String(texto || ''));
        return m ? m[1] + ':' + m[2] : '—';
    }
    function claveDia(texto) { return String(texto || '').slice(0, 10); }

    // "2026-11-07" → "Hoy" | "Ayer" | "Lunes 3 de noviembre" (con año si no es el actual)
    function etiquetaDia(clave) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clave);
        if (!m) return 'Sin fecha';
        var f = new Date(+m[1], +m[2] - 1, +m[3]);
        var hoy = new Date(); hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        var dif = Math.round((hoy - f) / 86400000);
        if (dif === 0) return 'Hoy';
        if (dif === 1) return 'Ayer';
        return mayuscula(DIAS[f.getDay()]) + ' ' + f.getDate() + ' de ' + MESES[f.getMonth()] + (f.getFullYear() !== hoy.getFullYear() ? ' de ' + f.getFullYear() : '');
    }

    function toast(titulo, mensaje) {
        var e = document.createElement('div');
        e.className = 'flex items-start gap-3 rounded-xl border border-red-500/40 bg-slate-900/95 p-3.5 shadow-2xl shadow-black/50';
        e.innerHTML = '<i class="fa-solid fa-circle-xmark mt-0.5 text-red-400"></i>' +
            '<div class="min-w-0 flex-1"><p class="text-sm font-semibold text-slate-100">' + P.esc(titulo) + '</p>' +
            '<p class="mt-0.5 text-xs text-slate-400">' + P.esc(mensaje || '') + '</p></div>';
        document.getElementById('contenedor-toasts').appendChild(e);
        setTimeout(function () { e.remove(); }, 5000);
    }

    /* ================= Una tabla (con sus filtros y su paginación) ================= */
    var INP = 'w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20';

    function crearSeccion(clave, primera) {
        var d = DEF[clave];
        var el = document.createElement('div');
        el.className = '';
        el.innerHTML =
            '<div class="filtros-mov border-b border-slate-800 p-3.5">' +
                '<div class="relative ancho"><i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500"></i>' +
                    '<input type="search" data-campo="q" placeholder="Buscar por nombre o correo…" autocomplete="off" class="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"></div>' +
                (d.conAccion ? '<select data-campo="accion" aria-label="Acción" class="' + INP + '"><option value="">Acción: Todas</option></select>' : '') +
                (tabActual === 'seguridad'
                    ? '<select data-campo="rol" aria-label="Rol" class="' + INP + '"><option value="">Rol: Todos</option><option value="administrador">Administrador</option><option value="inmobiliaria">Inmobiliaria</option><option value="agente">Agente</option><option value="vendedor">Vendedor</option></select>'
                    : '') +
                '<label class="campo-fecha"><span>Desde</span><input type="date" data-campo="desde" class="' + INP + '"></label>' +
                '<label class="campo-fecha"><span>Hasta</span><input type="date" data-campo="hasta" class="' + INP + '"></label>' +
                '<input type="text" data-campo="ip" placeholder="IP (ej: 190.25.)" autocomplete="off" aria-label="Dirección IP" class="' + INP + '">' +
                '<select data-campo="orden" aria-label="Orden" class="' + INP + '"><option value="reciente">Más recientes primero</option><option value="antiguo">Más antiguos primero</option></select>' +
                '<button type="button" data-limpiar class="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800"><i class="fa-solid fa-filter-circle-xmark mr-1.5"></i>Limpiar<span data-contador class="ml-1.5 hidden rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-bold text-violet-300"></span></button>' +
            '</div>' +
            '<div class="overflow-x-auto"><table class="tabla-mov w-full min-w-[44rem] text-left text-sm">' +
                '<thead class="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500"><tr>' +
                    '<th class="px-5 py-3 font-semibold">Hora</th><th class="px-5 py-3 font-semibold">Usuario</th><th class="px-5 py-3 font-semibold">Rol</th><th class="px-5 py-3 font-semibold">Acción</th><th class="px-5 py-3 font-semibold">Detalle</th><th class="px-5 py-3 font-semibold">IP</th>' +
                '</tr></thead><tbody data-cuerpo class="divide-y divide-slate-800/70 transition-opacity"></tbody></table></div>' +
            '<div data-vacio class="vacio-mov hidden"><div class="icono"><i class="fa-solid fa-inbox"></i></div>' +
                '<p data-vacio-titulo class="text-sm font-medium text-slate-400"></p><p data-vacio-texto class="mx-auto mt-0.5 max-w-md text-xs text-slate-600"></p></div>' +
            '<div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-3">' +
                '<p data-info class="text-xs text-slate-500"></p><div data-pag class="flex items-center gap-1"></div></div>';

        var s = { clave: clave, el: el, pedido: 0, temporizador: null, primera: primera };
        function campo(n) { return el.querySelector('[data-campo="' + n + '"]'); }
        var nombres = ['q', 'accion', 'rol', 'desde', 'hasta', 'ip', 'orden'];

        function filtrosActivos() {
            var n = 0;
            nombres.forEach(function (k) {
                var c = campo(k); if (!c) return;
                if (k === 'orden' ? c.value !== 'reciente' : c.value.trim() !== '') n++;
            });
            return n;
        }

        s.cargar = async function (pagina) {
            var n = filtrosActivos();
            var cont = el.querySelector('[data-contador]');
            cont.textContent = n; cont.classList.toggle('hidden', n === 0);

            var cuerpo = el.querySelector('[data-cuerpo]');
            cuerpo.style.opacity = '0.45';
            var mi = ++s.pedido;

            var q = new URLSearchParams({ tab: tabActual, seccion: clave, page: pagina || 1 });
            nombres.forEach(function (k) { var c = campo(k); if (c && c.value.trim() !== '') q.set(k, c.value.trim()); });
            if (s.primera) q.set('conteos', '1');

            try {
                var r = await P.api('/movimientos?' + q.toString());
                if (mi !== s.pedido) return;
                if (r.conteos) pintarConteos(r.conteos);
                llenarAcciones(r.acciones);
                dibujarFilas(r.datos);
                dibujarPaginacion(r);
                dibujarVacio(r.total === 0, n);
            } catch (e) {
                if (mi !== s.pedido || e.estado === 401) return;
                toast(e.estado === 422 ? 'Revisa los filtros' : 'No se pudo cargar el historial',
                      e.estado ? (e.message || 'Intenta de nuevo.') : 'No se pudo contactar al servidor.');
            } finally {
                if (mi === s.pedido) cuerpo.style.opacity = '1';
            }
        };

        function llenarAcciones(lista) {
            var c = campo('accion'); if (!c) return;
            var elegida = c.value;
            c.innerHTML = '<option value="">Acción: Todas</option>' + (lista || []).map(function (a) {
                return '<option value="' + P.esc(a) + '">' + P.esc(infoAccion(a).texto) + '</option>';
            }).join('');
            c.value = (lista || []).indexOf(elegida) >= 0 ? elegida : '';
        }

        function dibujarFilas(filas) {
            var html = '', diaPrevio = null;
            filas.forEach(function (f) {
                var dia = claveDia(f.fecha);
                if (dia !== diaPrevio) {
                    html += '<tr class="fila-dia"><td colspan="6">' + P.esc(etiquetaDia(dia)) + '</td></tr>';
                    diaPrevio = dia;
                }
                var a = infoAccion(f.accion);
                var usuario = f.nombre
                    ? '<div class="flex items-center gap-2.5">' +
                        '<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/80 to-indigo-600/80 text-[11px] font-bold text-white">' + P.esc(iniciales(f.nombre)) + '</span>' +
                        '<div class="min-w-0"><p class="truncate font-semibold text-slate-200">' + P.esc(f.nombre) +
                        '</p><p class="truncate text-xs text-slate-500">' + P.esc(f.correo || '') + '</p></div></div>'
                    : '<span class="text-xs italic text-slate-500">Cuenta eliminada o desconocida</span>';
                html += '<tr class="fila-mov align-middle transition-colors hover:bg-slate-800/40">' +
                    '<td class="c-hora whitespace-nowrap px-5 text-slate-400">' + P.esc(hora(f.fecha)) + '</td>' +
                    '<td class="c-usuario px-5">' + usuario + '</td>' +
                    '<td class="c-rol px-5">' + (f.rol ? '<span class="pildora ring-1 ' + (COLORES_ROL[f.rol] || COLORES.sky) + '">' + P.esc(mayuscula(f.rol)) + '</span>' : '<span class="text-slate-600">—</span>') + '</td>' +
                    '<td class="c-accion px-5"><span class="pildora ring-1 ' + COLORES[a.color] + '">' + P.esc(a.texto) + '</span></td>' +
                    '<td class="c-detalle px-5 text-slate-400">' + P.esc(f.detalle || '—') + '</td>' +
                    '<td class="c-ip whitespace-nowrap px-5 text-slate-400" title="' + P.esc(f.dispositivo || '') + '">' + P.esc(f.ip || '—') + '</td>' +
                '</tr>';
            });
            el.querySelector('[data-cuerpo]').innerHTML = html;
        }

        function dibujarVacio(vacio, filtros) {
            el.querySelector('[data-vacio]').classList.toggle('hidden', !vacio);
            if (!vacio) return;
            el.querySelector('[data-vacio-titulo]').textContent = filtros ? 'Ningún movimiento coincide con estos filtros' : 'Todavía no hay movimientos aquí';
            el.querySelector('[data-vacio-texto]').textContent = filtros ? 'Prueba quitando algún filtro o con “Limpiar”.' : d.vacio;
        }

        function dibujarPaginacion(r) {
            el.querySelector('[data-info]').textContent = r.total === 0 ? 'Sin resultados'
                : 'Mostrando ' + r.desde + '–' + r.hasta + ' de ' + r.total + ' movimientos';
            var cont = el.querySelector('[data-pag]');
            cont.innerHTML = '';
            if (r.ultima_pagina <= 1) return;

            function boton(texto, destino, activo, off) {
                var b = document.createElement('button');
                b.type = 'button'; b.innerHTML = texto; b.disabled = off;
                b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg px-2 text-xs font-medium transition-all ' +
                    (activo ? 'bg-violet-600 text-white shadow shadow-violet-600/30'
                            : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200') +
                    (off ? ' cursor-not-allowed opacity-40' : '');
                if (!off && !activo) b.addEventListener('click', function () { s.cargar(destino); });
                cont.appendChild(b);
            }
            boton('<i class="fa-solid fa-chevron-left"></i>', r.pagina_actual - 1, false, r.pagina_actual <= 1);
            var ini = Math.max(1, r.pagina_actual - 1), fin = Math.min(r.ultima_pagina, ini + 2);
            for (var p = ini; p <= fin; p++) boton(p, p, p === r.pagina_actual, false);
            boton('<i class="fa-solid fa-chevron-right"></i>', r.pagina_actual + 1, false, r.pagina_actual >= r.ultima_pagina);
        }

        // Eventos de los filtros de esta tabla
        function conEspera() { clearTimeout(s.temporizador); s.temporizador = setTimeout(function () { s.cargar(1); }, 300); }
        ['q', 'ip'].forEach(function (k) { campo(k).addEventListener('input', conEspera); });
        ['accion', 'rol', 'desde', 'hasta', 'orden'].forEach(function (k) {
            var c = campo(k); if (c) c.addEventListener('change', function () { s.cargar(1); });
        });
        el.querySelector('[data-limpiar]').addEventListener('click', function () {
            nombres.forEach(function (k) { var c = campo(k); if (c) c.value = (k === 'orden' ? 'reciente' : ''); });
            s.cargar(1);
        });

        return s;
    }

    /* ================= Invitados (visitantes sin cuenta) ================= */
    function fechaCorta(texto) {
        if (!texto) return '—';
        return etiquetaDia(claveDia(texto)) + ' · ' + hora(texto);
    }
    function tipoContacto(c) { return /@/.test(String(c || '')) ? 'fa-envelope' : 'fa-phone'; }
    function nombreVisitante(v) { return v.nombre ? v.nombre : 'Invitado #' + v.id; }

    var DEF_INV = {
        visitantes: {
            url: '/invitados',
            vacio: 'Aquí aparecerá cada visitante que entre al portal sin cuenta (se guardan desde que el panel de invitado empiece a enviar su actividad).',
            filtros: '<select data-campo="solo_contacto" aria-label="Dejaron datos" class="' + INP + '"><option value="">Todos los visitantes</option><option value="1">Solo los que dejaron sus datos</option></select>',
            ordenes: '<option value="reciente">Visita más reciente</option><option value="antiguo">Visita más antigua</option><option value="mas_visitas">Más entradas primero</option>',
            cabecera: '<th class="px-5 py-3 font-semibold">Visitante</th><th class="px-5 py-3 font-semibold">Entradas</th><th class="px-5 py-3 font-semibold">Publicaciones vistas</th><th class="px-5 py-3 font-semibold">Favoritos</th><th class="px-5 py-3 font-semibold">Última visita</th><th class="px-5 py-3 font-semibold">IP</th><th class="px-5 py-3 font-semibold"></th>',
            fila: function (v) {
                var quien = '<div class="flex items-center gap-2.5">' +
                    '<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/80 to-indigo-600/80 text-[11px] font-bold text-white">' + (v.nombre ? P.esc(iniciales(v.nombre)) : '<i class="fa-solid fa-user"></i>') + '</span>' +
                    '<div class="min-w-0"><p class="truncate font-semibold text-slate-200">' + P.esc(nombreVisitante(v)) + '</p>' +
                    '<p class="truncate text-xs text-slate-500">' + (v.contacto ? '<i class="fa-solid ' + tipoContacto(v.contacto) + ' mr-1"></i>' + P.esc(v.contacto) : 'No dejó datos de contacto') + '</p></div></div>';
                return '<tr class="fila-mov align-middle transition-colors hover:bg-slate-800/40">' +
                    '<td class="c-usuario px-5">' + quien + '</td>' +
                    '<td class="c-stat px-5 text-slate-300" data-et="Entradas">' + v.visitas + '</td>' +
                    '<td class="c-stat px-5 text-slate-300" data-et="Publicaciones vistas">' + v.publicaciones_vistas + '</td>' +
                    '<td class="c-stat px-5 text-slate-300" data-et="Favoritos">' + v.favoritos + '</td>' +
                    '<td class="c-fecha px-5 text-slate-400">' + P.esc(fechaCorta(v.ultima_visita)) + '</td>' +
                    '<td class="c-ip whitespace-nowrap px-5 text-slate-400" title="' + P.esc(v.dispositivo || '') + '">' + P.esc(v.ip || '—') + '</td>' +
                    '<td class="c-ver px-5"><button type="button" class="btn-ver" data-ver="' + v.id + '"><i class="fa-solid fa-eye"></i>Ver</button></td></tr>';
            },
            unidad: 'visitantes', vacioFiltro: 'Ningún visitante coincide con estos filtros'
        },
        contactos: {
            url: '/invitados/contactos',
            vacio: 'Aquí aparecerán las personas que dejen su nombre y contacto en “Contactar al vendedor”.',
            filtros: '',
            ordenes: '<option value="reciente">Más recientes primero</option><option value="antiguo">Más antiguos primero</option>',
            cabecera: '<th class="px-5 py-3 font-semibold">Persona</th><th class="px-5 py-3 font-semibold">Publicación</th><th class="px-5 py-3 font-semibold">Fecha</th><th class="px-5 py-3 font-semibold"></th>',
            fila: function (c) {
                var quien = '<div class="min-w-0"><p class="truncate font-semibold text-slate-200">' + P.esc(c.nombre || '—') + '</p>' +
                    '<p class="truncate text-xs text-slate-500"><i class="fa-solid ' + tipoContacto(c.contacto) + ' mr-1"></i>' + P.esc(c.contacto || '—') + '</p></div>';
                return '<tr class="fila-mov align-middle transition-colors hover:bg-slate-800/40">' +
                    '<td class="c-usuario px-5">' + quien + '</td>' +
                    '<td class="c-detalle px-5 text-slate-400">' + P.esc(c.publicacion) + '</td>' +
                    '<td class="c-fecha px-5 text-slate-400">' + P.esc(fechaCorta(c.fecha)) + '</td>' +
                    '<td class="c-ver px-5"><button type="button" class="btn-ver" data-ver="' + c.invitado_id + '"><i class="fa-solid fa-eye"></i>Ver</button></td></tr>';
            },
            unidad: 'contactos', vacioFiltro: 'Ningún contacto coincide con estos filtros'
        }
    };

    function crearSeccionInv(clave, primera) {
        var d = DEF_INV[clave];
        var el = document.createElement('div');
        el.innerHTML =
            '<div class="filtros-mov border-b border-slate-800 p-3.5">' +
                '<div class="relative ancho"><i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500"></i>' +
                    '<input type="search" data-campo="q" placeholder="Nombre, contacto o IP…" autocomplete="off" class="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"></div>' +
                d.filtros +
                '<label class="campo-fecha"><span>Desde</span><input type="date" data-campo="desde" class="' + INP + '"></label>' +
                '<label class="campo-fecha"><span>Hasta</span><input type="date" data-campo="hasta" class="' + INP + '"></label>' +
                '<select data-campo="orden" aria-label="Orden" class="' + INP + '">' + d.ordenes + '</select>' +
                '<button type="button" data-limpiar class="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800"><i class="fa-solid fa-filter-circle-xmark mr-1.5"></i>Limpiar<span data-contador class="ml-1.5 hidden rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-bold text-violet-300"></span></button>' +
            '</div>' +
            '<div class="overflow-x-auto"><table class="tabla-mov w-full min-w-[44rem] text-left text-sm">' +
                '<thead class="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500"><tr>' + d.cabecera + '</tr></thead>' +
                '<tbody data-cuerpo class="divide-y divide-slate-800/70 transition-opacity"></tbody></table></div>' +
            '<div data-vacio class="vacio-mov hidden"><div class="icono"><i class="fa-solid fa-inbox"></i></div>' +
                '<p data-vacio-titulo class="text-sm font-medium text-slate-400"></p><p data-vacio-texto class="mx-auto mt-0.5 max-w-md text-xs text-slate-600"></p></div>' +
            '<div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-3">' +
                '<p data-info class="text-xs text-slate-500"></p><div data-pag class="flex items-center gap-1"></div></div>';

        var s = { clave: clave, el: el, pedido: 0, temporizador: null };
        function campo(n) { return el.querySelector('[data-campo="' + n + '"]'); }
        var nombres = ['q', 'solo_contacto', 'desde', 'hasta', 'orden'];

        function filtrosActivos() {
            var n = 0;
            nombres.forEach(function (k) {
                var c = campo(k); if (!c) return;
                if (k === 'orden' ? c.value !== 'reciente' : c.value.trim() !== '') n++;
            });
            return n;
        }

        s.cargar = async function (pagina) {
            var n = filtrosActivos();
            var cont = el.querySelector('[data-contador]');
            cont.textContent = n; cont.classList.toggle('hidden', n === 0);
            var cuerpo = el.querySelector('[data-cuerpo]');
            cuerpo.style.opacity = '0.45';
            var mi = ++s.pedido;

            var q = new URLSearchParams({ page: pagina || 1 });
            nombres.forEach(function (k) { var c = campo(k); if (c && c.value.trim() !== '') q.set(k, c.value.trim()); });

            try {
                var r = await P.api(d.url + '?' + q.toString());
                if (mi !== s.pedido) return;
                cuerpo.innerHTML = r.datos.map(d.fila).join('');
                dibujarPag(r);
                var vacio = r.total === 0;
                el.querySelector('[data-vacio]').classList.toggle('hidden', !vacio);
                if (vacio) {
                    el.querySelector('[data-vacio-titulo]').textContent = n ? d.vacioFiltro : 'Todavía no hay registros aquí';
                    el.querySelector('[data-vacio-texto]').textContent = n ? 'Prueba quitando algún filtro o con “Limpiar”.' : d.vacio;
                }
            } catch (e) {
                if (mi !== s.pedido || e.estado === 401) return;
                toast(e.estado === 422 ? 'Revisa los filtros' : 'No se pudo cargar el historial',
                      e.estado ? (e.message || 'Intenta de nuevo.') : 'No se pudo contactar al servidor.');
            } finally {
                if (mi === s.pedido) cuerpo.style.opacity = '1';
            }
        };

        function dibujarPag(r) {
            el.querySelector('[data-info]').textContent = r.total === 0 ? 'Sin resultados'
                : 'Mostrando ' + r.desde + '–' + r.hasta + ' de ' + r.total + ' ' + d.unidad;
            var cont = el.querySelector('[data-pag]');
            cont.innerHTML = '';
            if (r.ultima_pagina <= 1) return;
            function boton(texto, destino, activo, off) {
                var b = document.createElement('button');
                b.type = 'button'; b.innerHTML = texto; b.disabled = off;
                b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg px-2 text-xs font-medium transition-all ' +
                    (activo ? 'bg-violet-600 text-white shadow shadow-violet-600/30'
                            : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200') +
                    (off ? ' cursor-not-allowed opacity-40' : '');
                if (!off && !activo) b.addEventListener('click', function () { s.cargar(destino); });
                cont.appendChild(b);
            }
            boton('<i class="fa-solid fa-chevron-left"></i>', r.pagina_actual - 1, false, r.pagina_actual <= 1);
            var ini = Math.max(1, r.pagina_actual - 1), fin = Math.min(r.ultima_pagina, ini + 2);
            for (var p = ini; p <= fin; p++) boton(p, p, p === r.pagina_actual, false);
            boton('<i class="fa-solid fa-chevron-right"></i>', r.pagina_actual + 1, false, r.pagina_actual >= r.ultima_pagina);
        }

        function conEspera() { clearTimeout(s.temporizador); s.temporizador = setTimeout(function () { s.cargar(1); }, 300); }
        campo('q').addEventListener('input', conEspera);
        ['solo_contacto', 'desde', 'hasta', 'orden'].forEach(function (k) {
            var c = campo(k); if (c) c.addEventListener('change', function () { s.cargar(1); });
        });
        el.querySelector('[data-limpiar]').addEventListener('click', function () {
            nombres.forEach(function (k) { var c = campo(k); if (c) c.value = (k === 'orden' ? 'reciente' : ''); });
            s.cargar(1);
        });
        el.addEventListener('click', function (e) {
            var b = e.target.closest('[data-ver]');
            if (b) abrirVisitante(b.getAttribute('data-ver'));
        });
        return s;
    }

    /* ---- Ventana "Ver": qué ha hecho este visitante ---- */
    var modal = document.getElementById('modal-inv');
    var modalPedido = 0;

    function bloque(titulo, filas, vacio) {
        return '<section><h3>' + P.esc(titulo) + '</h3>' +
            (filas.length ? '<div class="lista-inv">' + filas.join('') + '</div>' : '<p class="text-xs text-slate-500">' + P.esc(vacio) + '</p>') + '</section>';
    }
    function fila2(izq, der) { return '<div><span>' + izq + '</span><span>' + der + '</span></div>'; }

    async function abrirVisitante(id) {
        var mi = ++modalPedido;
        document.getElementById('modal-inv-titulo').textContent = 'Cargando…';
        document.getElementById('modal-inv-cuerpo').innerHTML = '';
        modal.hidden = false;
        try {
            var r = await P.api('/invitados/' + encodeURIComponent(id));
            if (mi !== modalPedido) return;
            var v = r.visitante;
            document.getElementById('modal-inv-titulo').textContent = nombreVisitante(v);
            var datos = [
                ['Entradas', v.visitas], ['Primera visita', fechaCorta(v.primera_visita)], ['Última visita', fechaCorta(v.ultima_visita)],
                ['Contacto', v.contacto || 'No dejó datos'], ['IP (parcial)', v.ip || '—'], ['Idioma', v.idioma || '—'], ['Zona horaria', v.zona_horaria || '—']
            ].map(function (x) { return '<div><small>' + P.esc(x[0]) + '</small><b>' + P.esc(x[1]) + '</b></div>'; }).join('');
            document.getElementById('modal-inv-cuerpo').innerHTML =
                '<section><h3>Resumen</h3><div class="dato-grid">' + datos + '</div></section>' +
                bloque('Favoritos (' + r.favoritos.length + ')', r.favoritos.map(function (f) { return fila2(P.esc(f.publicacion), P.esc(fechaCorta(f.fecha))); }), 'No tiene publicaciones en favoritos.') +
                bloque('Publicaciones que abrió (' + r.publicaciones.length + ')', r.publicaciones.map(function (p) {
                    return fila2(P.esc(p.publicacion), p.veces + (p.veces === 1 ? ' vez' : ' veces'));
                }), 'Todavía no abrió ninguna publicación.') +
                bloque('Contactos que dejó (' + r.contactos.length + ')', r.contactos.map(function (c) {
                    return fila2(P.esc(c.nombre) + ' · ' + P.esc(c.contacto) + '<span class="nota">' + P.esc(c.publicacion) + '</span>', P.esc(fechaCorta(c.fecha)));
                }), 'No ha dejado sus datos.') +
                bloque('Últimas entradas', r.entradas.map(function (f) { return fila2(P.esc(fechaCorta(f)), ''); }), 'Sin entradas registradas.');
        } catch (e) {
            if (mi !== modalPedido) return;
            modal.hidden = true;
            if (e.estado !== 401) toast('No se pudo cargar el visitante', e.estado ? (e.message || 'Intenta de nuevo.') : 'No se pudo contactar al servidor.');
        }
    }
    function cerrarVisitante() { modalPedido++; modal.hidden = true; }
    document.getElementById('modal-inv-cerrar').addEventListener('click', cerrarVisitante);
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarVisitante(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) cerrarVisitante(); });

    /* ================= Pestañas ================= */
    var conteosSubs = null;   // { seguridad: {seguridad, accesos}, inmobiliaria: {seguridad, accesos, acciones}, ... }

    function pintarConteos(c) {
        Object.keys(c).forEach(function (k) {
            if (k === 'subs') { conteosSubs = c[k]; return; }
            var e = document.querySelector('[data-cuenta="' + k + '"]');
            if (e) e.textContent = c[k];
        });
        pintarSubConteos();
    }

    // Número al lado de cada submenú (cambios de contraseña, inicios de sesión, acciones)
    function pintarSubConteos() {
        if (!conteosSubs || !conteosSubs[tabActual]) return;
        document.querySelectorAll('#subpestanas [data-subcuenta]').forEach(function (e) {
            var n = conteosSubs[tabActual][e.getAttribute('data-subcuenta')];
            e.textContent = (n === undefined ? '–' : n);
        });
    }

    var SUBS = {
        seguridad: { texto: 'Cambios de contraseña y bloqueos', icono: 'fa-key' },
        accesos:   { texto: 'Inicios de sesión',                icono: 'fa-right-to-bracket' },
        acciones:  { texto: 'Acciones en su panel',             icono: 'fa-list-check' },
        visitantes: { texto: 'Visitantes',                      icono: 'fa-users' },
        contactos:  { texto: 'Contactos dejados',               icono: 'fa-address-book' }
    };
    var subActual = 'seguridad';
    var primeraCarga = true;

    function elegirTab(tab) {
        tabActual = tab;
        document.querySelectorAll('#pestanas [data-tab]').forEach(function (b) {
            b.classList.toggle('activa', b.getAttribute('data-tab') === tab);
        });
        try { history.replaceState(null, '', '?tab=' + tab); } catch (e) {}

        // Submenú de la pestaña: "Acciones en su panel" solo existe para un rol, no en Seguridad
        var claves = tab === 'invitado' ? ['visitantes', 'contactos']
            : tab === 'seguridad' ? ['seguridad', 'accesos'] : ['seguridad', 'accesos', 'acciones'];
        document.getElementById('subpestanas').innerHTML = claves.map(function (k) {
            return '<button type="button" role="tab" data-sub="' + k + '" class="mov-pestana"><i class="fa-solid ' + SUBS[k].icono + '"></i>' + P.esc(SUBS[k].texto) + '<span class="cuenta" data-subcuenta="' + k + '">–</span></button>';
        }).join('');
        pintarSubConteos();
        elegirSub(claves[0]);
    }

    function elegirSub(sub) {
        subActual = sub;
        document.querySelectorAll('#subpestanas [data-sub]').forEach(function (b) {
            b.classList.toggle('activa', b.getAttribute('data-sub') === sub);
        });
        var cont = document.getElementById('secciones');
        cont.innerHTML = '';
        var esInv = tabActual === 'invitado';
        var s = esInv ? crearSeccionInv(sub) : crearSeccion(sub, primeraCarga);
        // Los números de las pestañas se piden una sola vez, con la primera tabla de seguridad/rol
        if (esInv && primeraCarga) { cargarConteos(); }
        primeraCarga = false;
        secciones = [s];
        cont.appendChild(s.el);
        s.cargar(1);
    }

    // Si se entra directo a Invitados, los números salen de una consulta mínima a Movimientos
    async function cargarConteos() {
        try {
            var r = await P.api('/movimientos?tab=seguridad&seccion=acciones&conteos=1');
            if (r.conteos) pintarConteos(r.conteos);
        } catch (e) { /* los números son un adorno: si falla, no se avisa */ }
    }

    document.getElementById('pestanas').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]');
        if (b && b.getAttribute('data-tab') !== tabActual) elegirTab(b.getAttribute('data-tab'));
    });
    document.getElementById('subpestanas').addEventListener('click', function (e) {
        var b = e.target.closest('[data-sub]');
        if (b && b.getAttribute('data-sub') !== subActual) elegirSub(b.getAttribute('data-sub'));
    });

    /* ================= Arranque ================= */
    P.listo.then(function () {
        var tab = new URLSearchParams(window.location.search).get('tab');
        if (['seguridad', 'administrador', 'inmobiliaria', 'agente', 'vendedor', 'invitado'].indexOf(tab) < 0) tab = 'seguridad';
        elegirTab(tab);
    }).catch(function (error) {
        if (error && error.estado !== 401 && window.console) console.error('Movimientos:', error);
    });
})();
