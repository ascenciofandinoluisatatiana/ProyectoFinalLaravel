/* Umbral — animaciones al hacer scroll, contadores, portada con parallax y tarjetas que se iluminan solas */
(function () {
    'use strict';

    var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducir || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('js-anim');

    var esTarjeta = '.tarjeta-servicio, .tarjeta-mision';
    var lista = function (nodos) { return Array.prototype.slice.call(nodos); };

    /* ---- Contador de las estadísticas (+500, 32, 100%) ---- */
    function contar(num) {
        if (!num) return;
        var final = num.getAttribute('data-final') || num.textContent.trim();
        num.setAttribute('data-final', final);
        var m = /^(\+?)(\d+)(%?)$/.exec(final);
        if (!m) return;
        var meta = parseInt(m[2], 10), t0 = null, dur = 1400;
        function paso(t) {
            if (t0 === null) t0 = t;
            var p = Math.min((t - t0) / dur, 1);
            num.textContent = m[1] + Math.round(meta * (1 - Math.pow(1 - p, 3))) + m[3];
            if (p < 1) requestAnimationFrame(paso); else num.textContent = final;
        }
        requestAnimationFrame(paso);
    }

    /* ---- Aparecer al hacer scroll (al bajar y al subir) ---- */
    var observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            var visible = e.isIntersecting;
            e.target.classList.toggle('visible', visible);
            if (visible && e.target.classList.contains('estadistica')) {
                contar(e.target.querySelector('strong'));
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    function animar(el, tipo, retraso) {
        if (!el) return;
        el.setAttribute('data-anim', tipo);
        if (retraso) el.style.setProperty('--rev-delay', retraso + 'ms');
        observador.observe(el);
    }

    /* Encabezados: etiqueta con zoom y línea, título desenfocado, textos desde abajo */
    lista(document.querySelectorAll('.seccion-cabecera')).forEach(function (cab) {
        var n = 0;
        lista(cab.children).forEach(function (h) {
            if (h.matches('.pais')) animar(h, 'zoom', 0);
            else if (h.matches('h2')) animar(h, 'blur', 120);
            else animar(h, 'abj', 120 + (++n) * 110);
        });
    });

    /* Tarjetas: cada una entra desde una dirección distinta */
    lista(document.querySelectorAll('.rejilla, .nosotros-tarjetas')).forEach(function (g) {
        var dirs = g.classList.contains('nosotros-tarjetas')
            ? ['izq', 'der']
            : ['izq', 'abj', 'arr', 'der'];
        lista(g.children).filter(function (h) { return h.matches(esTarjeta); })
            .forEach(function (t, i) { animar(t, dirs[i % dirs.length], i * 90); });
    });

    /* Estadísticas: zoom escalonado y números que cuentan */
    lista(document.querySelectorAll('.estadistica')).forEach(function (e, i) { animar(e, 'zoom', i * 110); });

    /* Descargar app: texto desde la izquierda, celular desde la derecha */
    animar(document.querySelector('.app-texto'), 'izq', 0);
    animar(document.querySelector('.app-visual'), 'der', 150);

    /* Pie de página */
    animar(document.querySelector('.pie'), 'abj', 0);

    /* ---- Portada: parallax de la foto y desvanecido del texto al hacer scroll ---- */
    var hero = document.querySelector('.hero-inicio');
    if (hero) {
        var pendiente = false;
        var actualizar = function () {
            pendiente = false;
            var y = window.scrollY, alto = hero.offsetHeight;
            if (y > alto) return;
            hero.style.setProperty('--hero-par', (y * 0.22) + 'px');
            hero.style.setProperty('--hero-ty', (-y * 0.08) + 'px');
            hero.style.setProperty('--hero-op', String(Math.max(0, 1 - (y / alto) * 1.25)));
        };
        window.addEventListener('scroll', function () {
            if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
        }, { passive: true });
        actualizar();
    }

    /* ---- Una tarjeta se ilumina sola cada pocos segundos ---- */
    var grupos = [];
    lista(document.querySelectorAll('.rejilla, .nosotros-tarjetas')).forEach(function (g) {
        var tarjetas = lista(g.children).filter(function (h) { return h.matches(esTarjeta); });
        if (tarjetas.length < 2) return;
        var grupo = { el: g, tarjetas: tarjetas, i: -1, visible: false, pausa: false };
        grupos.push(grupo);
        g.addEventListener('mouseenter', function () {
            grupo.pausa = true;
            tarjetas.forEach(function (t) { t.classList.remove('resaltada'); });
        });
        g.addEventListener('mouseleave', function () { grupo.pausa = false; });
    });

    var vigilante = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            grupos.forEach(function (g) { if (g.el === e.target) g.visible = e.isIntersecting; });
        });
    }, { threshold: 0.3 });
    grupos.forEach(function (g) { vigilante.observe(g.el); });

    grupos.forEach(function (g, n) {
        setTimeout(function () {
            setInterval(function () {
                if (!g.visible || g.pausa) return;
                g.tarjetas.forEach(function (t) { t.classList.remove('resaltada'); });
                g.i = (g.i + 1) % g.tarjetas.length;
                g.tarjetas[g.i].classList.add('resaltada');
            }, 3500);
        }, n * 900);
    });
})();