/* UMBRAL — Pantalla "Membresías" del administrador.
   API: GET /api/v1/admin/membresias            (cifras, planes y lista paginada)
        POST /api/v1/admin/membresias/{id}/cancelar  (cancelar una membresía)
        GET/POST /api/v1/admin/membresias/paquetes        (paquetes de inmobiliaria)
        PUT/DELETE /api/v1/admin/membresias/paquetes/{id} (editar, activar/desactivar, borrar)
        GET /api/v1/admin/membresias/compras-paquetes?page=  (compras de paquetes de inmobiliaria)
        GET /api/v1/admin/membresias?rol=vendedor&page=      (compras de vendedores)
        GET/POST /api/v1/admin/membresias/vendedor        (paquetes de vendedor)
        PUT/DELETE /api/v1/admin/membresias/vendedor/{id} */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var tabla = document.getElementById('tabla-membresias');
    var tablaVacia = document.getElementById('tabla-vacia');
    var paginaActual = 1;
    var temporizador = null;
    var planesPrecio = {};       // precio de cada plan, para calcular el precio del paquete
    var planesDias = {};         // días de cada plan

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

    // Notificación flotante en la parte de abajo (solo colores de la paleta: morado y dorado)
    var temporizadorAviso = null;
    function mostrarAviso(texto, correcto) {
        if (!document.getElementById('estilo-notificacion')) {
            var estilo = document.createElement('style');
            estilo.id = 'estilo-notificacion';
            estilo.textContent =
                '.notif { position: fixed; right: 20px; bottom: 20px; z-index: 80; display: flex; align-items: flex-start; gap: 10px; max-width: 360px; padding: 12px 14px; border: 1px solid var(--ad-borde); border-left: 4px solid var(--notif-color); border-radius: 14px; background: var(--ad-card); color: var(--ad-text); box-shadow: var(--ad-sombra); font-size: .85rem; line-height: 1.35; cursor: pointer; animation: notif-sube .22s ease-out; }' +
                '.notif i { margin-top: 2px; color: var(--notif-color); }' +
                '@keyframes notif-sube { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }' +
                '@media (max-width: 520px) { .notif { left: 12px; right: 12px; bottom: 12px; max-width: none; } }';
            document.head.appendChild(estilo);
        }
        var previo = document.getElementById('notificacion');
        if (previo) previo.remove();
        clearTimeout(temporizadorAviso);

        var caja = document.createElement('div');
        caja.id = 'notificacion';
        caja.className = 'notif';
        caja.setAttribute('role', 'status');
        caja.setAttribute('aria-live', 'polite');
        caja.style.setProperty('--notif-color', correcto ? 'var(--ad-primary)' : 'var(--pq-oro, #d4af37)');
        caja.innerHTML = '<i class="fa-solid ' + (correcto ? 'fa-circle-check' : 'fa-circle-exclamation') + '"></i><span></span>';
        caja.lastChild.textContent = texto;
        caja.addEventListener('click', function () { caja.remove(); });
        document.body.appendChild(caja);

        temporizadorAviso = setTimeout(function () { caja.remove(); }, correcto ? 4500 : 7000);
    }

    /* ----- Cifras ----- */
    function pintarResumen(r) {
        document.getElementById('valor-vigentes').textContent = conPuntos(r.vigentes);
        document.getElementById('valor-por-vencer').textContent = conPuntos(r.por_vencer);
        document.getElementById('valor-vencidas').textContent = conPuntos(r.vencidas);
        document.getElementById('valor-ingresos-mes').textContent = pesos(r.ingresos_mes);
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
            plan: document.getElementById('filtro-plan').value,
            desde: document.getElementById('filtro-desde').value,
            hasta: document.getElementById('filtro-hasta').value,
            monto_min: document.getElementById('filtro-monto-min').value,
            monto_max: document.getElementById('filtro-monto-max').value
        });
        try {
            var d = await P.api('/membresias?' + parametros.toString());
            pintarResumen(d.resumen);
            d.planes.forEach(function (p) { planesPrecio[p.plan] = Number(p.precio); planesDias[p.plan] = Number(p.dias); });
            precioPrevio();
            dibujarFilas(d.datos);
            dibujarPaginacion(d);
            tablaVacia.classList.toggle('hidden', d.datos.length > 0);
        } catch (e) {
            if (e.estado !== 401) mostrarAviso(e.message || 'No se pudieron cargar las membresías.', false);
        } finally {
            tabla.style.opacity = '1';
        }
    }

    /* ----- Paquetes (inmobiliaria y vendedor) ----- */
    function $(id) { return document.getElementById(id); }

    // Cada gestor maneja una lista de paquetes: tarjetas, ventana de crear/editar, activar y borrar
    function gestor(cfg) {
        var lista = [];
        var editando = null;
        var fondo = $(cfg.p + '-fondo');

        function buscar(id) { return lista.filter(function (q) { return String(q.id) === String(id); })[0]; }

        function pintar() {
            var cont = $(cfg.contenedor);
            if (!lista.length) {
                cont.innerHTML = '<p class="pq-vacio" style="grid-column:1/-1">Aún no hay paquetes. Crea el primero con «Nuevo paquete».</p>';
                return;
            }
            cont.innerHTML = lista.map(function (q) {
                var t = cfg.tarjeta(q);
                return '<div class="pq-card' + (q.activa ? '' : ' pq-off') + '">' +
                    '<span class="pq-ico"><i class="fa-solid ' + cfg.icono + '"></i></span>' +
                    '<div class="pq-cuerpo">' +
                        '<p class="pq-nombre">' + P.esc(q.nombre) + '<span class="pq-chip' + (q.activa ? '' : ' off') + '">' + (q.activa ? 'Activo' : 'Inactivo') + '</span></p>' +
                        '<p class="pq-meta">' + t.linea1 + '</p>' +
                        '<p class="pq-meta">' + t.linea2 + '</p>' +
                    '</div>' +
                    '<p class="pq-precio">' + pesos(q.precio) + '</p>' +
                    '<div class="pq-pie">' +
                        '<span class="pq-meta">' + (q.activa ? cfg.visible : cfg.oculto) + '</span>' +
                        '<div class="pq-acc">' +
                            '<button type="button" class="pq-btn" data-editar="' + q.id + '" title="Editar"><i class="fa-solid fa-pen"></i></button>' +
                            '<button type="button" class="pq-btn" data-activar="' + q.id + '" title="' + (q.activa ? 'Desactivar' : 'Activar') + '"><i class="fa-solid ' + (q.activa ? 'fa-eye-slash' : 'fa-eye') + '"></i></button>' +
                            '<button type="button" class="pq-btn" data-borrar="' + q.id + '" title="Borrar"><i class="fa-solid fa-trash"></i></button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        async function cargarLista() {
            try {
                var r = await P.api(cfg.ruta);
                lista = r.datos;
                pintar();
            } catch (e) {
                if (e.estado !== 401) mostrarAviso(e.message || 'No se pudieron cargar los paquetes.', false);
            }
        }

        function limpiar() {
            cfg.campos.forEach(function (c) { $(cfg.p + '-err-' + c).textContent = ''; });
        }

        function abrir(q) {
            editando = q ? q.id : null;
            limpiar();
            $(cfg.p + '-titulo').textContent = q ? 'Editar paquete' : cfg.tituloNuevo;
            cfg.llenar(q);
            fondo.classList.add('abierto');
            $(cfg.p + '-nombre').focus();
        }

        function cerrar() { fondo.classList.remove('abierto'); editando = null; }

        async function guardar(evento) {
            evento.preventDefault();
            limpiar();
            var boton = $(cfg.p + '-guardar');
            var cuerpo = cfg.cuerpo(editando ? buscar(editando) : null);
            boton.disabled = true;
            try {
                var r = editando
                    ? await P.api(cfg.ruta + '/' + editando, { metodo: 'PUT', cuerpo: cuerpo })
                    : await P.api(cfg.ruta, { metodo: 'POST', cuerpo: cuerpo });
                lista = r.datos;
                pintar();
                cerrar();
                mostrarAviso(r.mensaje, true);
                if (cfg.despues) cfg.despues();
            } catch (e) {
                var errores = (e.datos && e.datos.errors) || {};
                var hubo = false;
                cfg.campos.forEach(function (c) {
                    if (errores[c]) { $(cfg.p + '-err-' + c).textContent = errores[c][0]; hubo = true; }
                });
                if (!hubo) mostrarAviso(e.message, false);
            } finally {
                boton.disabled = false;
            }
        }

        $(cfg.nuevo).addEventListener('click', function () { abrir(null); });
        $(cfg.p + '-cancelar').addEventListener('click', cerrar);
        $(cfg.p + '-form').addEventListener('submit', guardar);
        fondo.addEventListener('mousedown', function (e) { if (e.target === fondo) cerrar(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });

        $(cfg.contenedor).addEventListener('click', async function (evento) {
            var editar = evento.target.closest('[data-editar]');
            if (editar) { var q = buscar(editar.getAttribute('data-editar')); if (q) abrir(q); return; }

            var activar = evento.target.closest('[data-activar]');
            if (activar) {
                var p = buscar(activar.getAttribute('data-activar'));
                if (!p) return;
                activar.disabled = true;
                try {
                    var r = await P.api(cfg.ruta + '/' + p.id, { metodo: 'PUT', cuerpo: { activa: !p.activa } });
                    lista = r.datos; pintar(); mostrarAviso(r.mensaje, true);
                } catch (e) { mostrarAviso(e.message, false); activar.disabled = false; }
                return;
            }

            var borrar = evento.target.closest('[data-borrar]');
            if (borrar) {
                var b = buscar(borrar.getAttribute('data-borrar'));
                if (!b) return;
                if (!window.confirm('¿Borrar el paquete «' + b.nombre + '»? Esta acción no se puede deshacer.')) return;
                borrar.disabled = true;
                try {
                    var rb = await P.api(cfg.ruta + '/' + b.id, { metodo: 'DELETE' });
                    lista = rb.datos; pintar(); mostrarAviso(rb.mensaje, true);
                } catch (e) { mostrarAviso(e.message, false); borrar.disabled = false; }
            }
        });

        return { cargar: cargarLista };
    }

    /* Paquetes de inmobiliaria: el precio se calcula con el precio del plan */
    var plural = function (n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); };

    function precioPrevio() {
        if (!$('pq-plan')) return;
        var plan = $('pq-plan').value;
        var pub = parseInt($('pq-publicaciones').value, 10) || 0;
        var desc = parseInt($('pq-descuento').value, 10) || 0;
        $('pq-precio').textContent = pesos(Math.round((planesPrecio[plan] || 0) * pub * (100 - desc) / 100));
    }

    var inmobiliaria = gestor({
        p: 'pq', ruta: '/membresias/paquetes', contenedor: 'paquetes', nuevo: 'pq-nuevo', icono: 'fa-layer-group',
        campos: ['nombre', 'plan', 'publicaciones', 'descuento'],
        tituloNuevo: 'Nuevo paquete de inmobiliaria',
        visible: 'Visible para inmobiliarias', oculto: 'Oculto para inmobiliarias',
        tarjeta: function (q) {
            return {
                linea1: plural(q.publicaciones, 'publicación', 'publicaciones') + ' · ' + P.esc(q.nombre_plan) + ' · ' + q.dias + ' días',
                linea2: 'Descuento ' + q.descuento + ' %'
            };
        },
        llenar: function (q) {
            $('pq-nombre').value = q ? q.nombre : '';
            $('pq-plan').value = q ? q.plan : 'mensual';
            $('pq-publicaciones').value = q ? q.publicaciones : 10;
            $('pq-descuento').value = q ? q.descuento : 0;
            precioPrevio();
        },
        cuerpo: function () {
            return { nombre: $('pq-nombre').value.trim(), plan: $('pq-plan').value,
                     publicaciones: $('pq-publicaciones').value, descuento: $('pq-descuento').value };
        }
    });
    ['pq-plan', 'pq-publicaciones', 'pq-descuento'].forEach(function (id) { $(id).addEventListener('input', precioPrevio); });

    /* Paquetes de vendedor: días, propiedades y precio.
       El precio se calcula con los 3 planes base (se reparte proporcionalmente entre sus días)
       y el administrador lo puede cambiar. */
    var vdManual = false;   // true cuando el administrador escribió el precio a mano

    function precioSugerido(dias, propiedades) {
        var puntos = Object.keys(planesPrecio).map(function (k) { return { d: planesDias[k], p: planesPrecio[k] }; })
            .filter(function (x) { return x.d > 0 && x.p > 0; })
            .sort(function (a, b) { return a.d - b.d; });
        if (!puntos.length || !(dias > 0) || !(propiedades > 0)) return '';

        var unaPropiedad;
        var primero = puntos[0], ultimo = puntos[puntos.length - 1];
        if (dias <= primero.d) {
            unaPropiedad = primero.p * dias / primero.d;
        } else if (dias >= ultimo.d) {
            unaPropiedad = ultimo.p * dias / ultimo.d;
        } else {
            for (var i = 0; i < puntos.length - 1; i++) {
                var a = puntos[i], b = puntos[i + 1];
                if (dias >= a.d && dias <= b.d) {
                    unaPropiedad = a.p + (dias - a.d) / (b.d - a.d) * (b.p - a.p);
                    break;
                }
            }
        }
        return Math.max(1000, Math.round(unaPropiedad * propiedades / 100) * 100);
    }

    function recalcularPrecioVendedor() {
        var v = precioSugerido(parseInt($('vd-dias').value, 10), parseInt($('vd-propiedades').value, 10));
        if (v !== '') $('vd-precio').value = v;
    }

    var vendedor = gestor({
        p: 'vd', ruta: '/membresias/vendedor', contenedor: 'paquetes-vendedor', nuevo: 'vd-nuevo', icono: 'fa-tag',
        campos: ['nombre', 'dias', 'propiedades', 'precio'],
        tituloNuevo: 'Nuevo paquete de vendedor',
        visible: 'Visible para vendedores', oculto: 'Oculto para vendedores',
        tarjeta: function (q) {
            return {
                linea1: plural(q.propiedades, 'propiedad', 'propiedades') + ' · ' + q.dias + ' días',
                linea2: q.base ? 'Plan base' : 'Creado por el administrador'
            };
        },
        llenar: function (q) {
            var base = !!(q && q.base);
            $('vd-nombre').value = q ? q.nombre : '';
            $('vd-dias').value = q ? q.dias : 7;
            $('vd-propiedades').value = q ? q.propiedades : 1;
            $('vd-dias').disabled = base;
            $('vd-propiedades').disabled = base;
            $('vd-nota').style.display = base ? 'block' : 'none';
            if (q) {
                $('vd-precio').value = q.precio;   // al editar se respeta el precio guardado
                vdManual = true;
            } else {
                vdManual = false;
                recalcularPrecioVendedor();         // paquete nuevo: el precio nace calculado
            }
        },
        cuerpo: function () {
            return { nombre: $('vd-nombre').value.trim(), dias: $('vd-dias').value,
                     propiedades: $('vd-propiedades').value, precio: $('vd-precio').value };
        },
        // El precio de los paquetes de inmobiliaria depende del precio de los planes base
        despues: function () { inmobiliaria.cargar(); cargar(paginaActual); }
    });

    ['vd-dias', 'vd-propiedades'].forEach(function (id) {
        $(id).addEventListener('input', function () { if (!vdManual) recalcularPrecioVendedor(); });
    });
    $('vd-precio').addEventListener('input', function () { vdManual = true; });
    $('vd-recalcular').addEventListener('click', function () { vdManual = false; recalcularPrecioVendedor(); });

    /* ----- Compras de paquetes de inmobiliaria ----- */
    var ESTADOS_COMPRA = {
        vigente:    { texto: 'Vigente',    clase: 'bg-emerald-500/10 text-emerald-300', punto: 'bg-emerald-400' },
        por_vencer: { texto: 'Por vencer', clase: 'bg-amber-500/10 text-amber-300',     punto: 'bg-amber-400' },
        vencido:    { texto: 'Vencido',    clase: 'bg-slate-500/10 text-slate-400',     punto: 'bg-slate-500' }
    };

    async function cargarCompras(pagina, suf) {
        suf = suf || '';
        var cuerpo = document.getElementById('tabla-compras' + suf);
        try {
            var d = await P.api('/membresias/compras-paquetes?page=' + (pagina || 1));
            cuerpo.innerHTML = d.datos.map(function (c) {
                var e = ESTADOS_COMPRA[c.estado] || ESTADOS_COMPRA.vigente;
                var extra = c.estado === 'vencido' ? '' : ' · faltan ' + c.dias_restantes + ' d';
                return '<tr class="transition-colors hover:bg-slate-800/40">' +
                    '<td class="px-5 py-3.5"><p class="truncate font-semibold text-slate-200">' + P.esc(c.usuario) + '</p>' +
                        '<p class="truncate text-xs text-slate-500">' + P.esc(c.correo || '') + '</p></td>' +
                    '<td class="px-5 py-3.5"><p class="font-semibold text-slate-200">' + P.esc(c.paquete) + '</p>' +
                        '<p class="text-xs text-slate-500">Plan ' + P.esc(c.plan.toLowerCase()) + '</p></td>' +
                    '<td class="px-5 py-3.5"><p class="font-semibold text-slate-200">' + pesos(c.precio) + '</p>' +
                        '<p class="text-xs text-slate-500">' + P.esc(c.referencia || 'Sin referencia') + '</p></td>' +
                    '<td class="px-5 py-3.5 text-xs text-slate-400">' + fecha(c.fecha_inicio) + ' → ' + fecha(c.fecha_fin) + '<span class="text-slate-600">' + extra + '</span></td>' +
                    '<td class="px-5 py-3.5 text-slate-300">' + c.usados + ' de ' + c.cupos + '</td>' +
                    '<td class="px-5 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + e.clase + '">' +
                        '<span class="h-1.5 w-1.5 rounded-full ' + e.punto + '"></span>' + e.texto + '</span></td>' +
                '</tr>';
            }).join('');
            document.getElementById('compras-vacia' + suf).classList.toggle('hidden', d.datos.length > 0);
            document.getElementById('compras-info' + suf).textContent =
                d.total === 0 ? 'Sin resultados' : 'Mostrando ' + d.desde + '–' + d.hasta + ' de ' + d.total + ' compras';

            var cont = document.getElementById('compras-botones' + suf);
            cont.innerHTML = '';
            if (d.ultima_pagina > 1) {
                [['<i class="fa-solid fa-chevron-left"></i>', d.pagina_actual - 1, d.pagina_actual <= 1],
                 ['<i class="fa-solid fa-chevron-right"></i>', d.pagina_actual + 1, d.pagina_actual >= d.ultima_pagina]].forEach(function (x) {
                    var b = document.createElement('button');
                    b.type = 'button'; b.innerHTML = x[0]; b.disabled = x[2];
                    b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg border border-slate-800 px-2 text-xs font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200' + (x[2] ? ' cursor-not-allowed opacity-40' : '');
                    if (!x[2]) b.addEventListener('click', function () { cargarCompras(x[1], suf); });
                    cont.appendChild(b);
                });
            }
        } catch (e) {
            if (e.estado !== 401) mostrarAviso(e.message || 'No se pudieron cargar las compras de paquetes.', false);
        }
    }

    /* ----- Compras de vendedores (pestaña "Paquetes de vendedor") ----- */
    async function cargarMovVendedor(pagina) {
        var cuerpo = document.getElementById('tabla-mov-vend');
        try {
            var d = await P.api('/membresias?rol=vendedor&page=' + (pagina || 1));
            cuerpo.innerHTML = d.datos.map(function (m) {
                var e = ESTADOS[m.estado] || ESTADOS.vigente;
                return '<tr class="transition-colors hover:bg-slate-800/40">' +
                    '<td class="px-5 py-3.5"><p class="truncate font-semibold text-slate-200">' + P.esc(m.usuario) + '</p>' +
                        '<p class="truncate text-xs text-slate-500">' + P.esc(m.correo || '') + '</p></td>' +
                    '<td class="px-5 py-3.5 text-slate-300">' + P.esc(m.nombre_plan) + '</td>' +
                    '<td class="px-5 py-3.5"><p class="font-semibold text-slate-200">' + pesos(m.precio) + '</p>' +
                        '<p class="text-xs text-slate-500">' + P.esc(m.referencia || 'Sin referencia') + '</p></td>' +
                    '<td class="px-5 py-3.5 text-xs text-slate-400">' + vigencia(m) + '</td>' +
                    '<td class="px-5 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + e.clase + '">' +
                        '<span class="h-1.5 w-1.5 rounded-full ' + e.punto + '"></span>' + e.texto + '</span></td>' +
                '</tr>';
            }).join('');
            document.getElementById('mov-vend-vacia').classList.toggle('hidden', d.datos.length > 0);
            document.getElementById('mov-vend-info').textContent =
                d.total === 0 ? 'Sin resultados' : 'Mostrando ' + d.desde + '–' + d.hasta + ' de ' + d.total + ' compras';

            var cont = document.getElementById('mov-vend-botones');
            cont.innerHTML = '';
            if (d.ultima_pagina > 1) {
                [['<i class="fa-solid fa-chevron-left"></i>', d.pagina_actual - 1, d.pagina_actual <= 1],
                 ['<i class="fa-solid fa-chevron-right"></i>', d.pagina_actual + 1, d.pagina_actual >= d.ultima_pagina]].forEach(function (x) {
                    var b = document.createElement('button');
                    b.type = 'button'; b.innerHTML = x[0]; b.disabled = x[2];
                    b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg border border-slate-800 px-2 text-xs font-medium text-slate-400 transition-all hover:bg-slate-800 hover:text-slate-200' + (x[2] ? ' cursor-not-allowed opacity-40' : '');
                    if (!x[2]) b.addEventListener('click', function () { cargarMovVendedor(x[1]); });
                    cont.appendChild(b);
                });
            }
        } catch (e) {
            if (e.estado !== 401) mostrarAviso(e.message || 'No se pudieron cargar las compras de vendedores.', false);
        }
    }

    /* ----- Pestañas ----- */
    document.querySelector('.tb-barra').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]');
        if (!b) return;
        document.querySelectorAll('.tb-tab').forEach(function (t) { t.classList.toggle('activo', t === b); });
        document.querySelectorAll('.tb-panel').forEach(function (p) {
            p.classList.toggle('activo', p.id === 'tab-' + b.getAttribute('data-tab'));
        });
    });

    /* ----- Eventos ----- */
    document.getElementById('buscar').addEventListener('input', function () {
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { cargar(1); }, 350);
    });

    // Cada filtro vuelve a cargar la tabla cuando cambia
    ['filtro-estado', 'filtro-plan', 'filtro-desde', 'filtro-hasta', 'filtro-monto-min', 'filtro-monto-max'].forEach(function (id) {
        document.getElementById(id).addEventListener('change', function () { cargar(1); });
    });

    // Botón "Limpiar filtros"
    document.getElementById('filtro-limpiar').addEventListener('click', function () {
        ['buscar', 'filtro-estado', 'filtro-plan', 'filtro-desde', 'filtro-hasta', 'filtro-monto-min', 'filtro-monto-max']
            .forEach(function (id) { document.getElementById(id).value = ''; });
        cargar(1);
    });

    document.addEventListener('click', async function (evento) {
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
    P.listo.then(function () { cargar(1); inmobiliaria.cargar(); vendedor.cargar(); cargarCompras(1); cargarCompras(1, '-inmo'); cargarMovVendedor(1); }).catch(function () {});
})();
