/* =========================================================
   UMBRAL — Propiedades de la inmobiliaria
   API: /api/v1/inmobiliaria/propiedades (+ /agentes para los selectores)
        /api/v1/inmobiliaria/propiedades/{id}/fotos (galería, de a una foto)
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
    var fotoPrincipal = null; // foto principal ya reducida (Blob)
    var catalogo = {};        // características: { clave: 'Texto' }
    var maxFotos = 9;
    // Galería del formulario: fotos que ya existen, nuevas por subir y las que se van a borrar
    var galeria = { existentes: [], nuevas: [], quitar: [] };

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
        if (r.caracteristicas) catalogo = r.caracteristicas;
        if (r.max_fotos) maxFotos = r.max_fotos;
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
        var totalFotos = (p.imagen ? 1 : 0) + (p.fotos ? p.fotos.length : 0);

        // Lo que le falta a la ficha para verse completa en el portal
        var falta = [];
        if (!p.imagen) falta.push('foto principal');
        if (!p.descripcion) falta.push('descripción');
        if (!p.caracteristicas || !p.caracteristicas.length) falta.push('características');
        var aviso = falta.length && !cerrada
            ? '<p class="i-incompleta"><i class="fa-solid fa-circle-exclamation"></i><span>Para que el invitado la vea completa, falta: ' + I.esc(falta.join(', ')) + '.</span></p>'
            : '';

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
                    '<span><i class="fa-solid fa-camera"></i>' + totalFotos + '</span>' +
                    '<span>' + (p.operacion === 'venta' ? 'Venta' : 'Arriendo') + '</span>' +
                '</div>' + aviso +
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

    /* ---------- Formulario: descripción y características ---------- */
    form.descripcion.addEventListener('input', function () {
        $('f-descripcion-cuenta').textContent = form.descripcion.value.length;
    });

    function pintarCaracteristicas(elegidas) {
        elegidas = elegidas || [];
        $('f-caracteristicas').innerHTML = Object.keys(catalogo).map(function (k) {
            return '<label><input type="checkbox" name="caracteristicas[]" value="' + I.esc(k) + '"' +
                (elegidas.indexOf(k) !== -1 ? ' checked' : '') + '> ' + I.esc(catalogo[k]) + '</label>';
        }).join('');
    }

    /* ---------- Reducir fotos antes de subirlas ----------
       Una foto de celular pesa 3-8 MB; se lleva a máximo 1600 px en JPEG
       para que cada envío sea liviano (el servidor limita el tamaño de cada petición). */
    var LADO_MAX = 1600;
    var PESO_MAX = 900 * 1024;
    var TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

    function cargarImagen(archivo) {
        return new Promise(function (ok, falla) {
            var img = new Image();
            var url = URL.createObjectURL(archivo);
            img.onload = function () { URL.revokeObjectURL(url); ok(img); };
            img.onerror = function () { URL.revokeObjectURL(url); falla(new Error('No se pudo leer la imagen.')); };
            img.src = url;
        });
    }

    async function reducir(archivo) {
        if (TIPOS_FOTO.indexOf(archivo.type) === -1) throw new Error('“' + archivo.name + '” no es JPG, PNG o WebP.');
        var img = await cargarImagen(archivo);
        var lado = Math.min(LADO_MAX, Math.max(img.naturalWidth, img.naturalHeight));

        // Primero baja la calidad; si aún pesa mucho, reduce el tamaño y vuelve a intentar
        for (var intento = 0; intento < 6; intento++) {
            var escala = lado / Math.max(img.naturalWidth, img.naturalHeight);
            var lienzo = document.createElement('canvas');
            lienzo.width = Math.round(img.naturalWidth * escala);
            lienzo.height = Math.round(img.naturalHeight * escala);
            var ctx = lienzo.getContext('2d');
            ctx.fillStyle = '#fff';                 // fondo blanco para PNG con transparencia
            ctx.fillRect(0, 0, lienzo.width, lienzo.height);
            ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);

            for (var calidad = 0.85; calidad > 0.5; calidad -= 0.1) {
                var blob = await new Promise(function (ok) { lienzo.toBlob(ok, 'image/jpeg', calidad); });
                if (!blob) throw new Error('No se pudo procesar “' + archivo.name + '”.');
                if (blob.size <= PESO_MAX) return blob;
            }
            lado = Math.round(lado * 0.75);
        }
        throw new Error('“' + archivo.name + '” es demasiado pesada. Prueba con otra foto.');
    }

    /* ---------- Formulario: foto principal ---------- */
    function pintarFoto(url) {
        $('f-foto-vista').hidden = !url;
        $('f-foto-vacio').hidden = !!url;
        $('f-foto-quitar').hidden = !url;
        if (url) $('f-foto-vista').src = url;
    }
    $('f-foto').addEventListener('change', async function () {
        var archivo = this.files[0];
        this.value = '';
        if (!archivo) return;
        try {
            fotoPrincipal = await reducir(archivo);
            quitarFoto = false;
            pintarFoto(URL.createObjectURL(fotoPrincipal));
        } catch (err) { I.toast(err.message); }
    });
    $('f-foto-quitar').addEventListener('click', function () {
        fotoPrincipal = null;
        quitarFoto = true;
        pintarFoto(null);
    });

    /* ---------- Formulario: galería ---------- */
    function totalGaleria() { return galeria.existentes.length + galeria.nuevas.length; }

    function pintarGaleria() {
        var html = galeria.existentes.map(function (f) {
            return '<figure><img src="' + I.esc(f.url) + '" alt="" loading="lazy">' +
                '<button type="button" data-quitar-existente="' + f.id + '" aria-label="Quitar foto"><i class="fa-solid fa-xmark"></i></button></figure>';
        }).concat(galeria.nuevas.map(function (f, i) {
            return '<figure class="nueva"><img src="' + f.vista + '" alt="">' +
                '<button type="button" data-quitar-nueva="' + i + '" aria-label="Quitar foto"><i class="fa-solid fa-xmark"></i></button></figure>';
        })).join('');
        $('f-galeria-lista').innerHTML = html;
        $('f-galeria-cuenta').textContent = '(' + totalGaleria() + ' de ' + maxFotos + ')';
        $('f-galeria-agregar').setAttribute('aria-disabled', totalGaleria() >= maxFotos ? 'true' : 'false');
    }

    $('f-galeria').addEventListener('change', async function () {
        var archivos = Array.prototype.slice.call(this.files);
        this.value = '';
        var cupo = maxFotos - totalGaleria();
        if (archivos.length > cupo) {
            I.toast('Solo caben ' + cupo + ' foto(s) más. Se tomaron las primeras.');
            archivos = archivos.slice(0, Math.max(cupo, 0));
        }
        for (var i = 0; i < archivos.length; i++) {
            try {
                var blob = await reducir(archivos[i]);
                galeria.nuevas.push({ blob: blob, vista: URL.createObjectURL(blob) });
            } catch (err) { I.toast(err.message); }
        }
        pintarGaleria();
    });

    $('f-galeria-lista').addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        if (b.hasAttribute('data-quitar-existente')) {
            var id = Number(b.getAttribute('data-quitar-existente'));
            galeria.quitar.push(id);
            galeria.existentes = galeria.existentes.filter(function (f) { return f.id !== id; });
        } else {
            var f = galeria.nuevas.splice(Number(b.getAttribute('data-quitar-nueva')), 1)[0];
            if (f) URL.revokeObjectURL(f.vista);
        }
        pintarGaleria();
    });

    // Después de guardar el inmueble: borra y sube las fotos de la galería, de a una.
    // Devuelve cuántas no se pudieron subir.
    async function sincronizarGaleria(id) {
        var fallas = 0;
        for (var i = 0; i < galeria.quitar.length; i++) {
            try { await I.api('/propiedades/' + id + '/fotos/' + galeria.quitar[i], { metodo: 'DELETE' }); }
            catch (err) { fallas++; }
        }
        for (var j = 0; j < galeria.nuevas.length; j++) {
            var datos = new FormData();
            datos.append('foto', galeria.nuevas[j].blob, 'foto-' + (j + 1) + '.jpg');
            try { await I.api('/propiedades/' + id + '/fotos', { metodo: 'POST', formulario: datos }); }
            catch (err) { fallas++; }
        }
        return fallas;
    }

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
        fotoPrincipal = null;
        galeria.nuevas.forEach(function (f) { URL.revokeObjectURL(f.vista); });
        galeria = { existentes: p && p.fotos ? p.fotos.slice() : [], nuevas: [], quitar: [] };
        form.reset();
        $('d-form-error').hidden = true;
        $('d-form-titulo').textContent = p ? 'Editar inmueble' : 'Registrar inmueble';
        $('f-estado-caja').hidden = !!p;   // el estado se cambia desde la tarjeta
        form.agente_id.innerHTML = I.opcionesAgentes(agentes, p && p.agente ? p.agente.id : null);

        if (p) {
            ['operacion', 'tipo', 'precio', 'barrio', 'direccion', 'habitaciones', 'banos', 'parqueaderos', 'area',
                'pisos', 'antiguedad', 'descripcion'].forEach(function (c) {
                form[c].value = p[c] == null ? '' : p[c];
            });
            form.estrato.value = p.estrato == null ? '' : String(p.estrato);
        }
        pintarDepartamentos(p ? p.departamento : null);
        pintarMunicipios(p ? p.ciudad : null);
        form.operacion.dispatchEvent(new Event('change'));
        pintarFoto(p ? p.imagen : null);
        pintarCaracteristicas(p ? p.caracteristicas : []);
        pintarGaleria();
        $('f-descripcion-cuenta').textContent = form.descripcion.value.length;

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
        datos.delete('imagen');
        if (fotoPrincipal) datos.append('imagen', fotoPrincipal, 'principal.jpg');
        if (editando) datos.delete('estado');
        if (editando && quitarFoto && !fotoPrincipal) datos.append('quitar_imagen', '1');
        // Vacíos se envían igual (llegan como null) para poder borrarlos al editar
        if (!datos.get('agente_id')) datos.delete('agente_id');
        // Sin casillas marcadas se envía vacío para que al editar se puedan quitar todas
        if (!datos.getAll('caracteristicas[]').length) datos.append('caracteristicas', '');

        var boton = $('d-form-guardar');
        boton.disabled = true;
        try {
            var r = await I.api(editando ? '/propiedades/' + editando.id : '/propiedades', { metodo: 'POST', formulario: datos });
            var fallas = 0;
            if (galeria.nuevas.length || galeria.quitar.length) {
                boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo fotos…';
                fallas = await sincronizarGaleria(r.data.id);
            }
            ventana.close();
            I.toast(fallas ? r.message + ' ' + fallas + ' foto(s) no se pudieron guardar; inténtalo de nuevo desde Editar.' : r.message);
            await cargarPropiedades();
        } catch (err) {
            error.textContent = err.message;
            error.hidden = false;
        } finally {
            boton.disabled = false;
            boton.innerHTML = '<i class="fa-solid fa-check"></i> Guardar inmueble';
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
