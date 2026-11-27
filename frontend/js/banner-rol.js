/* =========================================================
   UMBRAL — Banner de inicio de los paneles (agente, vendedor y administrador)
   Dibuja el cielo, la escena de cada rol y las tarjetas de hoy.
   Los estilos base son los de /inmobiliaria/css/banner-inmobiliaria.css
   y los de cada escena están en /css/banner-escenas.css
   ========================================================= */
(function () {
    'use strict';

    var calma = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var temporizador = null;

    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function idioma() {
        try { return localStorage.getItem('umbral_lang') === 'en' || !!window.UmbralIdioma ? 'en' : 'es'; } catch (e) { return 'es'; }
    }

    function saludo(T) {
        var h = new Date().getHours();
        return h < 12 ? [T.dia, 'fa-sun'] : (h < 19 ? [T.tarde, 'fa-cloud-sun'] : [T.noche, 'fa-moon']);
    }

    /* Número pseudo-aleatorio repetible: la escena se ve igual en cada visita */
    function generador() {
        var semilla = 11;
        return function () { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; };
    }

    /* ---------- Cielo: sol o luna, estrellas y nubes ---------- */
    function cielo(azar) {
        var h = '<div class="ib-astro"></div>', i;
        for (i = 0; i < 22; i++) {
            h += '<span class="ib-estrella" style="left:' + Math.round(azar() * 96) + '%;top:' + Math.round(azar() * 42 + 3) + '%;animation-delay:' + (azar() * 3).toFixed(2) + 's"></span>';
        }
        [[10, 34, 38], [48, 22, 52], [30, 62, 46]].forEach(function (n) {
            h += '<span class="ib-nube" style="top:' + n[0] + '%;width:' + (n[1] + 50) + 'px;animation-duration:' + (n[2] + 20) + 's;animation-delay:-' + n[1] + 's"></span>';
        });
        return h;
    }

    /* ---------- Escenas ---------- */
    function ventanas(cols, filas, azar) {
        var v = '';
        for (var n = 0; n < cols * filas; n++) v += '<i class="ib-v' + (azar() < 0.45 ? ' on' : '') + '"></i>';
        return v;
    }

    var PIN = '<path d="M0 0 C-7 -9 -9 -16 -9 -19 a9 9 0 1 1 18 0 c0 3 -2 10 -9 19z" fill="#f5c542"/><circle cy="-19" r="3.5" fill="#2e1065"/>';

    var ESCENAS = {
        /* Agente: una persona de traje con maletín que entrega una llave; mapa con ruta, celular con aviso y calendario */
        agente: function (T) {
            var dia = new Date().getDate();
            var persona =
                '<svg viewBox="0 0 160 290" aria-hidden="true"><g class="ie-cuerpo">' +
                    '<rect x="58" y="184" width="19" height="86" rx="4" fill="#1c0c36"/><rect x="83" y="184" width="19" height="86" rx="4" fill="#1c0c36"/>' +
                    '<ellipse cx="66" cy="274" rx="16" ry="6" fill="#f5c542"/><ellipse cx="94" cy="274" rx="16" ry="6" fill="#f5c542"/>' +
                    '<path d="M46 98 Q46 84 62 82 L98 82 Q114 84 114 98 L118 196 L42 196 Z" fill="#7c3aed"/>' +
                    '<path d="M62 82 L74 82 L80 128 L56 102 Z" fill="#5b21b6"/><path d="M98 82 L86 82 L80 128 L104 102 Z" fill="#5b21b6"/>' +
                    '<path d="M70 82 L90 82 L80 126 Z" fill="#fff"/><path d="M77 88 L83 88 L86 128 L80 140 L74 128 Z" fill="#f5c542"/>' +
                    '<rect x="72" y="68" width="16" height="16" rx="4" fill="#f3c9a0"/>' +
                    '<circle cx="80" cy="48" r="24" fill="#f3c9a0"/>' +
                    '<path d="M55 48 Q54 21 80 21 Q106 21 105 48 Q97 33 80 33 Q63 33 55 48 Z" fill="#2e1065"/>' +
                    '<g class="ie-ojos"><circle cx="71" cy="50" r="2.8" fill="#2e1065"/><circle cx="89" cy="50" r="2.8" fill="#2e1065"/></g>' +
                    '<path d="M71 60 Q80 68 89 60" stroke="#2e1065" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
                    /* brazo izquierdo con el maletín */
                    '<path d="M48 100 L36 152" stroke="#7c3aed" stroke-width="15" stroke-linecap="round" fill="none"/><circle cx="35" cy="158" r="7.5" fill="#f3c9a0"/>' +
                    '<path d="M24 164 v-7 h22 v7" stroke="#b45309" stroke-width="3" fill="none"/><rect x="14" y="164" width="44" height="34" rx="6" fill="#f5c542"/>' +
                    '<rect x="32" y="176" width="8" height="6" rx="1.5" fill="#b45309"/>' +
                    /* brazo derecho que entrega la llave */
                    '<g class="ie-brazo"><path d="M110 100 L134 134 L146 108" stroke="#7c3aed" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
                    '<circle cx="146" cy="104" r="7.5" fill="#f3c9a0"/>' +
                    '<g class="ie-llave2"><circle cx="146" cy="82" r="9" stroke="#f5c542" stroke-width="3.5" fill="none"/><rect x="144.3" y="91" width="3.4" height="20" rx="1.5" fill="#f5c542"/><rect x="147" y="100" width="7" height="3" fill="#f5c542"/><rect x="147" y="106" width="5" height="3" fill="#f5c542"/></g></g>' +
                '</g></svg>';
            var mapa =
                '<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
                    '<path class="ie-calle-mapa" d="M0 30 H200 M0 82 H200 M45 0 V120 M122 0 V120 M172 0 V120"/>' +
                    '<path class="ie-calle-mapa" style="stroke-width:8" d="M0 108 Q60 72 112 80 T200 42"/>' +
                    '<path class="ie-ruta" d="M24 98 C52 92 62 54 100 58 S160 42 178 24"/>' +
                    '<g transform="translate(24 98)"><g class="ie-chincheta">' + PIN + '</g></g>' +
                    '<g transform="translate(100 58)"><g class="ie-chincheta c2">' + PIN + '</g></g>' +
                    '<g transform="translate(178 24)"><g class="ie-chincheta c3">' + PIN + '</g></g>' +
                '</svg>';
            return '<div class="ib-ciudad">' +
                '<div class="ie-mapa">' + mapa + '</div>' +
                '<div class="ie-agente">' + persona + '</div>' +
                '<div class="ie-burbuja"><i class="fa-solid fa-circle-check"></i>' + esc(T.confirmada || '') + '</div>' +
                '<div class="ie-movil"><span class="ie-ring"></span><span class="ie-ring r2"></span><div class="pant"><i></i><i></i><i></i><i></i></div><div class="ie-aviso">' + esc(T.nueva || '') + '</div></div>' +
                '<div class="ie-cal"><span>' + esc(T.visita) + '</span><b>' + dia + '</b><em><i class="fa-solid fa-check"></i></em></div>' +
                '</div>';
        },
        /* Vendedor: casa pequeña con jardín (árboles, arbustos, cerca y farol), apartamento y letrero «Se vende» */
        vendedor: function (T, azar) {
            var arbol = function (clase, izq) {
                return '<div class="iv-arbol ' + clase + '" style="left:' + izq + '%"><span class="tronco"></span><span class="copa c1"></span><span class="copa c2"></span><span class="copa c3"></span></div>';
            };
            var arbusto = function (clase, izq, retraso) { return '<span class="iv-arbusto ' + clase + '" style="left:' + izq + '%;animation-delay:-' + retraso + 's"></span>'; };
            return '<div class="ib-ciudad">' +
                arbol('grande', 2) + arbol('pino pequeno', 9) +
                '<div class="iv-casa">' +
                    '<span class="iv-chimenea"><i class="iv-humo"></i><i class="iv-humo"></i><i class="iv-humo"></i></span>' +
                    '<div class="iv-techo"></div>' +
                    '<i class="iv-vent izq ib-v on"></i><i class="iv-vent der ib-v on"></i>' +
                    '<div class="iv-puerta"></div>' +
                '</div>' +
                '<span class="iv-cerca" style="left:15%;width:32%"></span>' +
                arbusto('ancho', 13, 1) + arbusto('', 25, 2) + arbusto('', 38, 3) +
                arbol('pino', 46) + '<span class="iv-farol" style="left:54%"></span>' +
                '<div class="ib-letrero" style="left:58%"><span>' + esc(T.vende) + '</span></div>' +
                arbusto('', 68, 1.5) +
                '<div class="ib-edificio iv-apto" style="left:72%;width:26%;height:calc((100% - 34px) * 0.6);grid-template-columns:repeat(4,1fr);animation-delay:.5s">' +
                    ventanas(4, 9, azar) + '<span class="ib-antena"></span></div>' +
                arbusto('ancho', 84, 2.5) +
                '<div class="iv-moneda" style="left:40%"><b>$</b></div>' +
                '</div>';
        },
        /* Administrador: centro de mando con gráficas que se dibujan, engranajes, candado, escudo y fichas verificadas */
        admin: function () {
            var linea =
                '<svg viewBox="0 0 180 90" preserveAspectRatio="none" aria-hidden="true">' +
                    '<path class="ia-rejilla" d="M0 22 H180 M0 45 H180 M0 68 H180"/>' +
                    '<path class="ia-area" d="M6 70 L38 56 L70 62 L100 36 L132 44 L174 14 L174 90 L6 90 Z"/>' +
                    '<path class="ia-linea" d="M6 70 L38 56 L70 62 L100 36 L132 44 L174 14"/>' +
                    '<circle class="ia-punto-g" cx="100" cy="36" r="3.5"/><circle class="ia-punto-g" cx="174" cy="14" r="3.5"/>' +
                '</svg>';
            var dona = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle class="ia-dona-fondo" cx="30" cy="30" r="22"/><circle class="ia-dona" cx="30" cy="30" r="22"/></svg>';
            var barras = '<svg viewBox="0 0 60 40" preserveAspectRatio="none" aria-hidden="true"><rect class="ia-barra" x="4" y="6" width="9" height="34" rx="2"/><rect class="ia-barra" x="18" y="14" width="9" height="26" rx="2"/><rect class="ia-barra" x="32" y="2" width="9" height="38" rx="2"/><rect class="ia-barra" x="46" y="18" width="9" height="22" rx="2"/></svg>';
            var ficha = function (n) {
                return '<div class="ia-ficha f' + n + '"><span class="foto"></span><span class="lineas"><i></i><i></i><i></i></span><em><i class="fa-solid fa-check"></i></em></div>';
            };
            return '<div class="ib-ciudad">' +
                '<div class="ia-panel"><div class="barra"><i></i><i></i><i></i></div><div class="cuerpo">' + linea + '<div class="der">' + dona + barras + '</div></div></div>' +
                '<div class="ia-escudo"><i class="fa-solid fa-check" aria-hidden="true"></i></div>' +
                '<i class="fa-solid fa-gear ia-engranaje g1" aria-hidden="true"></i><i class="fa-solid fa-gear ia-engranaje g2" aria-hidden="true"></i>' +
                '<div class="ia-candado"></div>' + ficha(1) + ficha(2) + ficha(3) +
                '</div>';
        }
    };

    /* Las ventanas se encienden y se apagan solas */
    function luces(banner) {
        if (calma) return;
        if (temporizador) clearInterval(temporizador);
        var v = banner.querySelectorAll('.ib-escena .ib-v');
        if (!v.length) return;
        temporizador = setInterval(function () {
            if (document.hidden || !document.body.contains(banner)) return;
            for (var n = 0; n < 3; n++) {
                var x = v[Math.floor(Math.random() * v.length)];
                if (x) x.classList.toggle('on');
            }
        }, 650);
    }

    /* Las cifras suben desde cero (opciones: pre = prefijo, compacto = 1,2 M) */
    function formato(n, o) {
        o = o || {};
        if (o.compacto && n >= 1000000) return (o.pre || '') + (n / 1000000).toFixed(1).replace('.', ',') + ' M';
        return (o.pre || '') + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    function contar(el, meta, o) {
        if (calma || meta === 0) { el.textContent = formato(meta, o); return; }
        var ini = performance.now(), dur = 1100;
        (function paso(t) {
            var p = Math.min(1, (t - ini) / dur);
            el.textContent = formato(meta * (1 - Math.pow(1 - p, 3)), o);
            if (p < 1) requestAnimationFrame(paso);
        })(ini);
    }
    function contarTodo(banner) {
        banner.querySelectorAll('b[data-meta]').forEach(function (b) {
            contar(b, Number(b.getAttribute('data-meta')), { pre: b.getAttribute('data-pre') || '', compacto: b.hasAttribute('data-compacto') });
        });
    }

    /* Solo la escena (la usa el administrador, que ya trae su texto en el HTML) */
    function escena(banner, rol, T) {
        var azar = generador();
        var cont = document.createElement('div');
        cont.className = 'ib-escena';
        cont.setAttribute('aria-hidden', 'true');
        cont.innerHTML = cielo(azar) + ESCENAS[rol](T, azar) + '<div class="ib-calle"></div><span class="ib-carro"></span><span class="ib-carro oro"></span>';
        banner.insertBefore(cont, banner.firstChild);
        luces(banner);
    }

    /* Banner completo: escena + saludo + cifras + datos extra + accesos */
    function montar(cfg) {
        var T = cfg.T;
        var s = saludo(T);
        var banner = cfg.banner;
        banner.innerHTML =
            '<div class="ib-texto">' +
                '<span class="ib-saludo"><i class="fa-solid ' + s[1] + '" aria-hidden="true"></i>' + esc(s[0]) + '</span>' +
                '<h1>' + esc(cfg.nombre) + '</h1>' +
                '<p class="ib-frase">' + esc(cfg.frase) + '</p>' +
                '<div class="ib-cifras">' + cfg.cifras.map(function (c) {
                    return '<div class="ib-cifra"><i class="fa-solid ' + c[0] + '" aria-hidden="true"></i><div><b data-meta="' + Number(c[1] || 0) + '">0</b><span>' + esc(c[2]) + '</span></div></div>';
                }).join('') + '</div>' +
                '<div class="ib-pildoras">' + cfg.pildoras.map(function (p) {
                    return '<span><b>' + esc(p[0]) + '</b>' + esc(p[1]) + '</span>';
                }).join('') + '</div>' +
                '<div class="ib-accesos">' + cfg.accesos.map(function (a) {
                    return '<a href="' + a[0] + '"><i class="fa-solid ' + a[1] + '" aria-hidden="true"></i>' + esc(a[2]) + '</a>';
                }).join('') + '</div>' +
            '</div>';
        escena(banner, cfg.escena, T);
        contarTodo(banner);
    }

    /* Tarjetas de hoy debajo del banner */
    function tarjetas(grid, lista) {
        grid.innerHTML = lista.map(function (t, i) {
            return '<article class="v-tarjeta ib-card" style="animation-delay:' + (0.5 + i * 0.12).toFixed(2) + 's">' +
                '<div class="ib-card-cab"><i class="fa-solid ' + t.icono + '" aria-hidden="true"></i>' + esc(t.titulo) + '</div>' +
                '<b class="principal">' + esc(t.principal) + '</b>' +
                (t.detalle ? '<p>' + esc(t.detalle) + '</p>' : '') +
                (t.pie ? '<small>' + esc(t.pie) + '</small>' : '') +
                '<a class="mas" href="' + t.enlace + '">' + esc(t.textoEnlace) + '</a></article>';
        }).join('');
    }

    function corto(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; }

    window.BannerRol = { montar: montar, escena: escena, tarjetas: tarjetas, contar: contar, idioma: idioma, corto: corto, esc: esc };
})();
