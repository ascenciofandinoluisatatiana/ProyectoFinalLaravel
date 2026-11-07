/* UMBRAL — Pantalla "Membresías" del administrador.
   API: GET /api/v1/admin/membresias            (cifras, planes y lista paginada)
        PUT /api/v1/admin/membresias/planes/{plan}   (cambiar precio)
        POST /api/v1/admin/membresias/{id}/cancelar  (cancelar una membresía) */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var tabla = document.getElementById('tabla-membresias');
    var tablaVacia = document.getElementById('tabla-vacia');
    var aviso = document.getElementById('aviso');
    var paginaActual = 1;
    var temporizador = null;

    var ESTADOS = {
        vigente:    { texto: 'Vigente',    clase: 'bg-emerald-500/10 text-emerald-300', punto: 'bg-emerald-400' },
        por_vencer: { texto: 'Por vencer', clase: 'bg-amber-500/10 text-amber-300',     punto: 'bg-amber-400' },
        vencida:    { texto: 'Vencida',    clase: 'bg-red-500/10 text-red-300',         punto: 'bg-red-400' },
        cancelada:  { texto: 'Cancelada',  clase: 'bg-slate-500/10 text-slate-400',     punto: 'bg-slate-500' }
    };

    function conPuntos(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    function pesos(n) { return '$' + conPuntos(n); }

    function fecha(texto) {           // 2026-10-21 → 21/10/2026
        var p = String(texto || '').split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—';
    }

    function mostrarAviso(texto, correcto) {
        aviso.textContent = texto;
        aviso.className = 'rounded-xl px-4 py-3 text-sm ring-1 ' + (correcto
            ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
            : 'bg-red-500/10 text-red-400 ring-red-500/30');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ----- Cifras ----- */
    function pintarResumen(r) {
        document.getElementById('valor-vigentes').textContent = conPuntos(r.vigentes);
        document.getElementById('valor-por-vencer').textContent = conPuntos(r.por_vencer);
        document.getElementById('valor-vencidas').textContent = conPuntos(r.vencidas);
        document.getElementById('valor-ingresos-mes').textContent = pesos(r.ingresos_mes);
    }

    /* ----- Planes y precios ----- */
    function pintarPlanes(planes) {
        // No se redibujan si la persona está escribiendo un precio
        if (document.activeElement && document.activeElement.hasAttribute('data-precio')) return;

        document.getElementById('planes').innerHTML = planes.map(function (p) {
            return '<div class="rounded-xl border border-slate-800 bg-slate-950/40 p-4">' +
                '<div class="flex items-center justify-between">' +
                    '<p class="font-bold text-white">' + P.esc(p.nombre) + '</p>' +
                    '<span class="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">' + p.dias + ' días</span>' +
                '</div>' +
                '<p class="mt-1 text-xs text-slate-500">' + p.activas + (p.activas === 1 ? ' membresía vigente' : ' membresías vigentes') + '</p>' +
                '<label class="mb-1.5 mt-4 block text-xs font-medium text-slate-400" for="precio-' + p.plan + '">Precio (COP)</label>' +
                '<div class="flex gap-2">' +
                    '<input id="precio-' + p.plan + '" data-precio="' + p.plan + '" type="number" min="1000" step="100" value="' + Math.round(p.precio) + '"' +
                        ' class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20">' +
                    '<button type="button" data-guardar="' + p.plan + '" class="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]">' +
                        '<i class="fa-solid fa-floppy-disk"></i></button>' +
                '</div>' +
                '<p id="error-precio-' + p.plan + '" class="mt-1.5 text-xs text-red-400"></p>' +
            '</div>';
        }).join('');
    }

    async function guardarPrecio(plan, boton) {
        var campo = document.getElementById('precio-' + plan);
        var error = document.getElementById('error-precio-' + plan);
        error.textContent = '';
        boton.disabled = true;
        try {
            var r = await P.api('/membresias/planes/' + plan, { metodo: 'PUT', cuerpo: { precio: campo.value } });
            campo.blur();
            pintarPlanes(r.planes);
            mostrarAviso(r.mensaje, true);
        } catch (e) {
            var errores = (e.datos && e.datos.errors) || {};
            if (errores.precio) error.textContent = errores.precio[0];
            else mostrarAviso(e.message, false);
        } finally {
            boton.disabled = false;
        }
    }

    /* ----- Tabla ----- */
    function vigencia(m) {
        var extra = '';
        if (m.estado === 'por_vencer') extra = ' · ' + (m.dias_restantes === 0 ? 'vence hoy' : 'faltan ' + m.dias_restantes + ' d');
        if (m.estado === 'vigente') extra = ' · faltan ' + m.dias_restantes + ' d';
        return fecha(m.fecha_inicio) + ' → ' + fecha(m.fecha_fin) + '<span class="text-slate-600">' + extra + '</span>';
    }

    function dibujarFilas(lista) {
        tabla.innerHTML = lista.map(function (m) {
            var e = ESTADOS[m.estado] || ESTADOS.vigente;
            var puedeCancelar = m.estado === 'vigente' || m.estado === 'por_vencer' || m.estado === 'vencida';
            return '<tr class="transition-colors hover:bg-slate-800/40">' +
                '<td class="px-5 py-3.5"><p class="truncate font-semibold text-slate-200">' + P.esc(m.usuario) + '</p>' +
                    '<p class="truncate text-xs text-slate-500">' + P.esc(m.correo || '') + (m.rol ? ' · ' + P.esc(m.rol) : '') + '</p></td>' +
                '<td class="px-5 py-3.5 text-slate-300">' + P.esc(m.nombre_plan) + '</td>' +
                '<td class="px-5 py-3.5"><p class="font-semibold text-slate-200">' + pesos(m.precio) + '</p>' +
                    '<p class="text-xs text-slate-500">' + P.esc(m.referencia || 'Sin referencia') + '</p></td>' +
                '<td class="px-5 py-3.5 text-xs text-slate-400">' + vigencia(m) + '</td>' +
                '<td class="px-5 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + e.clase + '">' +
                    '<span class="h-1.5 w-1.5 rounded-full ' + e.punto + '"></span>' + e.texto + '</span></td>' +
                '<td class="px-5 py-3.5 text-right">' + (puedeCancelar
                    ? '<button type="button" data-cancelar="' + m.id + '" title="Cancelar membresía" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400" style="margin-left:auto"><i class="fa-solid fa-ban text-xs"></i></button>'
                    : '') + '</td>' +
            '</tr>';
        }).join('');
    }

    function dibujarPaginacion(d) {
        document.getElementById('paginacion-info').textContent =
            d.total === 0 ? 'Sin resultados' : 'Mostrando ' + d.desde + '–' + d.hasta + ' de ' + d.total + ' membresías';

        var contenedor = document.getElementById('paginacion-botones');
        contenedor.innerHTML = '';
        if (d.ultima_pagina <= 1) return;

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

        boton('<i class="fa-solid fa-chevron-left"></i>', d.pagina_actual - 1, false, d.pagina_actual <= 1);
        var inicio = Math.max(1, d.pagina_actual - 1);
        var fin = Math.min(d.ultima_pagina, inicio + 2);
        for (var p = inicio; p <= fin; p++) boton(p, p, p === d.pagina_actual, false);
        boton('<i class="fa-solid fa-chevron-right"></i>', d.pagina_actual + 1, false, d.pagina_actual >= d.ultima_pagina);
    }

    async function cargar(pagina) {
        paginaActual = pagina || 1;
        tabla.style.opacity = '0.45';
        var parametros = new URLSearchParams({
            page: paginaActual,
            q: document.getElementById('buscar').value.trim(),
            estado: document.getElementById('filtro-estado').value,
            plan: document.getElementById('filtro-plan').value
        });
        try {
            var d = await P.api('/membresias?' + parametros.toString());
            pintarResumen(d.resumen);
            pintarPlanes(d.planes);
            dibujarFilas(d.datos);
            dibujarPaginacion(d);
            tablaVacia.classList.toggle('hidden', d.datos.length > 0);
        } catch (e) {
            if (e.estado !== 401) mostrarAviso(e.message || 'No se pudieron cargar las membresías.', false);
        } finally {
            tabla.style.opacity = '1';
        }
    }

    /* ----- Eventos ----- */
    document.getElementById('buscar').addEventListener('input', function () {
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { cargar(1); }, 350);
    });
    ['filtro-estado', 'filtro-plan'].forEach(function (id) {
        document.getElementById(id).addEventListener('change', function () { cargar(1); });
    });

    document.addEventListener('click', async function (evento) {
        var guardar = evento.target.closest('[data-guardar]');
        if (guardar) { guardarPrecio(guardar.getAttribute('data-guardar'), guardar); return; }

        var cancelar = evento.target.closest('[data-cancelar]');
        if (cancelar) {
            if (!window.confirm('¿Cancelar esta membresía? La cuenta dejará de tener posicionamiento. Esta acción no se puede deshacer.')) return;
            cancelar.disabled = true;
            try {
                var r = await P.api('/membresias/' + cancelar.getAttribute('data-cancelar') + '/cancelar', { metodo: 'POST' });
                mostrarAviso(r.mensaje, true);
                cargar(paginaActual);
            } catch (e) {
                mostrarAviso(e.message, false);
                cancelar.disabled = false;
            }
        }
    });

    // Cuando el panel confirma la sesión, pedimos los datos
    P.listo.then(function () { cargar(1); }).catch(function () {});
})();
