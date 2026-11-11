/* Umbral: propiedades destacadas por nivel (Oro, Plata y Bronce).
   10 por nivel en 2 filas de 5. El paso al siguiente nivel lo marca la línea de progreso.
   Cada tarjeta con varias fotos funciona como un pequeño carrusel. */
(function () {
    'use strict';

    var vista = document.getElementById('propiedades-destacadas');
    var raiz = document.getElementById('destacadas');
    if (!vista || !raiz) return;

    var anterior = document.getElementById('destacadas-anterior');
    var siguiente = document.getElementById('destacadas-siguiente');
    var indicador = document.getElementById('destacadas-indicador');
    var cab = document.getElementById('dest-cab');
    var titulo = document.getElementById('dest-titulo');
    var sub = document.getElementById('dest-sub');
    var barra = document.getElementById('dest-barra');
    var API = window.UMBRAL_API;

    var SEGUNDOS = 7;        // cuánto dura cada nivel en pantalla
    var FOTO_SEGUNDOS = 4;   // cada cuánto cambia la foto de las tarjetas
    var POR_NIVEL = 10;      // máximo de propiedades por nivel
    var MAX_FOTOS = 5;       // máximo de fotos por tarjeta
    var NIVELES = [
        { clave: 'oro',    nombre: 'Oro',    etiqueta: 'Oro',    sub: 'Máxima visibilidad en Umbral' },
        { clave: 'plata',  nombre: 'Plata',  etiqueta: 'Plata',  sub: 'Alta visibilidad en Umbral' },
        { clave: 'bronce', nombre: 'Bronce', etiqueta: 'Bronce', sub: 'Publicaciones destacadas en Umbral' }
    ];

    var ICONO = {
        cama:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M3 15h18"/><path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>',
        bano:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M8 19l-1 2M16 19l1 2"/></svg>',
        carro:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16v-4l2-5h10l2 5v4"/><path d="M3 16h18v3H3z"/><path d="M7 12h10"/></svg>',
        area:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 9h5M4 14h5M9 4v5"/></svg>',
        estrato: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>',
        pin:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
        check:   '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
        izq:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
        der:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
        lupa:    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
    };

    var grupos = [];       // [{ nivel, props, el }]
    var actual = 0;
    var pausado = false;
    var enPantalla = true;

    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function dinero(valor) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(valor || 0));
    }

    function urlImagen(ruta) {
        if (!ruta) return '';
        if (/^https?:\/\//i.test(ruta)) return ruta;
        try { return new URL(ruta, new URL(API, window.location.href).origin).href; }
        catch (_) { return ruta; }
    }

    // Todas las fotos de la propiedad, sin repetir
    function fotosDe(p) {
        var lista = [];
        [p.fotos, p.photos].forEach(function (arr) {
            if (Array.isArray(arr)) arr.forEach(function (f) { if (f) lista.push(f.url || f); });
        });
        if (p.img) lista.unshift(p.img);
        var vistas = {};
        return lista.map(urlImagen).filter(function (u) {
            if (!u || vistas[u]) return false;
            vistas[u] = true;
            return true;
        }).slice(0, MAX_FOTOS);
    }

    function pertenece(p, nivel) {
        if (String(p.tier || '').toLowerCase() !== nivel.clave) return false;
        return nivel.clave === 'bronce' || p.prem === true;   // Oro y Plata solo con membresía activa
    }

    function dato(icono, texto, titulo, extra) {
        return '<span class="dest-dato ' + (extra || '') + '" title="' + escapar(titulo) + '">' + ICONO[icono] + escapar(texto) + '</span>';
    }

    function tarjeta(p, nivel, i) {
        var fotos = fotosDe(p);
        var lugar = [p.city, p.dept].filter(function (v, k, a) { return v && a.indexOf(v) === k; }).join(' · ');
        var tipo = String(p.type || 'Propiedad').replace(/_/g, ' ');
        var titulo = tipo.charAt(0).toUpperCase() + tipo.slice(1) + (p.barrio ? ' en ' + p.barrio : '');
        var alt = tipo + ' en ' + (lugar || 'Colombia');
        var arriendo = p.op === 'arriendo';
        var datos = [
            p.beds ? dato('cama', p.beds, 'Habitaciones') : '',
            p.baths ? dato('bano', p.baths, 'Baños') : '',
            p.park ? dato('carro', p.park, 'Parqueaderos') : '',
            p.area ? dato('area', p.area + ' m²', 'Área') : '',
            p.estrato ? dato('estrato', 'E' + p.estrato, 'Estrato', 'dest-dato-estrato') : ''
        ].join('');
        // El panel de invitado abre solo el detalle de la propiedad con ?propiedad=ID
        var enlace = p.id != null ? '/inmuebles?propiedad=' + encodeURIComponent(p.id) : '/inmuebles';

        // Carrusel de fotos: solo la primera se carga ya; las demás cuando se van a mostrar
        var imgs = fotos.map(function (f, k) {
            return '<img ' + (k === 0 ? 'src' : 'data-src') + '="' + escapar(f) + '" alt="' + escapar(alt) + '" loading="lazy" draggable="false">';
        }).join('');
        var controles = fotos.length > 1
            ? '<button type="button" class="dest-fl dest-fl-ant" data-dir="-1" aria-label="Foto anterior">' + ICONO.izq + '</button>' +
              '<button type="button" class="dest-fl dest-fl-sig" data-dir="1" aria-label="Foto siguiente">' + ICONO.der + '</button>' +
              '<div class="dest-puntos" aria-hidden="true">' +
                  fotos.map(function (f, k) { return '<i' + (k === 0 ? ' class="on"' : '') + '></i>'; }).join('') +
              '</div>'
            : '';

        return '<article class="dest-card" style="--i:' + i + '">' +
            '<div class="dest-img">' +
                '<div class="dest-foto">' +
                    (fotos.length ? '<div class="dest-pista">' + imgs + '</div>' : '<div class="dest-sin-img">UMBRAL</div>') +
                '</div>' +
                controles +
                '<div class="dest-badges"><span class="dest-b ' + (arriendo ? 'dest-b-arriendo' : 'dest-b-venta') + '">' + (arriendo ? 'Arriendo' : 'Venta') + '</span></div>' +
                (p.ver ? '<span class="dest-verificada" title="Verificada">' + ICONO.check + '<span>Verificada</span></span>' : '') +
                '<span class="dest-rank">' + (i + 1) + '</span>' +
                '<span class="dest-nivel">' + nivel.etiqueta + '</span>' +
            '</div>' +
            '<div class="dest-cuerpo">' +
                '<h3 title="' + escapar(titulo) + '">' + escapar(titulo) + '</h3>' +
                '<p class="dest-lugar">' + ICONO.pin + '<span>' + escapar(lugar || 'Colombia') + '</span></p>' +
                (datos ? '<div class="dest-datos">' + datos + '</div>' : '') +
                '<div class="dest-pie">' +
                    '<strong class="dest-precio"><span>' + escapar(dinero(p.price)) + '</span>' + (arriendo ? '<small>/ mes</small>' : '') + '</strong>' +
                    '<a href="' + escapar(enlace) + '" class="dest-ver" aria-label="Consultar propiedad" title="Consultar">' + ICONO.lupa + '</a>' +
                '</div>' +
            '</div>' +
        '</article>';
    }

    /* ---------- fotos de cada tarjeta ---------- */
    function cargarFoto(card, i) {
        var img = card.querySelectorAll('.dest-pista img')[i];
        if (img && img.getAttribute('data-src')) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        }
    }

    function pasarFoto(card, delta) {
        var imgs = card.querySelectorAll('.dest-pista img');
        var n = imgs.length;
        if (n < 2) return;
        var i = (((+card.getAttribute('data-f') || 0) + delta) % n + n) % n;
        card.setAttribute('data-f', i);
        card.querySelector('.dest-pista').style.transform = 'translateX(' + (-100 * i) + '%)';
        cargarFoto(card, i);
        cargarFoto(card, (i + 1) % n);
        Array.prototype.forEach.call(card.querySelectorAll('.dest-puntos i'), function (punto, k) {
            punto.classList.toggle('on', k === i);
        });
    }

    function precargarPagina(g) {
        Array.prototype.forEach.call(g.el.querySelectorAll('.dest-card'), function (card) {
            cargarFoto(card, 0);
            cargarFoto(card, 1);
        });
    }

    // Flechas de cada tarjeta
    vista.addEventListener('click', function (e) {
        var boton = e.target.closest ? e.target.closest('.dest-fl') : null;
        if (!boton) return;
        pasarFoto(boton.closest('.dest-card'), +boton.getAttribute('data-dir'));
    });

    // Cambio automático de foto: las tarjetas van una tras otra, como una ola
    window.setInterval(function () {
        if (pausado || !enPantalla || document.hidden || !grupos.length || !grupos[actual].el) return;
        Array.prototype.forEach.call(grupos[actual].el.querySelectorAll('.dest-card'), function (card, k) {
            window.setTimeout(function () { pasarFoto(card, 1); }, k * 150);
        });
    }, FOTO_SEGUNDOS * 1000);

    /* ---------- cambio de nivel ---------- */
    function reiniciarAnimaciones() {
        if (cab) { cab.classList.remove('flash'); void cab.offsetWidth; cab.classList.add('flash'); }
        if (barra && grupos.length > 1) { barra.classList.remove('corre'); void barra.offsetWidth; barra.classList.add('corre'); }
    }

    function mostrar(i) {
        if (!grupos.length) return;
        actual = (i + grupos.length) % grupos.length;
        grupos.forEach(function (g, k) {
            var activa = k === actual;
            g.el.classList.toggle('activa', activa);
            g.el.setAttribute('aria-hidden', activa ? 'false' : 'true');
            g.el.inert = !activa;
        });
        var g = grupos[actual];
        raiz.setAttribute('data-nivel', g.nivel.clave);
        if (titulo) titulo.textContent = 'Propiedades ' + g.nivel.nombre;
        if (sub) sub.textContent = g.nivel.sub;
        if (indicador) indicador.textContent = g.props.length + (g.props.length === 1 ? ' propiedad' : ' propiedades');
        precargarPagina(g);
        reiniciarAnimaciones();
    }

    function actualizarPausa() {
        raiz.classList.toggle('pausa', pausado || !enPantalla || document.hidden);
    }

    function sinFlechas() {
        if (anterior) anterior.hidden = true;
        if (siguiente) siguiente.hidden = true;
    }

    raiz.style.setProperty('--seg', SEGUNDOS + 's');

    // Cuando la línea de progreso termina, pasa al siguiente nivel
    if (barra) barra.addEventListener('animationend', function () { mostrar(actual + 1); });

    if (anterior) anterior.addEventListener('click', function () { mostrar(actual - 1); });
    if (siguiente) siguiente.addEventListener('click', function () { mostrar(actual + 1); });

    // Se pausa mientras el mouse o el teclado están sobre el carrusel, o si no se ve
    raiz.addEventListener('mouseenter', function () { pausado = true; actualizarPausa(); });
    raiz.addEventListener('mouseleave', function () { pausado = false; actualizarPausa(); });
    raiz.addEventListener('focusin', function () { pausado = true; actualizarPausa(); });
    raiz.addEventListener('focusout', function () { pausado = false; actualizarPausa(); });
    document.addEventListener('visibilitychange', actualizarPausa);

    // Entrada del marco y de las tarjetas cada vez que aparece en pantalla
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entradas) {
            enPantalla = entradas[0].isIntersecting;
            raiz.classList.toggle('dest-in', enPantalla);
            actualizarPausa();
        }, { threshold: 0.25 }).observe(raiz);
    } else {
        raiz.classList.add('dest-in');
    }

    // Orden al azar: en cada visita se muestran otras 10 del mismo nivel
    function mezclar(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[k]; a[k] = t; }
        return a;
    }

    async function cargar() {
        if (!API) {
            vista.innerHTML = '<p class="dest-aviso">No se encontró la configuración de la API.</p>';
            sinFlechas();
            return;
        }
        try {
            var pedir = function (n) { return fetch(API.replace(/\/$/, '') + '/public/propiedades?per_page=100&page=' + n, { headers: { Accept: 'application/json' } }); };
            var respuesta = await pedir(1);
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            var json = await respuesta.json();
            var lista = Array.isArray(json.data) ? json.data : [];

            // El servidor entrega primero las de membresía (Oro, Plata, Bronce): se piden páginas mientras la última sea de membresía
            var paginas = (json.meta && json.meta.last_page) || 1;
            for (var n = 2; n <= paginas && lista.length && lista[lista.length - 1].tier; n++) {
                var r = await pedir(n);
                if (!r.ok) break;
                var j = await r.json();
                lista = lista.concat(Array.isArray(j.data) ? j.data : []);
            }

            grupos = NIVELES.map(function (nivel) {
                return { nivel: nivel, props: mezclar(lista.filter(function (p) { return pertenece(p, nivel); })).slice(0, POR_NIVEL), el: null };
            }).filter(function (g) { return g.props.length; });

            if (!grupos.length) {
                vista.innerHTML = '<p class="dest-aviso">En este momento no hay propiedades destacadas publicadas. Aquí aparecerán automáticamente cuando estén disponibles.</p>';
                sinFlechas();
                if (indicador) indicador.textContent = 'Sin propiedades';
                return;
            }

            vista.innerHTML = grupos.map(function (g) {
                return '<div class="dest-pagina n-' + g.nivel.clave + '" role="group" aria-label="Propiedades ' + g.nivel.nombre + '">' +
                    g.props.map(function (p, i) { return tarjeta(p, g.nivel, i); }).join('') +
                '</div>';
            }).join('');
            grupos.forEach(function (g, i) { g.el = vista.children[i]; });

            if (grupos.length < 2) sinFlechas();
            mostrar(0);
            actualizarPausa();
        } catch (error) {
            console.error('No se pudieron cargar las propiedades destacadas:', error);
            vista.innerHTML = '<p class="dest-aviso">No pudimos cargar las propiedades destacadas. Intenta actualizar la página en un momento.</p>';
            sinFlechas();
        }
    }

    cargar();
})();