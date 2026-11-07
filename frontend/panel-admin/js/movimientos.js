/* UMBRAL — Pantalla "Movimientos" del administrador.
   Pide todo a /api/v1/admin/movimientos?tab=...&filtros...
   Pestañas: seguridad | inmobiliaria | agente | vendedor.
   Filtros: nombre o correo, acción, rol (solo seguridad), fechas, IP y orden. */
(function () {
    'use strict';

    var P = window.PanelAdmin;

    var tabActual = 'seguridad';
    var paginaActual = 1;
    var temporizador = null;
    var pedido = 0;                 // para ignorar respuestas viejas si se filtra rápido

    var tabla = document.getElementById('tabla-mov');
    var tablaVacia = document.getElementById('tabla-vacia');
    var campos = {
        q: document.getElementById('buscar'),
        accion: document.getElementById('filtro-accion'),
        rol: document.getElementById('filtro-rol'),
        desde: document.getElementById('filtro-desde'),
        hasta: document.getElementById('filtro-hasta'),
        ip: document.getElementById('filtro-ip'),
        orden: document.getElementById('filtro-orden')
    };

    /* ================= Nombres amigables de las acciones ================= */
    var ACCIONES = {
        login_fallido:           { texto: 'Intento de acceso fallido',       color: 'red' },
        cuenta_bloqueada:        { texto: 'Cuenta bloqueada',                color: 'red' },
        recuperacion_solicitada: { texto: 'Pidió recuperar su contraseña',   color: 'amber' },
        clave_restablecida:      { texto: 'Cambió su contraseña',            color: 'emerald' },
        enlace_enviado_admin:    { texto: 'Se le envió enlace de contraseña', color: 'violet' }
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
    var TITULOS_TAB = { seguridad: 'de seguridad', inmobiliaria: 'de inmobiliarias', agente: 'de agentes', vendedor: 'de vendedores' };

    function mayuscula(texto) {
        texto = String(texto || '');
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    // Si la acción no está en la lista, se muestra legible: "propiedad_publicada" → "Propiedad publicada"
    function infoAccion(clave) {
        if (ACCIONES[clave]) return ACCIONES[clave];
        return { texto: mayuscula(String(clave || '').replace(/_/g, ' ')), color: 'sky' };
    }

    function iniciales(nombre) {
        return String(nombre || '?').trim().split(/\s+/).slice(0, 2)
            .map(function (palabra) { return palabra.charAt(0).toUpperCase(); }).join('');
    }

    // "2026-11-07 14:52:10" → "07/11/2026 · 14:52"
    function formatoFecha(texto) {
        var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(texto || ''));
        return m ? m[3] + '/' + m[2] + '/' + m[1] + ' · ' + m[4] + ':' + m[5] : '—';
    }

    /* ================= Avisos ================= */
    function toast(titulo, mensaje) {
        var e = document.createElement('div');
        e.className = 'flex items-start gap-3 rounded-xl border border-red-500/40 bg-slate-900/95 p-3.5 shadow-2xl shadow-black/50';
        e.innerHTML = '<i class="fa-solid fa-circle-xmark mt-0.5 text-red-400"></i>' +
            '<div class="min-w-0 flex-1"><p class="text-sm font-semibold text-slate-100">' + P.esc(titulo) + '</p>' +
            '<p class="mt-0.5 text-xs text-slate-400">' + P.esc(mensaje || '') + '</p></div>';
        document.getElementById('contenedor-toasts').appendChild(e);
        setTimeout(function () { e.remove(); }, 5000);
    }

    /* ================= Filtros ================= */
    function filtrosActivos() {
        var n = 0;
        ['q', 'accion', 'desde', 'hasta', 'ip'].forEach(function (k) { if (campos[k].value.trim()) n++; });
        if (tabActual === 'seguridad' && campos.rol.value) n++;
        if (campos.orden.value !== 'reciente') n++;
        return n;
    }

    function actualizarContador() {
        var n = filtrosActivos();
        var c = document.getElementById('contador-filtros');
        c.textContent = n;
        c.classList.toggle('hidden', n === 0);
    }

    function limpiarFiltros() {
        campos.q.value = '';
        campos.accion.value = '';
        campos.rol.value = '';
        campos.desde.value = '';
        campos.hasta.value = '';
        campos.ip.value = '';
        campos.orden.value = 'reciente';
        cargar(1);
    }

    // El rol solo se filtra en Seguridad: en las otras pestañas la pestaña ya es el rol
    function ajustarFiltrosDeLaPestana() {
        campos.rol.classList.toggle('hidden', tabActual !== 'seguridad');
    }

    function llenarAcciones(lista) {
        var elegida = campos.accion.value;
        campos.accion.innerHTML = '<option value="">Acción: Todas</option>' +
            (lista || []).map(function (a) {
                return '<option value="' + P.esc(a) + '">' + P.esc(infoAccion(a).texto) + '</option>';
            }).join('');
        // Si la acción elegida sigue existiendo, se conserva
        campos.accion.value = (lista || []).indexOf(elegida) >= 0 ? elegida : '';
    }

    /* ================= Cargar y dibujar ================= */
    async function cargar(pagina) {
        paginaActual = pagina || 1;
        actualizarContador();
        tabla.style.opacity = '0.45';
        var miPedido = ++pedido;

        var parametros = new URLSearchParams({ tab: tabActual, page: paginaActual, orden: campos.orden.value });
        ['q', 'accion', 'desde', 'hasta', 'ip'].forEach(function (k) {
            var v = campos[k].value.trim();
            if (v) parametros.set(k, v);
        });
        if (tabActual === 'seguridad' && campos.rol.value) parametros.set('rol', campos.rol.value);

        try {
            var datos = await P.api('/movimientos?' + parametros.toString());
            if (miPedido !== pedido) return;          // llegó una respuesta más nueva
            llenarAcciones(datos.acciones);
            dibujarFilas(datos.datos);
            dibujarPaginacion(datos);
            dibujarVacio(datos.total === 0);
        } catch (error) {
            if (miPedido !== pedido) return;
            if (error.estado === 401) return;
            if (error.estado === 422) { toast('Revisa los filtros', error.message); return; }
            toast('No se pudo cargar el historial', error.estado ? (error.message || 'Intenta de nuevo.') : 'No se pudo contactar al servidor.');
        } finally {
            if (miPedido === pedido) tabla.style.opacity = '1';
        }
    }

    function dibujarFilas(filas) {
        tabla.innerHTML = filas.map(function (f) {
            var a = infoAccion(f.accion);
            var usuario = f.nombre
                ? '<div class="flex items-center gap-3">' +
                    '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/80 to-indigo-600/80 text-xs font-bold text-white">' + P.esc(iniciales(f.nombre)) + '</span>' +
                    '<div class="min-w-0">' +
                        '<p class="truncate font-semibold text-slate-200">' + P.esc(f.nombre) + '</p>' +
                        '<p class="truncate text-xs text-slate-500">' + P.esc(f.correo || '') + '</p>' +
                        (f.rol ? '<span class="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ' + (COLORES_ROL[f.rol] || COLORES.sky) + '">' + P.esc(mayuscula(f.rol)) + '</span>' : '') +
                    '</div></div>'
                : '<span class="text-xs italic text-slate-500">Cuenta eliminada o desconocida</span>';

            return '<tr class="align-top transition-colors hover:bg-slate-800/40">' +
                '<td class="whitespace-nowrap px-5 py-3.5 text-slate-400">' + P.esc(formatoFecha(f.fecha)) + '</td>' +
                '<td class="px-5 py-3.5">' + usuario + '</td>' +
                '<td class="px-5 py-3.5"><span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ' + COLORES[a.color] + '">' + P.esc(a.texto) + '</span></td>' +
                '<td class="px-5 py-3.5 text-slate-400">' + P.esc(f.detalle || '—') + '</td>' +
                '<td class="whitespace-nowrap px-5 py-3.5 text-slate-400" title="' + P.esc(f.dispositivo || '') + '">' + P.esc(f.ip || '—') + '</td>' +
            '</tr>';
        }).join('');
    }

    function dibujarVacio(vacio) {
        tablaVacia.classList.toggle('hidden', !vacio);
        if (!vacio) return;
        var conFiltros = filtrosActivos() > 0;
        document.getElementById('vacio-titulo').textContent = conFiltros
            ? 'Ningún movimiento coincide con estos filtros'
            : 'Todavía no hay movimientos ' + TITULOS_TAB[tabActual];
        document.getElementById('vacio-texto').textContent = conFiltros
            ? 'Prueba quitando algún filtro o con “Limpiar filtros”.'
            : (tabActual === 'seguridad'
                ? 'Aquí aparecerán los intentos de acceso, los bloqueos y los cambios de contraseña.'
                : 'Aparecerán aquí cuando este panel empiece a registrar sus acciones.');
    }

    function dibujarPaginacion(datos) {
        document.getElementById('paginacion-info').textContent =
            datos.total === 0 ? 'Sin resultados' :
            'Mostrando ' + datos.desde + '–' + datos.hasta + ' de ' + datos.total + ' movimientos';

        var contenedor = document.getElementById('paginacion-botones');
        contenedor.innerHTML = '';
        if (datos.ultima_pagina <= 1) return;

        function boton(texto, pagina, activo, deshabilitado) {
            var b = document.createElement('button');
            b.type = 'button';
            b.innerHTML = texto;
            b.disabled = deshabilitado;
            b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg px-2 text-xs font-medium transition-all ' +
                (activo ? 'bg-violet-600 text-white shadow shadow-violet-600/30'
                        : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200') +
                (deshabilitado ? ' cursor-not-allowed opacity-40' : '');
            if (!deshabilitado && !activo) b.addEventListener('click', function () { cargar(pagina); });
            contenedor.appendChild(b);
        }

        boton('<i class="fa-solid fa-chevron-left"></i>', datos.pagina_actual - 1, false, datos.pagina_actual <= 1);
        var inicio = Math.max(1, datos.pagina_actual - 1);
        var fin = Math.min(datos.ultima_pagina, inicio + 2);
        for (var p = inicio; p <= fin; p++) boton(p, p, p === datos.pagina_actual, false);
        boton('<i class="fa-solid fa-chevron-right"></i>', datos.pagina_actual + 1, false, datos.pagina_actual >= datos.ultima_pagina);
    }

    /* ================= Pestañas ================= */
    function elegirTab(tab, recargar) {
        tabActual = tab;
        document.querySelectorAll('#pestanas [data-tab]').forEach(function (b) {
            b.classList.toggle('activa', b.getAttribute('data-tab') === tab);
        });
        ajustarFiltrosDeLaPestana();
        // Cada pestaña empieza con filtros limpios
        campos.q.value = ''; campos.accion.value = ''; campos.rol.value = '';
        campos.desde.value = ''; campos.hasta.value = ''; campos.ip.value = ''; campos.orden.value = 'reciente';
        try { history.replaceState(null, '', '?tab=' + tab); } catch (e) {}
        if (recargar !== false) cargar(1);
    }

    document.getElementById('pestanas').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]');
        if (b && b.getAttribute('data-tab') !== tabActual) elegirTab(b.getAttribute('data-tab'));
    });

    /* ================= Eventos de los filtros ================= */
    function conEspera() {
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { cargar(1); }, 300);
    }
    campos.q.addEventListener('input', conEspera);
    campos.ip.addEventListener('input', conEspera);
    ['accion', 'rol', 'desde', 'hasta', 'orden'].forEach(function (k) {
        campos[k].addEventListener('change', function () { cargar(1); });
    });
    document.getElementById('limpiar').addEventListener('click', limpiarFiltros);

    /* ================= Arranque ================= */
    P.listo.then(function () {
        var tab = new URLSearchParams(window.location.search).get('tab');
        if (['seguridad', 'inmobiliaria', 'agente', 'vendedor'].indexOf(tab) < 0) tab = 'seguridad';
        elegirTab(tab);
    }).catch(function (error) {
        if (error && error.estado !== 401 && window.console) console.error('Movimientos:', error);
    });
})();
