/* ============================================================
   UMBRAL — Selector de idioma con banderas
   Lo usan el Inicio, el Invitado y los paneles (inmobiliaria, agente, vendedor y administrador).
   Cada idioma muestra: bandera del país, nombre en su propio idioma y, debajo,
   el nombre del idioma en el idioma que se está usando (Intl.DisplayNames).

   Uso:
     SelectorIdioma.montar(contenedor, { idiomas:['es','en'], actual:'es', alElegir:function(c){} });
     SelectorIdioma.html({...}) + SelectorIdioma.activar(contenedor)   (cuando el HTML se arma como texto)
     SelectorIdioma.actualizar(contenedor, 'en')                       (si el idioma cambia sin recargar)

   El menú se abre fuera de la barra (en <body>) y se acomoda dentro de la pantalla,
   así no se corta ni en árabe (derecha a izquierda) ni en pantallas pequeñas.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Banderas dibujadas en SVG (proporción 3:2) ---------- */
    function estrella(cx, cy, r, giro) {
        var p = [];
        for (var i = 0; i < 10; i++) {
            var radio = i % 2 === 0 ? r : r * 0.382;
            var a = (Math.PI / 5) * i - Math.PI / 2 + (giro || 0);
            p.push((cx + radio * Math.cos(a)).toFixed(2) + ',' + (cy + radio * Math.sin(a)).toFixed(2));
        }
        return '<polygon points="' + p.join(' ') + '" fill="#FFDE00"/>';
    }
    function tres(a, b, c, vertical) {
        return vertical
            ? '<rect width="10" height="20" fill="' + a + '"/><rect x="10" width="10" height="20" fill="' + b + '"/><rect x="20" width="10" height="20" fill="' + c + '"/>'
            : '<rect width="30" height="7" fill="' + a + '"/><rect y="6.6" width="30" height="6.8" fill="' + b + '"/><rect y="13.2" width="30" height="6.8" fill="' + c + '"/>';
    }
    function trigrama(x, y, giro) {
        return '<g transform="translate(' + x + ' ' + y + ') rotate(' + giro + ')" stroke="#111" stroke-width=".85"><path d="M-2.6 -1.5h5.2M-2.6 0h5.2M-2.6 1.5h5.2"/></g>';
    }
    var DIBUJOS = {
        /* España/Latinoamérica: Colombia, el país de Umbral */
        es: '<rect width="30" height="10" fill="#FCD116"/><rect y="10" width="30" height="5" fill="#003893"/><rect y="15" width="30" height="5" fill="#CE1126"/>',
        en: '<rect width="30" height="20" fill="#012169"/><path d="M0 0 30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" stroke-width="1.5"/><path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6.4"/><path d="M15 0V20M0 10H30" stroke="#C8102E" stroke-width="3.6"/>',
        fr: tres('#0055A4', '#FFFFFF', '#EF4135', true),
        pt: '<rect width="30" height="20" fill="#009C3B"/><path d="M15 2.4 27.4 10 15 17.6 2.6 10Z" fill="#FFDF00"/><circle cx="15" cy="10" r="4.4" fill="#002776"/><path d="M10.8 9.1Q15 7.7 19.4 11" stroke="#fff" stroke-width="1" fill="none"/>',
        ar: '<rect width="30" height="20" fill="#006C35"/><path d="M7.5 7.4h15M9 9.4h12" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M8 14.2h14" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/><path d="M20.5 12.9v2.6" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>',
        de: tres('#111111', '#DD0000', '#FFCE00', false),
        it: tres('#009246', '#FFFFFF', '#CE2B37', true),
        zh: '<rect width="30" height="20" fill="#DE2910"/>' + estrella(6, 6, 3.4, 0) + estrella(11.6, 2.6, 1.1, 0.4) + estrella(13.4, 5, 1.1, 0.1) + estrella(13.4, 8, 1.1, -0.2) + estrella(11.6, 10.4, 1.1, 0.1),
        ja: '<rect width="30" height="20" fill="#FFFFFF"/><circle cx="15" cy="10" r="6" fill="#BC002D"/>',
        ko: '<rect width="30" height="20" fill="#FFFFFF"/><path d="M10 10A5 5 0 0 1 20 10A2.5 2.5 0 0 1 15 10A2.5 2.5 0 0 0 10 10Z" fill="#CD2E3A"/><path d="M20 10A5 5 0 0 1 10 10A2.5 2.5 0 0 1 15 10A2.5 2.5 0 0 0 20 10Z" fill="#0047A0"/>' +
            trigrama(5.2, 4.4, -35) + trigrama(24.8, 4.4, 35) + trigrama(5.2, 15.6, 35) + trigrama(24.8, 15.6, -35),
        ru: tres('#FFFFFF', '#0039A6', '#D52B1E', false),
        hi: tres('#FF9933', '#FFFFFF', '#138808', false) + '<circle cx="15" cy="10" r="2.3" fill="none" stroke="#000080" stroke-width=".55"/><path d="M15 7.7V12.3M12.7 10H17.3M13.4 8.4 16.6 11.6M16.6 8.4 13.4 11.6" stroke="#000080" stroke-width=".4"/>'
    };
    function bandera(c) {
        return '<svg viewBox="0 0 30 20" aria-hidden="true" focusable="false">' + (DIBUJOS[c] || DIBUJOS.es) + '</svg>';
    }

    var NATIVOS = {
        es: 'Español', en: 'English', ar: 'العربية', fr: 'Français', pt: 'Português', de: 'Deutsch',
        it: 'Italiano', zh: '中文', ja: '日本語', ko: '한국어', ru: 'Русский', hi: 'हिन्दी'
    };
    /* Por si el navegador no trae Intl.DisplayNames */
    var RESPALDO = {
        es: { es: 'Español', en: 'Inglés', ar: 'Árabe', fr: 'Francés', pt: 'Portugués', de: 'Alemán', it: 'Italiano', zh: 'Chino', ja: 'Japonés', ko: 'Coreano', ru: 'Ruso', hi: 'Hindi' },
        en: { es: 'Spanish', en: 'English', ar: 'Arabic', fr: 'French', pt: 'Portuguese', de: 'German', it: 'Italian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian', hi: 'Hindi' }
    };

    function nombreEn(codigo, ui) {
        try {
            var n = new Intl.DisplayNames([ui], { type: 'language' }).of(codigo);
            if (n && n !== codigo) return n.charAt(0).toLocaleUpperCase(ui) + n.slice(1);
        } catch (e) { /* sin Intl.DisplayNames */ }
        return (RESPALDO[ui] && RESPALDO[ui][codigo]) || (RESPALDO.es[codigo]) || NATIVOS[codigo] || codigo;
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    /* ---------- HTML ---------- */
    function opciones(idiomas, actual) {
        return idiomas.map(function (c) {
            var sel = c === actual;
            return '<button type="button" class="si-opcion" role="option" data-idioma="' + c + '" aria-selected="' + sel + '" aria-pressed="' + sel + '">' +
                '<span class="si-bandera">' + bandera(c) + '</span>' +
                '<span class="si-textos"><b lang="' + c + '">' + esc(NATIVOS[c] || c) + '</b><small>' + esc(nombreEn(c, actual)) + '</small></span>' +
                '<span class="si-marca" aria-hidden="true"></span></button>';
        }).join('');
    }
    function html(o) {
        var actual = o.actual || 'es';
        return '<button type="button" class="si-boton" aria-haspopup="listbox" aria-expanded="false" aria-label="' + esc(o.etiqueta || 'Idioma') + '">' +
            '<span class="si-bandera">' + bandera(actual) + '</span>' +
            '<span class="si-nombre" lang="' + actual + '">' + esc(NATIVOS[actual] || actual) + '</span>' +
            '<svg class="si-flecha" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 10 5 5 5-5"/></svg></button>' +
            '<div class="si-menu" role="listbox" aria-label="' + esc(o.etiqueta || 'Idioma') + '" hidden>' + opciones(o.idiomas, actual) + '</div>';
    }

    /* ---------- Comportamiento ---------- */
    function activar(raiz, alElegir) {
        if (!raiz || raiz._si) return;
        var boton = raiz.querySelector('.si-boton');
        var menu = raiz.querySelector('.si-menu');
        if (!boton || !menu) return;
        var abierto = false;
        raiz._si = { boton: boton, menu: menu, idiomas: [].map.call(menu.querySelectorAll('[data-idioma]'), function (b) { return b.getAttribute('data-idioma'); }) };

        function acomodar() {
            var vw = document.documentElement.clientWidth, vh = window.innerHeight;
            var r = boton.getBoundingClientRect();
            var ancho = Math.min(290, vw - 16);
            menu.style.width = ancho + 'px';
            var rtl = getComputedStyle(document.documentElement).direction === 'rtl';
            var izq = rtl ? r.left : r.right - ancho;
            izq = Math.max(8, Math.min(izq, vw - ancho - 8));
            var arriba = r.bottom + 8;
            menu.style.left = izq + 'px';
            menu.style.top = arriba + 'px';
            menu.style.maxHeight = Math.max(170, vh - arriba - 12) + 'px';
        }
        function abrir(si) {
            if (si === abierto) return;
            abierto = si;
            boton.setAttribute('aria-expanded', si ? 'true' : 'false');
            if (si) {
                document.body.appendChild(menu);
                menu.hidden = false;
                acomodar();
                window.addEventListener('resize', acomodar);
                window.addEventListener('scroll', acomodar, true);
                var sel = menu.querySelector('[aria-selected="true"]') || menu.querySelector('.si-opcion');
                if (sel) { try { sel.focus({ preventScroll: true }); sel.scrollIntoView({ block: 'nearest' }); } catch (e) { } }
            } else {
                menu.hidden = true;
                raiz.appendChild(menu);
                window.removeEventListener('resize', acomodar);
                window.removeEventListener('scroll', acomodar, true);
            }
        }

        boton.addEventListener('click', function (e) { e.stopPropagation(); abrir(!abierto); });
        menu.addEventListener('click', function (e) {
            var op = e.target.closest('[data-idioma]');
            if (!op) return;
            abrir(false);
            if (alElegir) alElegir(op.getAttribute('data-idioma'));
        });
        menu.addEventListener('keydown', function (e) {
            var ops = [].slice.call(menu.querySelectorAll('.si-opcion')), i = ops.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') { e.preventDefault(); (ops[i + 1] || ops[0]).focus(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); (ops[i - 1] || ops[ops.length - 1]).focus(); }
        });
        document.addEventListener('click', function (e) { if (abierto && !menu.contains(e.target)) abrir(false); });
        document.addEventListener('keydown', function (e) { if (abierto && e.key === 'Escape') { abrir(false); boton.focus(); } });
    }

    function montar(raiz, o) {
        if (!raiz) return;
        raiz.classList.add('si');
        if (o.compacto) raiz.classList.add('si-compacto');
        raiz.innerHTML = html(o);
        activar(raiz, o.alElegir);
    }

    /* Cambia la bandera, el nombre y las líneas de abajo cuando cambia el idioma sin recargar la página */
    function actualizar(raiz, actual) {
        if (!raiz || !raiz._si) return;
        var s = raiz._si;
        s.boton.querySelector('.si-bandera').innerHTML = bandera(actual);
        var n = s.boton.querySelector('.si-nombre');
        n.textContent = NATIVOS[actual] || actual; n.setAttribute('lang', actual);
        s.menu.innerHTML = opciones(s.idiomas, actual);
    }

    /* El CSS se carga solo: así cada página únicamente necesita este script */
    (function cargarEstilos() {
        if (document.getElementById('si-estilos')) return;
        var l = document.createElement('link');
        l.id = 'si-estilos'; l.rel = 'stylesheet'; l.href = '/css/selector-idioma.css?v=1';
        document.head.appendChild(l);
    })();

    window.SelectorIdioma = { html: html, activar: activar, montar: montar, actualizar: actualizar, bandera: bandera, nombres: NATIVOS };
})();
