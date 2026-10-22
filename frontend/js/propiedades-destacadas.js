/* Umbral: propiedades destacadas reales con membresía Oro. */
(function () {
    'use strict';

    var contenedor = document.getElementById('propiedades-destacadas');
    if (!contenedor) return;

    var anterior = document.getElementById('destacadas-anterior');
    var siguiente = document.getElementById('destacadas-siguiente');
    var indicador = document.getElementById('destacadas-indicador');
    var API = window.UMBRAL_API;
    var indice = 0;
    var temporizador = null;
    var propiedades = [];

    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function dinero(valor, operacion) {
        var texto = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(valor || 0));
        return operacion === 'arriendo' ? texto + ' / mes' : texto;
    }

    function urlImagen(ruta) {
        if (!ruta) return '';
        if (/^https?:\/\//i.test(ruta)) return ruta;
        try { return new URL(ruta, new URL(API, window.location.href).origin).href; }
        catch (_) { return ruta; }
    }

    function tarjeta(p) {
        var imagen = urlImagen(p.img || (p.photos && p.photos[0]) || '');
        var lugar = [p.city, p.dept].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(' · ');
        var tipo = String(p.type || 'Propiedad').replace(/_/g, ' ');
        var op = p.op === 'arriendo' ? 'Arriendo' : 'Venta';
        return '<article class="destacada-card">' +
            '<div class="destacada-imagen">' +
                (imagen ? '<img src="' + escapar(imagen) + '" alt="' + escapar(tipo + ' en ' + (lugar || 'Colombia')) + '" loading="lazy">' : '<div class="destacada-sin-imagen">UMBRAL</div>') +
                '<span class="destacada-oro">✦ Membresía Oro</span>' +
            '</div>' +
            '<div class="destacada-cuerpo">' +
                '<span class="destacada-operacion">' + op + '</span>' +
                '<h3>' + escapar(tipo.charAt(0).toUpperCase() + tipo.slice(1)) + (p.barrio ? ' en ' + escapar(p.barrio) : '') + '</h3>' +
                '<p class="destacada-lugar">⌖ ' + escapar(lugar || 'Colombia') + '</p>' +
                '<div class="destacada-detalles">' +
                    (p.beds ? '<span>' + escapar(p.beds) + ' hab.</span>' : '') +
                    (p.baths ? '<span>' + escapar(p.baths) + ' baños</span>' : '') +
                    (p.area ? '<span>' + escapar(p.area) + ' m²</span>' : '') +
                '</div>' +
                '<div class="destacada-pie"><strong>' + escapar(dinero(p.price, p.op)) + '</strong><a href="#contacto" class="destacada-ver">Consultar <span aria-hidden="true">↗</span></a></div>' +
            '</div>' +
        '</article>';
    }

    function actualizarTarjetaActiva() {
        var tarjetas = Array.prototype.slice.call(contenedor.querySelectorAll('.destacada-card'));
        if (!tarjetas.length) return;
        var centro = contenedor.getBoundingClientRect().left + contenedor.clientWidth / 2;
        var mejor = null;
        var distancia = Infinity;
        tarjetas.forEach(function (tarjeta) {
            tarjeta.classList.remove('is-active', 'is-prev', 'is-next');
            var rect = tarjeta.getBoundingClientRect();
            var d = Math.abs((rect.left + rect.width / 2) - centro);
            if (d < distancia) { distancia = d; mejor = tarjeta; }
        });
        if (mejor) {
            mejor.classList.add('is-active');
            if (mejor.previousElementSibling && mejor.previousElementSibling.classList.contains('destacada-card')) mejor.previousElementSibling.classList.add('is-prev');
            if (mejor.nextElementSibling && mejor.nextElementSibling.classList.contains('destacada-card')) mejor.nextElementSibling.classList.add('is-next');
        }
    }

    function actualizarControles() {
        actualizarTarjetaActiva();
        var max = Math.max(0, contenedor.scrollWidth - contenedor.clientWidth);
        if (anterior) anterior.disabled = max < 4 || contenedor.scrollLeft < 4;
        if (siguiente) siguiente.disabled = max < 4 || contenedor.scrollLeft >= max - 4;
        if (indicador) indicador.textContent = propiedades.length ? (propiedades.length + ' propiedades Oro') : 'Propiedades Oro';
    }

    function mover(direccion) {
        var tarjetaEl = contenedor.querySelector('.destacada-card');
        if (!tarjetaEl) return;
        var distancia = tarjetaEl.getBoundingClientRect().width + 24;
        contenedor.scrollBy({ left: direccion * distancia, behavior: 'smooth' });
        window.setTimeout(actualizarControles, 350);
    }

    function iniciarAutoavance() {
        detenerAutoavance();
        if (propiedades.length < 2) return;
        temporizador = window.setInterval(function () {
            var max = contenedor.scrollWidth - contenedor.clientWidth;
            if (contenedor.scrollLeft >= max - 5) contenedor.scrollTo({ left: 0, behavior: 'smooth' });
            else mover(1);
        }, 6500);
    }

    function detenerAutoavance() {
        if (temporizador) window.clearInterval(temporizador);
        temporizador = null;
    }

    if (anterior) anterior.addEventListener('click', function () { detenerAutoavance(); mover(-1); iniciarAutoavance(); });
    if (siguiente) siguiente.addEventListener('click', function () { detenerAutoavance(); mover(1); iniciarAutoavance(); });
    contenedor.addEventListener('scroll', actualizarControles, { passive: true });
    contenedor.addEventListener('mouseenter', detenerAutoavance);
    contenedor.addEventListener('mouseleave', iniciarAutoavance);
    contenedor.addEventListener('focusin', detenerAutoavance);
    contenedor.addEventListener('focusout', iniciarAutoavance);
    window.addEventListener('resize', actualizarControles);
    document.addEventListener('visibilitychange', function () { document.hidden ? detenerAutoavance() : iniciarAutoavance(); });

    async function cargar() {
        if (!API) {
            contenedor.innerHTML = '<p class="destacadas-aviso">No se encontró la configuración de la API.</p>';
            return;
        }
        try {
            var respuesta = await fetch(API.replace(/\/$/, '') + '/public/propiedades?per_page=100', { headers: { Accept: 'application/json' } });
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            var json = await respuesta.json();
            var lista = Array.isArray(json.data) ? json.data : [];
            propiedades = lista.filter(function (p) {
                return String(p.tier || '').toLowerCase() === 'oro' && p.prem === true;
            });
            if (!propiedades.length) {
                contenedor.innerHTML = '<p class="destacadas-aviso">En este momento no hay propiedades Oro publicadas. Aquí aparecerán automáticamente cuando estén disponibles.</p>';
                if (anterior) anterior.hidden = true;
                if (siguiente) siguiente.hidden = true;
                if (indicador) indicador.textContent = 'Sin propiedades Oro disponibles';
                return;
            }
            contenedor.innerHTML = propiedades.map(tarjeta).join('');
            actualizarTarjetaActiva();
            if (propiedades.length < 2) {
                if (anterior) anterior.hidden = true;
                if (siguiente) siguiente.hidden = true;
            }
            actualizarControles();
            iniciarAutoavance();
        } catch (error) {
            console.error('No se pudieron cargar las propiedades Oro:', error);
            contenedor.innerHTML = '<p class="destacadas-aviso">No pudimos cargar las propiedades destacadas. Intenta actualizar la página en un momento.</p>';
            if (anterior) anterior.hidden = true;
            if (siguiente) siguiente.hidden = true;
        }
    }

    cargar();
})();
