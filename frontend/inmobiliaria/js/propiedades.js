/* =========================================================
   UMBRAL — Propiedades de la inmobiliaria
   API: /api/v1/inmobiliaria/propiedades (+ /agentes para los selectores)
        /api/v1/public/ubicaciones (departamentos y municipios oficiales)
   ========================================================= */
(function () {
    'use strict';

    var I = window.Inmobiliaria;
    var propiedades = [];
    var agentes = [];
    var ubicaciones = [];
    var form = document.getElementById('d-form-campos');
    var ventana = document.getElementById('d-form');
    var editando = null;      // propiedad que se edita (null = nueva)
    var quitarFoto = false;

    function $(id) { return document.getElementById(id); }

    /* ---------- Carga de datos ---------- */
    function filtros() {
        var p = [];
        if ($('filtro-operacion').value) p.push('operacion=' + encodeURIComponent($('filtro-operacion').value));
        if ($('filtro-estado').value) p.push('estado=' + encodeURIComponent($('filtro-estado').value));
        if ($('filtro-agente').value) p.push('agente_id=' + encodeURIComponent($('filtro-agente').value));
        if ($('filtro-texto').value.trim()) p.push('q=' + encodeURIComponent($('filtro-texto').value.trim()));
        return p.length ? '?' + p.join('&') : '';
    }

    async function cargarPropiedades() {
        var r = await I.api('/propiedades' + filtros());
        propiedades = r.data;
        pintar();
    }

    /* ---------- Tarjetas ---------- */
    function tarjeta(p) {
        var botones = '';
        function boton(accion, icono, texto) {
            return '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="' + accion + '" data-id="' + p.id + '">' +
                '<i class="fa-solid ' + icono + '"></i>' + texto + '</button>';
        }
        var cierre = p.operacion === 'venta' ? 'vendida' : 'arrendada';
        var cerrada = p.estado === cierre;

        if (p.estado === 'borrador') botones += boton('estado:publicada', 'fa-bullhorn', 'Publicar');
        if (p.estado === 'publicada') botones += boton('estado:pausada', 'fa-pause', 'Pausar') +
            boton('estado:' + cierre, 'fa-handshake', p.operacion === 'venta' ? 'Marcar vendida' : 'Marcar arrendada');
        if (p.estado === 'pausada') botones += boton('estado:publicada', 'fa-play', 'Reanudar');
        if (cerrada) botones += boton('estado:publicada', 'fa-rotate-left', 'Volver a publicar');
        if (!cerrada) botones += boton('editar', 'fa-pen', 'Editar');
        botones += boton('eliminar', 'fa-trash', 'Eliminar');

        var precio = I.cop(p.precio) + (p.operacion === 'arriendo' ? '<small> / mes</small>' : '');

        return '<article class="v-prop">' +
            '<div class="v-prop-foto"><i class="fa-solid fa-house"></i>' + I.foto(p.imagen) +
                '<span class="v-estado ' + I.esc(p.estado) + '">' + I.esc(I.ESTADOS_PROPIEDAD[p.estado] || p.estado) + '</span></div>' +
            '<div class="v-prop-cuerpo">' +
                '<div class="v-prop-precio">' + precio + '</div>' +
                '<h3>' + I.esc((I.TIPOS[p.tipo] || p.tipo) + ' en ' + p.barrio) + (p.verificada ? ' <i class="fa-solid fa-circle-check i-verificada" title="Propiedad verificada"></i>' : '') + '</h3>' +
                '<div class="v-prop-lugar"><i class="fa-solid fa-location-dot"></i> ' + I.esc(p.ciudad) + ', ' + I.esc(p.departamento) + '</div>' +
                '<div class="v-prop-datos">' +
                    '<span><i class="fa-solid fa-bed"></i>' + Number(p.habitaciones) + '</span>' +
                    '<span><i class="fa-solid fa-bath"></i>' + Number(p.banos) + '</span>' +
                    '<span><i class="fa-solid fa-ruler-combined"></i>' + Number(p.area) + ' m²</span>' +
                    '<span>' + (p.operacion === 'venta' ? 'Venta' : 'Arriendo') + '</span>' +
                '</div>' +
                '<div class="v-campo i-asignar"><label for="ag-' + p.id + '">Agente</label>' +
                    '<select id="ag-' + p.id + '" data-asignar="' + p.id + '">' +
                    I.opcionesAgentes(agentes, p.agente ? p.agente.id : null) + '</select></div>' +
            '</div>' +
            '<div class="v-prop-metricas"><span><b>' + p.contactos + '</b> contactos</span><span><b>' + p.visitas + '</b> visitas</span></div>' +
            '<div class="v-prop-acciones">' + botones + '</div>' +
        '</article>';
    }

    function pintar() {
        $('d-total').textContent = propiedades.length + (propiedades.length === 1 ? ' inmueble' : ' inmuebles');
        $('d-propiedades').innerHTML = propiedades.length
            ? propiedades.map(tarjeta).join('')
            : '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-house-circle-exclamation"></i>No hay inmuebles con estos filtros.<br>Usa “Registrar inmueble” para empezar.</div>';
    }

    function pintarFiltroAgentes() {
        $('filtro-agente').innerHTML = '<option value="">Todos</option><option value="sin">Sin agente</option>' +
            agentes.map(function (a) { return '<option value="' + a.id + '">' + I.esc(a.nombre) + (a.estado !== 'activo' ? ' (inactivo)' : '') + '</option>'; }).join('');
    }

    /* ---------- Acciones de las tarjetas ---------- */
    $('d-propiedades').addEventListener('click', async function (e) {
        var b = e.target.closest('[data-accion]');
        if (!b) return;
        var id = Number(b.getAttribute('data-id'));
        var accion = b.getAttribute('data-accion');
        var p = propiedades.filter(function (x) { return x.id === id; })[0];

        try {
            if (accion === 'editar') { abrirForm(p); return; }
            if (accion === 'eliminar') {
                if (!window.confirm('¿Eliminar este inmueble? También se borran sus contactos y visitas.')) return;
                var r1 = await I.api('/propiedades/' + id, { metodo: 'DELETE' });
                I.toast(r1.message);
            } else if (accion.indexOf('estado:') === 0) {
                var r2 = await I.api('/propiedades/' + id + '/estado', { metodo: 'PATCH', datos: { estado: accion.split(':')[1] } });
                I.toast(r2.message);
            }
            await cargarPropiedades();
        } catch (err) { I.toast(err.message); }
    });

    $('d-propiedades').addEventListener('change', async function (e) {
        var s = e.target.closest('[data-asignar]');
        if (!s) return;
        try {
            var r = await I.api('/propiedades/' + s.getAttribute('data-asignar') + '/agente', {
                metodo: 'PATCH', datos: { agente_id: s.value ? Number(s.value) : null }
            });
            I.toast(r.message);
            await cargarPropiedades();
        } catch (err) { I.toast(err.message); await cargarPropiedades(); }
    });

    ['filtro-operacion', 'filtro-estado', 'filtro-agente'].forEach(function (id) {
        $(id).addEventListener('change', function () { cargarPropiedades().catch(function (e) { I.toast(e.message); }); });
    });
    var espera;
    $('filtro-texto').addEventListener('input', function () {
        clearTimeout(espera);
        espera = setTimeout(function () { cargarPropiedades().catch(function (e) { I.toast(e.message); }); }, 350);
    });

    /* ---------- Formulario: listas ---------- */
    form.tipo.innerHTML = Object.keys(I.TIPOS).map(function (k) { return '<option value="' + k + '">' + I.TIPOS[k] + '</option>'; }).join('');

    function pintarDepartamentos(elegido) {
        form.departamento.innerHTML = '<option value="">Elige el departamento</option>' + ubicaciones.map(function (d) {
            return '<option' + (d.nombre === elegido ? ' selected' : '') + '>' + I.esc(d.nombre) + '</option>';
        }).join('');
    }
    function pintarMunicipios(elegido) {
        var dep = ubicaciones.filter(function (d) { return d.nombre === form.departamento.value; })[0];
        form.ciudad.innerHTML = '<option value="">' + (dep ? 'Elige el municipio' : 'Primero el departamento') + '</option>' +
            (dep ? dep.municipios.map(function (m) { return '<option' + (m === elegido ? ' selected' : '') + '>' + I.esc(m) + '</option>'; }).join('') : '');
    }
    form.departamento.addEventListener('change', function () { pintarMunicipios(null); });
    form.operacion.addEventListener('change', function () {
        $('f-precio-etiqueta').textContent = form.operacion.value === 'arriendo' ? 'Canon mensual (COP)' : 'Precio (COP)';
    });

    /* ---------- Formulario: foto ---------- */
    function pintarFoto(url) {
        $('f-foto-vista').hidden = !url;
        $('f-foto-vacio').hidden = !!url;
        $('f-foto-quitar').hidden = !url;
        if (url) $('f-foto-vista').src = url;
    }
    $('f-foto').addEventListener('change', function () {
        var archivo = this.files[0];
        if (!archivo) return;
        if (archivo.size > 4 * 1024 * 1024) { I.toast('La foto no puede superar 4 MB.'); this.value = ''; return; }
        quitarFoto = false;
        pintarFoto(URL.createObjectURL(archivo));
    });
    $('f-foto-quitar').addEventListener('click', function () {
        $('f-foto').value = '';
        quitarFoto = true;
        pintarFoto(null);
    });

    /* ---------- Formulario: mapa (Leaflet, igual que el vendedor) ---------- */
    var mapa = null, pin = null;
    var CENTRO_COLOMBIA = [4.5709, -74.2973];

    function iconoPin() {
        return L.divIcon({
            className: 'v-pin', iconSize: [34, 42], iconAnchor: [17, 40],
            html: '<svg viewBox="0 0 24 30" width="34" height="42" aria-hidden="true"><path style="fill:var(--op-1)" d="M12 0C5.4 0 0 5.2 0 11.7 0 20 12 30 12 30s12-10 12-18.3C24 5.2 18.6 0 12 0z"/><circle cx="12" cy="11.5" r="4.5" fill="#fff"/></svg>'
        });
    }
    function fijarPunto(lat, lng, acercar) {
        form.lat.value = lat.toFixed(7);
        form.lng.value = lng.toFixed(7);
        $('f-coords').textContent = 'Ubicación marcada: ' + lat.toFixed(5) + ', ' + lng.toFixed(5) + '. Puedes arrastrar el pin para ajustarlo.';
        if (!pin) {
            pin = L.marker([lat, lng], { icon: iconoPin(), draggable: true }).addTo(mapa);
            pin.on('dragend', function () { var c = pin.getLatLng(); fijarPunto(c.lat, c.lng, false); });
        } else {
            pin.setLatLng([lat, lng]);
        }
        if (acercar) mapa.setView([lat, lng], Math.max(mapa.getZoom(), 16));
    }
    function quitarPunto() {
        form.lat.value = ''; form.lng.value = '';
        $('f-coords').textContent = 'Haz clic en el mapa para marcar dónde está el inmueble. Puedes arrastrar el pin para ajustarlo.';
        if (pin) { mapa.removeLayer(pin); pin = null; }
    }
    function iniciarMapa(lat, lng) {
        if (!window.L) { $('d-mapa').innerHTML = '<div class="v-vacio">No se pudo cargar el mapa. Revisa tu conexión a internet.</div>'; return; }
        if (!mapa) {
            mapa = L.map('d-mapa').setView(CENTRO_COLOMBIA, 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapa);
            mapa.on('click', function (e) { fijarPunto(e.latlng.lat, e.latlng.lng, false); });
        }
        setTimeout(function () {
            mapa.invalidateSize();
            if (lat != null && lng != null) fijarPunto(Number(lat), Number(lng), true);
            else { quitarPunto(); mapa.setView(CENTRO_COLOMBIA, 5); }
        }, 80);
    }
    $('f-buscar').addEventListener('click', function () {
        if (!mapa) return;
        if (!form.ciudad.value) { I.toast('Elige al menos el municipio para buscar.'); return; }
        var consulta = [form.direccion.value, form.barrio.value, form.ciudad.value, form.departamento.value, 'Colombia']
            .map(function (t) { return String(t).trim(); }).filter(Boolean).join(', ');
        var boton = this; boton.disabled = true;
        fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=' + encodeURIComponent(consulta), { headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res[0]) fijarPunto(parseFloat(res[0].lat), parseFloat(res[0].lon), true);
                else I.toast('No encontramos esa dirección. Marca el punto directamente en el mapa.');
            })
            .catch(function () { I.toast('No se pudo buscar la dirección. Marca el punto en el mapa.'); })
            .then(function () { boton.disabled = false; });
    });
    $('f-gps').addEventListener('click', function () {
        if (!mapa) return;
        if (!navigator.geolocation) { I.toast('Tu navegador no permite obtener la ubicación.'); return; }
        navigator.geolocation.getCurrentPosition(
            function (pos) { fijarPunto(pos.coords.latitude, pos.coords.longitude, true); },
            function () { I.toast('No pudimos obtener tu ubicación. Marca el punto en el mapa.'); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    /* ---------- Abrir / guardar ---------- */
    function abrirForm(p) {
        editando = p || null;
        quitarFoto = false;
        form.reset();
        $('d-form-error').hidden = true;
        $('d-form-titulo').textContent = p ? 'Editar inmueble' : 'Registrar inmueble';
        $('f-estado-caja').hidden = !!p;   // el estado se cambia desde la tarjeta
        form.agente_id.innerHTML = I.opcionesAgentes(agentes, p && p.agente ? p.agente.id : null);

        if (p) {
            ['operacion', 'tipo', 'precio', 'barrio', 'direccion', 'habitaciones', 'banos', 'parqueaderos', 'area'].forEach(function (c) {
                form[c].value = p[c] == null ? '' : p[c];
            });
            form.estrato.value = p.estrato == null ? '' : String(p.estrato);
        }
        pintarDepartamentos(p ? p.departamento : null);
        pintarMunicipios(p ? p.ciudad : null);
        form.operacion.dispatchEvent(new Event('change'));
        pintarFoto(p ? p.imagen : null);

        ventana.showModal();
        iniciarMapa(p ? p.lat : null, p ? p.lng : null);
    }

    $('d-registrar').addEventListener('click', function () { abrirForm(null); });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var error = $('d-form-error');
        error.hidden = true;
        if (!form.lat.value || !form.lng.value) {
            error.textContent = 'Marca la ubicación del inmueble en el mapa.';
            error.hidden = false;
            return;
        }

        var datos = new FormData(form);
        if (!$('f-foto').files.length) datos.delete('imagen');
        if (editando) datos.delete('estado');
        if (editando && quitarFoto) datos.append('quitar_imagen', '1');
        ['agente_id', 'estrato'].forEach(function (c) { if (!datos.get(c)) datos.delete(c); });

        var boton = $('d-form-guardar');
        boton.disabled = true;
        try {
            var r = await I.api(editando ? '/propiedades/' + editando.id : '/propiedades', { metodo: 'POST', formulario: datos });
            ventana.close();
            I.toast(r.message);
            await cargarPropiedades();
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
        } finally {
            boton.disabled = false;
        }
    });

    I.prepararVentana(ventana);

    /* ---------- Arranque ---------- */
    async function iniciar() {
        if (!await I.iniciar('propiedades')) return;
        try {
            var res = await Promise.all([
                I.api('/agentes'),
                fetch('/api/v1/public/ubicaciones', { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); })
            ]);
            agentes = res[0].data;
            ubicaciones = res[1].data || [];
            pintarFiltroAgentes();
            await cargarPropiedades();
            $('d-cargando').hidden = true;
            $('d-panel').hidden = false;
        } catch (err) {
            $('d-cargando').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' + I.esc(err.message);
        }
    }
    iniciar();
})();
