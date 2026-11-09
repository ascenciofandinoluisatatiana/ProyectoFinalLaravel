/* =========================================================
   UMBRAL — Contactos del vendedor (sección navegable)
   Datos reales: GET /api/v1/vendedor/contactos
   Cambiar el estado: PATCH /api/v1/vendedor/contactos/{id}
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor;
    var usuario = V.guardia();
    if (!usuario) return;

    V.barra(usuario, 'contactos');

    var ESTADOS = { nuevo: 'Nuevo', en_seguimiento: 'En seguimiento', cerrado: 'Cerrado', descartado: 'Descartado' };
    var ORDEN_ESTADOS = ['nuevo', 'en_seguimiento', 'cerrado', 'descartado'];
    var OPERACIONES = {
        venta: { texto: 'Venta', icono: 'fa-house-circle-check' },
        arriendo: { texto: 'Arriendo', icono: 'fa-key' }
    };
    var POR_PAGINA = 15;
    var DIA = 86400000;

    var contactos = [];
    var visibles = POR_PAGINA;
    var f = { estado: 'todos', operacion: 'todas', inmueble: 'todos', periodo: 'todo', orden: 'recientes', q: '' };

    function $(id) { return document.getElementById(id); }

    /* ---------- Utilidades ---------- */
    function normalizar(t) {
        return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    function inicioDeHoy() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
    function esCorreo(c) { return String(c.contacto).indexOf('@') !== -1; }
    function digitos(c) { return String(c.contacto).replace(/\D/g, ''); }
    function telefonoInternacional(c) { var d = digitos(c); return d.length === 10 ? '57' + d : d; }
    function operacionDe(c) { return (c.propiedad && c.propiedad.operacion) || 'venta'; }
    function tituloDe(c) { return (c.propiedad && c.propiedad.titulo) || 'Inmueble eliminado'; }

    /* ---------- Filtros ---------- */
    function pasaFiltros(c, ignorarEstado) {
        if (!ignorarEstado && f.estado !== 'todos' && c.estado !== f.estado) return false;
        if (f.operacion !== 'todas' && operacionDe(c) !== f.operacion) return false;
        if (f.inmueble !== 'todos' && String(c.propiedad && c.propiedad.id) !== f.inmueble) return false;

        if (f.periodo !== 'todo') {
            var desde = inicioDeHoy() - (f.periodo === 'hoy' ? 0 : (Number(f.periodo) - 1) * DIA);
            if (new Date(c.fecha).getTime() < desde) return false;
        }
        if (f.q) {
            var pajar = normalizar([c.nombre, c.contacto, c.mensaje, tituloDe(c)].join(' '));
            var palabras = normalizar(f.q).split(/\s+/).filter(Boolean);
            for (var i = 0; i < palabras.length; i++) if (pajar.indexOf(palabras[i]) === -1) return false;
        }
        return true;
    }

    function hayFiltros() {
        return f.estado !== 'todos' || f.operacion !== 'todas' || f.inmueble !== 'todos' || f.periodo !== 'todo' || f.q !== '';
    }

    function ordenar(lista) {
        var copia = lista.slice();
        var porFecha = function (a, b) { return new Date(b.fecha) - new Date(a.fecha); };
        if (f.orden === 'antiguos') copia.sort(function (a, b) { return -porFecha(a, b); });
        else if (f.orden === 'nombre') copia.sort(function (a, b) { return normalizar(a.nombre).localeCompare(normalizar(b.nombre), 'es') || porFecha(a, b); });
        else if (f.orden === 'inmueble') copia.sort(function (a, b) { return normalizar(tituloDe(a)).localeCompare(normalizar(tituloDe(b)), 'es') || porFecha(a, b); });
        else copia.sort(porFecha);
        return copia;
    }

    /* ---------- Agrupación ---------- */
    function grupoDe(c) {
        if (f.orden === 'nombre') {
            var l = normalizar(c.nombre).charAt(0).toUpperCase();
            return /[A-Z]/.test(l) ? l : '#';
        }
        if (f.orden === 'inmueble') return tituloDe(c);
        var t = new Date(c.fecha).getTime(), hoy = inicioDeHoy();
        if (t >= hoy) return 'Hoy';
        if (t >= hoy - DIA) return 'Ayer';
        if (t >= hoy - 6 * DIA) return 'Últimos 7 días';
        if (t >= hoy - 29 * DIA) return 'Últimos 30 días';
        return 'Anteriores';
    }

    /* ---------- Piezas de HTML ---------- */
    function kpi(i, icono, valor, texto) {
        return '<div class="v-kpi k-' + (i + 1) + '" style="--i:' + i + '"><div class="v-kpi-icono"><i class="fa-solid ' + icono + '"></i></div>' +
            '<b>' + valor + '</b><span>' + V.esc(texto) + '</span></div>';
    }

    function pintarKpis() {
        var hace7 = inicioDeHoy() - 6 * DIA;
        function cuantos(estado) { return contactos.filter(function (c) { return c.estado === estado; }).length; }
        $('c-kpis').innerHTML =
            kpi(0, 'fa-comments', contactos.length, 'Contactos en total') +
            kpi(1, 'fa-inbox', cuantos('nuevo'), 'Sin atender') +
            kpi(2, 'fa-hourglass-half', cuantos('en_seguimiento'), 'En seguimiento') +
            kpi(3, 'fa-calendar-day', contactos.filter(function (c) { return new Date(c.fecha).getTime() >= hace7; }).length, 'Últimos 7 días');
    }

    function pintarPestanas() {
        var base = contactos.filter(function (c) { return pasaFiltros(c, true); });
        var cuenta = { todos: base.length };
        ORDEN_ESTADOS.forEach(function (e) { cuenta[e] = base.filter(function (c) { return c.estado === e; }).length; });

        var pestanas = [['todos', 'Todos']].concat(ORDEN_ESTADOS.map(function (e) { return [e, ESTADOS[e]]; }));
        $('c-pestanas').innerHTML = pestanas.map(function (p) {
            return '<button type="button" class="i-pestana" data-estado="' + p[0] + '" aria-pressed="' + (f.estado === p[0]) + '">' +
                V.esc(p[1]) + ' <b>' + cuenta[p[0]] + '</b></button>';
        }).join('');
    }

    function pintarSelectInmuebles() {
        var mapa = {}, orden = [];
        contactos.forEach(function (c) {
            if (f.operacion !== 'todas' && operacionDe(c) !== f.operacion) return;
            var id = c.propiedad && c.propiedad.id;
            if (id == null) return;
            if (!mapa[id]) { mapa[id] = { titulo: tituloDe(c), total: 0 }; orden.push(id); }
            mapa[id].total++;
        });
        orden.sort(function (a, b) { return mapa[a].titulo.localeCompare(mapa[b].titulo, 'es'); });
        if (f.inmueble !== 'todos' && !mapa[f.inmueble]) f.inmueble = 'todos';

        $('c-inmueble').innerHTML = '<option value="todos">Todos los inmuebles</option>' + orden.map(function (id) {
            return '<option value="' + id + '">' + V.esc(mapa[id].titulo) + ' (' + mapa[id].total + ')</option>';
        }).join('');
        $('c-inmueble').value = f.inmueble;
    }

    function filaContacto(c) {
        var correo = esCorreo(c);
        var op = OPERACIONES[operacionDe(c)] || OPERACIONES.venta;
        var largo = String(c.mensaje || '').length > 90;

        var acciones;
        if (correo) {
            acciones = '<a class="v-btn v-btn-suave v-btn-mini" href="mailto:' + V.esc(String(c.contacto).replace(/\s/g, '')) + '" title="Escribir un correo" aria-label="Escribir un correo a ' + V.esc(c.nombre) + '"><i class="fa-solid fa-envelope"></i></a>';
        } else {
            acciones =
                '<a class="v-btn v-btn-suave v-btn-mini" href="tel:+' + V.esc(telefonoInternacional(c)) + '" title="Llamar" aria-label="Llamar a ' + V.esc(c.nombre) + '"><i class="fa-solid fa-phone"></i></a>' +
                '<a class="v-btn v-btn-suave v-btn-mini" href="https://wa.me/' + V.esc(telefonoInternacional(c)) + '" target="_blank" rel="noopener" title="Escribir por WhatsApp" aria-label="Escribir por WhatsApp a ' + V.esc(c.nombre) + '"><i class="fa-solid fa-message"></i></a>';
        }

        var botonVisita = c.propiedad
            ? '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="programar-visita" data-id="' + c.id + '" title="Programar visita" aria-label="Programar visita con ' + V.esc(c.nombre) + '"><i class="fa-solid fa-calendar-plus"></i></button>'
            : '';

        acciones = botonVisita + acciones;

        return '<article class="c-fila estado-' + V.esc(c.estado) + '" data-id="' + c.id + '">' +
            '<span class="v-fila-avatar c-avatar">' + V.esc(V.iniciales(c.nombre)) + '</span>' +
            '<div class="c-persona"><b>' + V.esc(c.nombre) + '</b>' +
            '<span class="c-medio"><i class="fa-solid ' + (correo ? 'fa-envelope' : 'fa-phone') + '"></i> ' + V.esc(c.contacto) + '</span></div>' +
            '<div class="c-mensaje"><p class="c-msg">' + V.esc(c.mensaje || 'Sin mensaje.') + '</p>' +
            (largo ? '<button type="button" class="c-vermas" data-accion="vermas" aria-expanded="false">Ver más</button>' : '') + '</div>' +
            '<div class="c-meta">' +
            '<div class="c-inmueble"><b title="' + V.esc(tituloDe(c)) + '">' + V.esc(tituloDe(c)) + '</b>' +
            '<span class="c-op ' + V.esc(operacionDe(c)) + '"><i class="fa-solid ' + op.icono + '"></i> ' + op.texto + '</span></div>' +
            '<div class="c-fecha"><b>' + V.esc(V.relativo(c.fecha)) + '</b><small>' + V.esc(V.fecha(c.fecha)) + '</small></div>' +
            '</div>' +
            '<div class="c-controles">' +
            '<select class="c-estado c-estado-' + V.esc(c.estado) + '" data-accion="estado" data-id="' + c.id + '" aria-label="Estado del contacto de ' + V.esc(c.nombre) + '">' +
            ORDEN_ESTADOS.map(function (e) { return '<option value="' + e + '"' + (e === c.estado ? ' selected' : '') + '>' + ESTADOS[e] + '</option>'; }).join('') +
            '</select>' +
            '<div class="c-acciones">' + acciones + '</div>' +
            '</div>' +
            '</article>';
    }

    function pintarLista() {
        var lista = ordenar(contactos.filter(function (c) { return pasaFiltros(c, false); }));
        var total = lista.length;
        var porMostrar = lista.slice(0, visibles);

        $('c-encabezado').hidden = !total;
        $('c-limpiar').hidden = !hayFiltros();
        $('c-resumen').textContent = !contactos.length ? '' :
            (total ? 'Mostrando ' + porMostrar.length + ' de ' + total + (total === 1 ? ' contacto' : ' contactos') : 'Sin resultados');

        if (!total) {
            $('c-lista').innerHTML = contactos.length
                ? '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-magnifying-glass"></i>Ningún contacto coincide con estos filtros.<br><button type="button" class="v-btn v-btn-suave v-btn-mini c-vacio-btn" data-accion="limpiar">Limpiar filtros</button></div>'
                : '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-comments"></i>Cuando alguien se interese en tus inmuebles, lo verás aquí.</div>';
            $('c-mas').hidden = true;
            return;
        }

        var html = '', actual = null, cuentaGrupo = {};
        lista.forEach(function (c) { var g = grupoDe(c); cuentaGrupo[g] = (cuentaGrupo[g] || 0) + 1; });
        porMostrar.forEach(function (c) {
            var g = grupoDe(c);
            if (g !== actual) {
                html += '<div class="c-grupo" role="presentation"><span>' + V.esc(g) + '</span><small>' + cuentaGrupo[g] + '</small></div>';
                actual = g;
            }
            html += filaContacto(c);
        });
        $('c-lista').innerHTML = html;

        var restantes = total - porMostrar.length;
        $('c-mas').hidden = restantes <= 0;
        $('c-mas-btn').innerHTML = '<i class="fa-solid fa-chevron-down"></i> Mostrar más (' + restantes + ' restantes)';
    }

    function pintar() {
        pintarKpis();
        pintarSelectInmuebles();
        pintarPestanas();
        pintarLista();
        sincronizarUrl();
    }

    /* ---------- Dirección (los filtros viajan en la URL) ---------- */
    function leerUrl() {
        var p = new URLSearchParams(window.location.search);
        if (ESTADOS[p.get('estado')]) f.estado = p.get('estado');
        if (OPERACIONES[p.get('operacion')]) f.operacion = p.get('operacion');
        if (p.get('inmueble') && /^\d+$/.test(p.get('inmueble'))) f.inmueble = p.get('inmueble');
        if (['hoy', '7', '30'].indexOf(p.get('periodo')) !== -1) f.periodo = p.get('periodo');
        if (['antiguos', 'nombre', 'inmueble'].indexOf(p.get('orden')) !== -1) f.orden = p.get('orden');
        if (p.get('q')) f.q = p.get('q').slice(0, 80);
    }

    function sincronizarUrl() {
        var p = new URLSearchParams();
        if (f.estado !== 'todos') p.set('estado', f.estado);
        if (f.operacion !== 'todas') p.set('operacion', f.operacion);
        if (f.inmueble !== 'todos') p.set('inmueble', f.inmueble);
        if (f.periodo !== 'todo') p.set('periodo', f.periodo);
        if (f.orden !== 'recientes') p.set('orden', f.orden);
        if (f.q) p.set('q', f.q);
        var query = p.toString();
        try { history.replaceState(null, '', window.location.pathname + (query ? '?' + query : '')); } catch (e) { }
    }

    function volcarFiltros() {
        $('c-buscar').value = f.q;
        $('c-operacion').value = f.operacion;
        $('c-periodo').value = f.periodo;
        $('c-orden').value = f.orden;
    }

    /* ---------- Carga ---------- */
    async function cargar(silencioso) {
        try {
            var r = await V.api('/contactos');
            contactos = r.data || [];
            $('c-carga').hidden = true;
            $('c-lista').hidden = false;
            pintar();
            document.dispatchEvent(new CustomEvent('umbral:datos'));
        } catch (e) {
            if (e.message === 'Sin acceso') return;
            if (silencioso) { V.toast(e.message || 'No se pudieron actualizar los contactos.'); return; }
            $('c-carga').hidden = false;
            $('c-carga').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>No se pudieron cargar tus contactos.<br><button type="button" class="v-btn v-btn-suave v-btn-mini c-vacio-btn" data-accion="reintentar">Reintentar</button>';
        }
    }

    /* ---------- Eventos ---------- */
    function reiniciarPagina() { visibles = POR_PAGINA; }

    var esperaBusqueda;
    $('c-buscar').addEventListener('input', function () {
        var valor = this.value.trim();
        clearTimeout(esperaBusqueda);
        esperaBusqueda = setTimeout(function () { f.q = valor; reiniciarPagina(); pintar(); }, 180);
    });
    [['c-operacion', 'operacion'], ['c-inmueble', 'inmueble'], ['c-periodo', 'periodo'], ['c-orden', 'orden']].forEach(function (par) {
        $(par[0]).addEventListener('change', function () { f[par[1]] = this.value; reiniciarPagina(); pintar(); });
    });

    function limpiar() {
        f = { estado: 'todos', operacion: 'todas', inmueble: 'todos', periodo: 'todo', orden: f.orden, q: '' };
        volcarFiltros();
        reiniciarPagina();
        pintar();
    }
    $('c-limpiar').addEventListener('click', limpiar);

    $('c-pestanas').addEventListener('click', function (e) {
        var b = e.target.closest('[data-estado]');
        if (!b) return;
        f.estado = b.getAttribute('data-estado');
        reiniciarPagina();
        pintar();
    });

    $('c-mas-btn').addEventListener('click', function () { visibles += POR_PAGINA; pintarLista(); });

    document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-accion]');
        if (!b) return;
        var accion = b.getAttribute('data-accion');
        if (accion === 'limpiar') limpiar();
        else if (accion === 'programar-visita') {
            var idContacto = Number(b.getAttribute('data-id'));
            var contacto = contactos.filter(function (x) { return x.id === idContacto; })[0];
            if (contacto && contacto.propiedad) {
                V.visitas.programar({ leadId: contacto.id, propiedadId: contacto.propiedad.id, quien: contacto.nombre + ' · ' + tituloDe(contacto) });
            }
        }
        else if (accion === 'reintentar') { $('c-carga').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>Cargando tus contactos…'; cargar(false); }
        else if (accion === 'vermas') {
            var fila = b.closest('.c-fila');
            var abierto = fila.classList.toggle('abierto');
            b.textContent = abierto ? 'Ver menos' : 'Ver más';
            b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
        }
    });

    // Cambiar el estado desde la lista
    $('c-lista').addEventListener('change', async function (e) {
        var sel = e.target.closest('select[data-accion="estado"]');
        if (!sel) return;
        var id = Number(sel.getAttribute('data-id'));
        var c = contactos.filter(function (x) { return x.id === id; })[0];
        if (!c) return;
        var anterior = c.estado, nuevo = sel.value;

        sel.disabled = true;
        try {
            await V.api('/contactos/' + id, { metodo: 'PATCH', datos: { estado: nuevo } });
            c.estado = nuevo;
            V.toast('Contacto marcado como «' + ESTADOS[nuevo].toLowerCase() + '».');
            pintar();
            document.dispatchEvent(new CustomEvent('umbral:datos'));
        } catch (err) {
            sel.disabled = false;
            sel.value = anterior;
            if (err.message !== 'Sin acceso') V.toast(err.message);
        }
    });

    // Al programar una visita el contacto pasa a «en seguimiento»: se vuelve a cargar la lista
    document.addEventListener('umbral:visitas-cambiaron', function () { cargar(true); });

    leerUrl();
    volcarFiltros();
    cargar(false);
})();