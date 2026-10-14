/* =========================================================
   UMBRAL — Dashboard del vendedor (Vender y Arrendar)
   Un solo script para las dos pantallas: la operación sale de
   <body data-operacion="venta|arriendo">.
   Todo viene de la API real (/api/v1/vendedor/...): lo que se
   publica aquí es lo que ve el invitado en la búsqueda pública.
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor;
    var usuario = V.guardia();
    if (!usuario) return;

    var clave = document.body.getAttribute('data-operacion');
    var OP = V.OPERACIONES[clave];
    var datos = { propiedades: [], contactos: [], visitas: [], vigente: null, planes: [] };
    var grafica = null;

    V.barra(usuario, clave);

    function $(id) { return document.getElementById(id); }

    /* ---------- Carga desde la API ---------- */
    async function cargar() {
        try {
            var r = await Promise.all([
                V.api('/propiedades'),
                V.api('/contactos'),
                V.api('/visitas?periodo=proximas'),
                V.api('/membresia')
            ]);
            datos.propiedades = r[0].data || [];
            datos.contactos = r[1].data || [];
            datos.visitas = r[2].data || [];
            datos.vigente = r[3].vigente || null;
            datos.planes = r[3].planes || [];
        } catch (e) {
            if (e.message !== 'Sin acceso') V.toast(e.message || 'No se pudieron cargar tus datos.');
        }
        pintar();
    }

    /* ---------- Consultas sobre los datos ---------- */
    function misInmuebles() { return datos.propiedades.filter(function (p) { return p.operacion === clave; }); }
    function misIds() { return misInmuebles().map(function (p) { return p.id; }); }
    // Contactos y visitas traen la propiedad en x.propiedad.id
    function deMisInmuebles(lista) {
        var ids = misIds();
        return lista.filter(function (x) { return x.propiedad && ids.indexOf(x.propiedad.id) !== -1; });
    }
    function inmueble(id) { return datos.propiedades.filter(function (p) { return p.id === id; })[0]; }
    function titulo(p) { return p ? (V.TIPOS[p.tipo] || p.tipo) + ' en ' + p.barrio : 'Inmueble eliminado'; }
    function membresiaActiva() { return !!datos.vigente; }

    /* ---------- Cabecera ---------- */
    $('d-icono').classList.add(OP.icono);
    $('d-etiqueta').textContent = OP.etiqueta;
    $('d-titulo').textContent = OP.titulo;
    $('d-desc').textContent = OP.descripcion;

    /* ---------- Membresía ---------- */
    function pintarMembresia() {
        var activa = membresiaActiva();
        var m = datos.vigente;
        var venceTxt = m ? new Date(m.fecha_fin + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

        $('d-membresia').innerHTML =
            '<div class="v-membresia-info"><i class="fa-solid ' + (activa ? 'fa-circle-check' : 'fa-credit-card') + '"></i><div>' +
            (activa
                ? '<b>Membresía ' + V.esc(String(m.nombre_plan).toLowerCase()) + ' activa</b><small>Vence el ' + V.esc(venceTxt) + ' · tus inmuebles publicados son visibles.</small>'
                : '<b>Sin membresía activa</b><small>Contrátala para publicar tus inmuebles en el portal.</small>') +
            '</div></div>' +
            '<button type="button" class="v-btn ' + (activa ? 'v-btn-suave' : 'v-btn-principal') + '" data-accion="planes">' +
            '<i class="fa-solid fa-credit-card"></i>' + (activa ? 'Renovar' : 'Contratar membresía') + '</button>';
    }

    /* ---------- Cifras ---------- */
    function pintarKpis() {
        var props = misInmuebles();
        var proximas = proximasVisitas();

        function kpi(i, icono, valor, texto) {
            return '<div class="v-kpi k-' + (i + 1) + '" style="--i:' + i + '"><div class="v-kpi-icono"><i class="fa-solid ' + icono + '"></i></div>' +
                '<b>' + valor + '</b><span>' + V.esc(texto) + '</span></div>';
        }

        $('d-kpis').innerHTML =
            kpi(0, 'fa-house', props.filter(function (p) { return p.estado === 'publicada'; }).length, OP.kpi1) +
            kpi(1, 'fa-comments', deMisInmuebles(datos.contactos).length, 'Contactos recibidos') +
            kpi(2, 'fa-calendar-check', proximas.length, 'Visitas programadas') +
            kpi(3, 'fa-handshake', props.filter(function (p) { return p.estado === OP.cierre; }).length, OP.kpiCierre);
    }

    /* ---------- Inmuebles ---------- */
    var ESTADOS = { publicada: 'Publicada', borrador: 'Borrador', pausada: 'Pausada', vendida: 'Vendida', arrendada: 'Arrendada' };

    // Iconos propios (SVG): se ven siempre, sin depender de ninguna fuente
    var SVG_EDITAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    var SVG_ELIMINAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

    function tarjeta(p) {
        var contactos = Number(p.contactos) || 0;
        var visitas = Number(p.visitas) || 0;
        var cerrado = p.estado === OP.cierre;
        var botones = '';

        function boton(accion, icono, texto) {
            return '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="' + accion + '" data-id="' + p.id + '">' +
                '<i class="fa-solid ' + icono + '"></i>' + texto + '</button>';
        }
        function iconoCirc(accion, svg, texto) {
            return '<button type="button" class="v-icon-circ ' + accion + '" data-accion="' + accion + '" data-id="' + p.id + '" title="' + texto + '" aria-label="' + texto + '">' + svg + '</button>';
        }

        if (p.estado === 'borrador') botones += boton('publicar', 'fa-bullhorn', 'Publicar');
        if (p.estado === 'publicada') botones += boton('pausar', 'fa-pause', 'Pausar') + boton('cerrar', 'fa-handshake', OP.cierreAccion);
        if (p.estado === 'pausada') botones += boton('reanudar', 'fa-play', 'Reanudar');

        var herramientas = '<div class="v-prop-herramientas">' +
            (cerrado ? '' : iconoCirc('editar', SVG_EDITAR, 'Editar inmueble')) +
            iconoCirc('eliminar', SVG_ELIMINAR, 'Eliminar inmueble') + '</div>';

        var verMapa = (p.lat != null && p.lng != null && isFinite(p.lat) && isFinite(p.lng))
            ? '<a class="v-enlace" href="https://www.google.com/maps?q=' + Number(p.lat) + ',' + Number(p.lng) + '" target="_blank" rel="noopener">Ver mapa</a>'
            : '';

        return '<article class="v-prop">' +
            '<div class="v-prop-foto"><i class="fa-solid fa-house"></i>' +
            (p.imagen ? '<img src="' + V.esc(p.imagen) + '" alt="" loading="lazy">' : '') +
            '<span class="v-estado ' + V.esc(p.estado) + '">' + V.esc(ESTADOS[p.estado] || p.estado) + '</span>' + herramientas + '</div>' +
            '<div class="v-prop-cuerpo">' +
                '<div class="v-prop-precio">' + V.cop(p.precio) + '<small>' + OP.sufijoPrecio + '</small></div>' +
                '<h3>' + V.esc(titulo(p)) + '</h3>' +
                '<div class="v-prop-lugar"><i class="fa-solid fa-location-dot"></i> ' + V.esc(p.ciudad) + ', ' + V.esc(p.departamento) + verMapa + '</div>' +
                '<div class="v-prop-datos">' +
                    '<span><i class="fa-solid fa-bed"></i>' + Number(p.habitaciones) + '</span>' +
                    '<span><i class="fa-solid fa-bath"></i>' + Number(p.banos) + '</span>' +
                    '<span><i class="fa-solid fa-ruler-combined"></i>' + Number(p.area) + ' m²</span>' +
                '</div>' +
            '</div>' +
            '<div class="v-prop-metricas"><span><b>' + contactos + '</b> contactos</span><span><b>' + visitas + '</b> visitas</span></div>' +
            (botones ? '<div class="v-prop-acciones">' + botones + '</div>' : '') + '</article>';
    }
    function pintarInmuebles() {
        var props = misInmuebles().sort(function (a, b) { return b.id - a.id; });
        $('d-total').textContent = props.length + (props.length === 1 ? ' inmueble' : ' inmuebles');

        $('d-propiedades').innerHTML = props.length
            ? props.map(tarjeta).join('')
            : '<div class="v-vacio v-vacio-grande"><i class="fa-solid fa-house-circle-exclamation"></i>' + V.esc(OP.vacio) + '.<br>Usa “Registrar inmueble” para empezar.</div>';

        // Si una foto no carga, se queda el fondo con el icono
        $('d-propiedades').querySelectorAll('img').forEach(function (img) {
            img.addEventListener('error', function () { img.remove(); });
        });
    }

    /* ---------- Contactos ---------- */
    var ETIQUETA_CONTACTO = { nuevo: 'Nuevo', en_seguimiento: 'En seguimiento', cerrado: 'Cerrado', descartado: 'Descartado' };

    function pintarContactos() {
        var lista = deMisInmuebles(datos.contactos).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); }).slice(0, 6);

        $('d-contactos').innerHTML = lista.length ? lista.map(function (c) {
            var esCorreo = String(c.contacto).indexOf('@') !== -1;
            var enlace = (esCorreo ? 'mailto:' : 'tel:+57') + V.esc(String(c.contacto).replace(esCorreo ? /\s/g : /\D/g, ''));
            var nuevo = c.estado === 'nuevo';
            return '<div class="v-fila"><span class="v-fila-avatar">' + V.esc(V.iniciales(c.nombre)) + '</span>' +
                '<div class="v-fila-texto"><b>' + V.esc(c.nombre) + '</b><span>' + V.esc(c.mensaje) + '</span>' +
                '<small>' + V.esc(c.propiedad.titulo) + ' · ' + V.esc(V.relativo(c.fecha)) + '</small></div>' +
                '<span class="v-insignia ' + (nuevo ? 'nuevo' : 'atendido') + '">' + V.esc(ETIQUETA_CONTACTO[c.estado] || c.estado) + '</span>' +
                '<a class="v-btn v-btn-suave v-btn-mini" href="' + enlace + '" title="' + (esCorreo ? 'Escribir' : 'Llamar') + '" aria-label="' + (esCorreo ? 'Escribir' : 'Llamar') + '">' +
                '<i class="fa-solid ' + (esCorreo ? 'fa-envelope' : 'fa-phone') + '"></i></a>' +
                (nuevo ? '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="atender" data-id="' + c.id + '" title="Marcar como atendido" aria-label="Marcar como atendido"><i class="fa-solid fa-check"></i></button>' : '') +
                '</div>';
        }).join('') : '<div class="v-vacio"><i class="fa-solid fa-comments"></i>Cuando alguien se interese en tus inmuebles, lo verás aquí.</div>';
    }

    /* ---------- Visitas ---------- */
    function proximasVisitas() {
        return deMisInmuebles(datos.visitas).filter(function (v) {
            return (v.estado === 'pendiente' || v.estado === 'confirmada') && new Date(v.fecha) > new Date();
        });
    }

    function pintarVisitas() {
        var lista = proximasVisitas().sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); }).slice(0, 5);

        $('d-visitas').innerHTML = lista.length ? lista.map(function (v) {
            return '<div class="v-fila"><span class="v-fila-avatar">' + new Date(v.fecha).getDate() + '</span>' +
                '<div class="v-fila-texto"><b>' + V.esc(v.nombre) + '</b><span>' + V.esc(v.propiedad.titulo) + '</span>' +
                '<small>' + V.esc(V.fecha(v.fecha)) + '</small></div>' +
                '<span class="v-insignia ' + V.esc(v.estado) + '">' + (v.estado === 'confirmada' ? 'Confirmada' : 'Pendiente') + '</span>' +
                (v.estado === 'pendiente' ? '<button type="button" class="v-btn v-btn-suave v-btn-mini" data-accion="confirmar" data-id="' + v.id + '" title="Confirmar visita" aria-label="Confirmar visita"><i class="fa-solid fa-check"></i></button>' : '') +
                '</div>';
        }).join('') : '<div class="v-vacio"><i class="fa-solid fa-calendar-check"></i>No tienes visitas programadas.</div>';
    }

    /* ---------- Gráfica de contactos (Chart.js) ---------- */
    function pintarGrafica() {
        var lienzo = $('d-grafica');
        if (!window.Chart) { lienzo.parentNode.innerHTML = '<div class="v-vacio">No se pudo cargar la gráfica.</div>'; return; }

        var etiquetas = [], valores = [], hoy = new Date();
        for (var i = 6; i >= 0; i--) {
            var dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
            etiquetas.push(dia.toLocaleDateString('es-CO', { weekday: 'short' }));
            valores.push(deMisInmuebles(datos.contactos).filter(function (c) {
                var f = new Date(c.fecha);
                return f.getFullYear() === dia.getFullYear() && f.getMonth() === dia.getMonth() && f.getDate() === dia.getDate();
            }).length);
        }

        var estilo = getComputedStyle(document.body);
        var color = estilo.getPropertyValue('--op-1').trim() || '#5b3df0';
        var texto = estilo.getPropertyValue('--texto-suave').trim() || '#5b6385';
        var rejilla = estilo.getPropertyValue('--campo-borde').trim() || '#e3e1ee';

        if (grafica) grafica.destroy();
        grafica = new window.Chart(lienzo, {
            type: 'line',
            data: { labels: etiquetas, datasets: [{ data: valores, borderColor: color, backgroundColor: color + '26', fill: true, tension: 0.35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: color }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: texto } },
                    y: { beginAtZero: true, ticks: { color: texto, stepSize: 1, precision: 0 }, grid: { color: rejilla } }
                }
            }
        });
    }

    function pintar() {
        pintarMembresia();
        pintarKpis();
        pintarInmuebles();
        pintarContactos();
        pintarVisitas();
        pintarGrafica();
    }

    /* ---------- Ventana: registrar / editar inmueble ---------- */
    var ventanaForm = $('d-form');
    var form = $('d-form-campos');
    V.prepararVentana(ventanaForm);

    form.tipo.innerHTML = Object.keys(V.TIPOS).map(function (k) { return '<option value="' + k + '">' + V.TIPOS[k] + '</option>'; }).join('');
    form.estrato.innerHTML = '<option value="">Sin estrato</option>' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option value="' + n + '">Estrato ' + n + '</option>'; }).join('');
    $('f-precio-etiqueta').textContent = clave === 'venta' ? 'Precio de venta (COP)' : 'Canon mensual (COP)';

    /* ----- Departamento y municipio: catálogo oficial (el servidor valida contra él) ----- */
    var ubicaciones = [];

    function opcion(valor, texto) { return '<option value="' + V.esc(valor) + '">' + V.esc(texto) + '</option>'; }

    function llenarCiudades(departamento, ciudad) {
        var dep = ubicaciones.filter(function (d) { return d.nombre === departamento; })[0];
        form.ciudad.innerHTML = opcion('', dep ? 'Elige un municipio' : 'Elige primero el departamento') +
            (dep ? dep.municipios.map(function (m) { return opcion(m, m); }).join('') : '');
        form.ciudad.value = ciudad || '';
    }

    async function cargarUbicaciones() {
        try {
            var r = await fetch('/api/v1/public/ubicaciones', { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
            var j = await r.json();
            ubicaciones = j.data || [];
        } catch (e) { ubicaciones = []; }
        if (!ubicaciones.length) V.toast('No se pudo cargar la lista de departamentos. Recarga la página.');
        form.departamento.innerHTML = opcion('', 'Elige un departamento') +
            ubicaciones.map(function (d) { return opcion(d.nombre, d.nombre); }).join('');
        llenarCiudades('', '');
    }

    form.departamento.addEventListener('change', function () { llenarCiudades(form.departamento.value, ''); });

    /* ----- Foto del inmueble: se reduce en el navegador y se envía como archivo ----- */
    var fotoArchivo = null;     // Blob nuevo elegido por el usuario
    var fotoVista = null;       // lo que se muestra (URL del servidor o del Blob nuevo)
    var quitarFoto = false;     // true si había foto guardada y el usuario la quitó

    function pintarFoto() {
        $('f-foto-vista').hidden = !fotoVista;
        $('f-foto-vacio').hidden = !!fotoVista;
        $('f-foto-quitar').hidden = !fotoVista;
        $('f-foto-quitar').style.display = fotoVista ? '' : 'none';
        if (fotoVista) $('f-foto-vista').src = fotoVista;
    }

    function soltarVista() {
        if (fotoVista && fotoVista.indexOf('blob:') === 0) URL.revokeObjectURL(fotoVista);
    }

    // Reduce la imagen a 1200 px y la convierte en un JPG liviano (el servidor admite hasta 4 MB)
    function reducirImagen(archivo, listo) {
        var lector = new FileReader();
        lector.onerror = function () { listo(null); };
        lector.onload = function () {
            var img = new Image();
            img.onerror = function () { listo(null); };
            img.onload = function () {
                var escala = Math.min(1, 1200 / Math.max(img.width, img.height));
                var lienzo = document.createElement('canvas');
                lienzo.width = Math.round(img.width * escala);
                lienzo.height = Math.round(img.height * escala);
                var ctx = lienzo.getContext('2d');
                ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, lienzo.width, lienzo.height);
                ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
                lienzo.toBlob(function (blob) { listo(blob); }, 'image/jpeg', 0.8);
            };
            img.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    }

    $('f-foto').addEventListener('change', function () {
        var archivo = this.files && this.files[0];
        if (!archivo) return;
        if (archivo.type.indexOf('image/') !== 0) { V.toast('Elige un archivo de imagen (JPG, PNG o WebP).'); this.value = ''; return; }
        if (archivo.size > 15 * 1024 * 1024) { V.toast('La foto pesa demasiado (máximo 15 MB).'); this.value = ''; return; }
        reducirImagen(archivo, function (blob) {
            if (!blob) { V.toast('No se pudo leer esa imagen. Prueba con otra.'); return; }
            soltarVista();
            fotoArchivo = blob;
            fotoVista = URL.createObjectURL(blob);
            quitarFoto = false;
            pintarFoto();
        });
        this.value = '';
    });

    $('f-foto-quitar').addEventListener('click', function () {
        // Si la foto era del servidor, hay que avisarle que la borre al guardar
        if (!fotoArchivo) quitarFoto = true;
        soltarVista();
        fotoArchivo = null; fotoVista = null;
        pintarFoto();
    });

    /* ----- Ubicación: mapa de Leaflet con pin que se puede mover ----- */
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
        // La ventana acaba de abrirse: Leaflet necesita recalcular su tamaño
        setTimeout(function () {
            mapa.invalidateSize();
            if (lat != null && lng != null) { fijarPunto(Number(lat), Number(lng), true); }
            else { quitarPunto(); mapa.setView(CENTRO_COLOMBIA, 5); }
        }, 80);
    }

    // Busca la dirección escrita (OpenStreetMap / Nominatim) y pone el pin ahí
    $('f-buscar').addEventListener('click', function () {
        if (!mapa) return;
        var consulta = [form.direccion.value, form.barrio.value, form.ciudad.value, form.departamento.value, 'Colombia']
            .map(function (t) { return t.trim(); }).filter(Boolean).join(', ');
        if (!form.ciudad.value.trim()) { V.toast('Escribe al menos la ciudad para buscar.'); return; }

        var boton = this; boton.disabled = true;
        fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=' + encodeURIComponent(consulta), { headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res[0]) { fijarPunto(parseFloat(res[0].lat), parseFloat(res[0].lon), true); }
                else { V.toast('No encontramos esa dirección. Marca el punto directamente en el mapa.'); }
            })
            .catch(function () { V.toast('No se pudo buscar la dirección. Marca el punto en el mapa.'); })
            .then(function () { boton.disabled = false; });
    });

    $('f-gps').addEventListener('click', function () {
        if (!mapa) return;
        if (!navigator.geolocation) { V.toast('Tu navegador no permite obtener la ubicación.'); return; }
        navigator.geolocation.getCurrentPosition(
            function (pos) { fijarPunto(pos.coords.latitude, pos.coords.longitude, true); },
            function () { V.toast('No pudimos obtener tu ubicación. Marca el punto en el mapa.'); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    function abrirForm(p) {
        form.reset();
        form.id.value = p ? p.id : '';
        $('d-form-titulo').textContent = p ? 'Editar inmueble' : 'Registrar inmueble';
        $('d-form-nota').textContent = membresiaActiva()
            ? 'Con tu membresía activa, el inmueble se publica al guardarlo.'
            : 'Sin membresía activa se guarda como borrador; se publicará cuando la contrates.';
        if (p) {
            ['tipo', 'precio', 'barrio', 'direccion', 'habitaciones', 'banos', 'parqueaderos', 'area', 'estrato'].forEach(function (c) {
                form[c].value = p[c] == null ? '' : p[c];
            });
            form.departamento.value = p.departamento;
            llenarCiudades(p.departamento, p.ciudad);
        } else {
            form.departamento.value = '';
            llenarCiudades('', '');
        }
        soltarVista();
        fotoArchivo = null; quitarFoto = false;
        fotoVista = p && p.imagen ? p.imagen : null;
        pintarFoto();
        ventanaForm.showModal();
        if (!ubicaciones.length) V.toast('La lista de departamentos está vacía: hay que cargar los municipios en la base de datos.');
        iniciarMapa(p ? p.lat : null, p ? p.lng : null);
    }
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        if (!form.lat.value || !form.lng.value) {
            V.toast('Marca la ubicación del inmueble en el mapa.');
            $('d-mapa').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        var fd = new FormData();
        fd.append('operacion', clave);
        ['tipo', 'precio', 'departamento', 'ciudad', 'barrio', 'direccion', 'lat', 'lng', 'habitaciones', 'banos', 'parqueaderos', 'area'].forEach(function (c) {
            fd.append(c, String(form[c].value).trim());
        });
        if (form.estrato.value) fd.append('estrato', form.estrato.value);
        if (fotoArchivo) fd.append('imagen', fotoArchivo, 'foto.jpg');
        else if (quitarFoto) fd.append('quitar_imagen', '1');

        var existente = form.id.value ? inmueble(Number(form.id.value)) : null;
        var boton = form.querySelector('[type="submit"]');
        if (boton) boton.disabled = true;

        try {
            var r = await V.api(existente ? '/propiedades/' + existente.id : '/propiedades', { metodo: 'POST', formulario: fd });
            ventanaForm.close();
            if (existente) V.toast('Inmueble actualizado.');
            else V.toast(r.data && r.data.estado === 'publicada'
                ? 'Inmueble publicado.'
                : 'Guardado como borrador: activa tu membresía para publicarlo.');
            await cargar();
        } catch (err) {
            if (err.message !== 'Sin acceso') V.toast(err.message);
        } finally {
            if (boton) boton.disabled = false;
        }
    });

    /* ---------- Ventana: planes de membresía ---------- */
    var ventanaPlanes = $('d-planes');
    var planElegido = 'quincenal';
    V.prepararVentana(ventanaPlanes);

    function listaPlanes() {
        if (datos.planes.length) return datos.planes;
        return Object.keys(V.PLANES).map(function (k) { return { plan: k, nombre: V.PLANES[k].nombre, dias: V.PLANES[k].dias }; });
    }

    function pintarPlanes() {
        $('d-planes-lista').innerHTML = listaPlanes().map(function (pl) {
            return '<button type="button" class="v-plan" data-plan="' + V.esc(pl.plan) + '" aria-pressed="' + (pl.plan === planElegido) + '">' +
                V.esc(pl.nombre) + '<small>' + pl.dias + ' días' + (pl.precio ? ' · ' + V.cop(pl.precio) : '') + '</small></button>';
        }).join('');
    }

    $('d-planes-lista').addEventListener('click', function (e) {
        var b = e.target.closest('[data-plan]');
        if (!b) return;
        planElegido = b.getAttribute('data-plan');
        pintarPlanes();
    });

    $('d-planes-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var boton = this.querySelector('[type="submit"]');
        if (boton) boton.disabled = true;
        try {
            var r = await V.api('/membresia', { metodo: 'POST', datos: { plan: planElegido } });
            ventanaPlanes.close();
            V.toast(r.message || 'Membresía activada.');
            await cargar();
        } catch (err) {
            if (err.message !== 'Sin acceso') V.toast(err.message);
        } finally {
            if (boton) boton.disabled = false;
        }
    });

    function abrirPlanes() { pintarPlanes(); ventanaPlanes.showModal(); }

    /* ---------- Acciones (botones de la pantalla) ---------- */
    $('d-registrar').addEventListener('click', function () { abrirForm(null); });

    function cambiarEstado(id, estado) {
        return V.api('/propiedades/' + id + '/estado', { metodo: 'PATCH', datos: { estado: estado } });
    }

    document.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-accion]');
        if (!b) return;

        var accion = b.getAttribute('data-accion');
        var id = Number(b.getAttribute('data-id'));
        var p = inmueble(id);

        if (accion === 'planes') return abrirPlanes();
        if (accion === 'editar' && p) return abrirForm(p);
        if ((accion === 'publicar' || accion === 'reanudar') && !membresiaActiva()) {
            V.toast('Necesitas una membresía activa para publicar.');
            return abrirPlanes();
        }
        if (accion === 'eliminar' && !window.confirm('¿Eliminar este inmueble? También se quitarán sus contactos y visitas.')) return;

        b.disabled = true;
        try {
            var mensaje;
            if (accion === 'publicar' && p) { await cambiarEstado(id, 'publicada'); mensaje = 'Inmueble publicado.'; }
            else if (accion === 'pausar' && p) { await cambiarEstado(id, 'pausada'); mensaje = 'Publicación pausada.'; }
            else if (accion === 'reanudar' && p) { await cambiarEstado(id, 'publicada'); mensaje = 'Publicación reanudada.'; }
            else if (accion === 'cerrar' && p) { await cambiarEstado(id, OP.cierre); mensaje = OP.cierreMensaje; }
            else if (accion === 'eliminar' && p) { await V.api('/propiedades/' + id, { metodo: 'DELETE' }); mensaje = 'Inmueble eliminado.'; }
            else if (accion === 'atender') { await V.api('/contactos/' + id, { metodo: 'PATCH', datos: { estado: 'en_seguimiento' } }); mensaje = 'Contacto marcado como atendido.'; }
            else if (accion === 'confirmar') { await V.api('/visitas/' + id, { metodo: 'PATCH', datos: { estado: 'confirmada' } }); mensaje = 'Visita confirmada.'; }
            else { b.disabled = false; return; }

            V.toast(mensaje);
            await cargar();
        } catch (err) {
            b.disabled = false;
            if (err.message !== 'Sin acceso') V.toast(err.message);
        }
    });

    // Si cambia el tema, la gráfica se vuelve a dibujar con los colores nuevos
    document.addEventListener('umbral:tema', pintarGrafica);

    pintar();
    cargarUbicaciones();
    cargar();
})();