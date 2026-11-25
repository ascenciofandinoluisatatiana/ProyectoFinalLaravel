/* =========================================================
   UMBRAL — Traductor al inglés de los paneles (Inmobiliaria, Agente, Vendedor, Administrador)
   Cada panel registra su diccionario en window.UMBRAL_EN = [{ dict, conteos, reglas }] y carga
   este archivo. Aquí se traduce todo lo que se ve (textos, botones, ventanas, avisos, placeholders,
   títulos y confirmaciones), también lo que se dibuja después. Solo se usa con el botón EN.
   ========================================================= */
(function () {
    'use strict';
    if (window.UmbralIdioma) return;

    var DICT = {}, CONTEOS = {}, REGLAS = [];
    var MESES_CORTOS = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sept: 'Sep', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' };
    var MESES = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December' };
    var DIAS = { lun: 'Mon', mar: 'Tue', 'mié': 'Wed', jue: 'Thu', vie: 'Fri', 'sáb': 'Sat', dom: 'Sun' };

    function conteo(n, frase) {
        var en = CONTEOS[frase];
        if (!en) return null;
        if (n === '1') en = en.replace(/^(properties)\b/, 'property').replace(/^results$/, 'result');
        return n + ' ' + en;
    }
    function fecha(s) { return enLinea(s); }

    function lista(s) {
        return s.split(/,\s*/).map(function (x) { return DICT[x] || x; }).join(', ');
    }

    // Fechas, horas y tiempos relativos que van dentro de una frase
    function enLinea(s) {
        return s
            .replace(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})/g, function (_, d, m, a) { return MESES[m] + ' ' + d + ', ' + a; })
            .replace(/\b(\d{1,2}) de (ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\.? de (\d{4})/g, function (_, d, m, a) { return MESES_CORTOS[m] + ' ' + d + ', ' + a; })
            .replace(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/g, function (_, d, m) { return MESES[m] + ' ' + d; })
            .replace(/\b(\d{1,2}) de (ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\b\.?/g, function (_, d, m) { return MESES_CORTOS[m] + ' ' + d; })
            .replace(/(^|[\s(])(lun|mar|mié|jue|vie|sáb|dom)\.?, /g, function (_, a, d) { return a + DIAS[d] + ', '; })
            .replace(/\b(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\.? (\d{4})\b/g, function (_, d, m, y) { return MESES_CORTOS[m] + ' ' + d + ', ' + y; })
            .replace(/\b(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)\.?(?=$|\s|·|,)/g, function (_, d, m) { return MESES_CORTOS[m] + ' ' + d; })
            .replace(/(^|[\s(])(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b,? ?/gi, function (_, a, d) {
                return a + { lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', jueves: 'Thursday', viernes: 'Friday', 'sábado': 'Saturday', domingo: 'Sunday' }[d.toLowerCase()] + ', ';
            })
            .replace(/\bhace (\d+) (segundos?|minutos?|horas?|semanas?|meses|mes|años?)\b/g, function (_, n, u) {
                var en = { segundo: 'second', minuto: 'minute', hora: 'hour', semana: 'week', mes: 'month', 'año': 'year' }[u.replace(/es$|s$/, '')] || u;
                return n + ' ' + en + (n === '1' ? '' : 's') + ' ago';
            })
            .replace(/\s?a\.\s?m\./g, ' AM').replace(/\s?p\.\s?m\./g, ' PM')
            .replace(/\bhace (\d+) min\b/g, '$1 min ago').replace(/\bhace (\d+) h\b/g, '$1 h ago')
            .replace(/\bhace 1 día\b/g, '1 day ago').replace(/\bhace (\d+) días\b/g, '$1 days ago')
            .replace(/(^|\s)ayer(?=$|\s|·)/g, '$1yesterday').replace(/\bjusto ahora\b/g, 'just now')
            .replace(/\b(\d+) visitas\b/g, '$1 visits').replace(/\b1 visita\b/g, '1 visit')
            .replace(/(^|\s)(\d+) días(?=$|\s|\))/g, '$1$2 days').replace(/(^|\s)1 día(?=$|\s|\))/g, '$11 day');
    }

    function unSegmento(s) {
        if (!s) return s;
        if (DICT.hasOwnProperty(s)) return DICT[s];
        for (var i = 0; i < REGLAS.length; i++) {
            var m = s.match(REGLAS[i][0]);
            if (m) { var r = REGLAS[i][1](m); if (r) return r; }
        }
        return s;
    }

    // Traduce un texto completo: primero entero; si no, por partes separadas con "·"
    function traducirTexto(texto) {
        if (texto == null) return texto;
        var s = String(texto);
        if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ¿]{2}|[ap]\.\s?m\./.test(s)) return s;
        var ini = s.match(/^\s*/)[0], fin = s.match(/\s*$/)[0];
        var cuerpo = s.trim().replace(/\s+/g, ' ');
        var r = unSegmento(cuerpo);
        if (r === cuerpo && cuerpo.indexOf('·') !== -1) {
            r = cuerpo.split(/(\s*·\s*)/).map(function (p) { return /·/.test(p) ? p : unSegmento(p.trim()); }).join('');
        }
        r = enLinea(r);
        return r === cuerpo ? s : ini + r + fin;
    }

    /* ---------- Aplicar a la página ---------- */
    var ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];
    var hecho = new WeakMap();

    function traducirNodo(n) {
        if (n.nodeType === 3) {
            var p = n.parentNode;
            if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'TEXTAREA') return;
            if (hecho.get(n) === n.nodeValue) return;
            var nuevo = traducirTexto(n.nodeValue);
            if (nuevo !== n.nodeValue) n.nodeValue = nuevo;
            hecho.set(n, n.nodeValue);
            return;
        }
        if (n.nodeType !== 1 || n.nodeName === 'SCRIPT' || n.nodeName === 'STYLE') return;
        ATRIBUTOS.forEach(function (a) {
            var v = n.getAttribute(a);
            if (v) { var t = traducirTexto(v); if (t !== v) n.setAttribute(a, t); }
        });
        if (n.nodeName === 'INPUT' && (n.type === 'button' || n.type === 'submit') && n.value) n.value = traducirTexto(n.value);
        for (var c = n.firstChild; c; c = c.nextSibling) traducirNodo(c);
    }

    function iniciar() {
        traducirNodo(document.body);
        document.title = traducirTexto(document.title);
        new MutationObserver(function (cambios) {
            cambios.forEach(function (c) {
                if (c.type === 'characterData') traducirNodo(c.target);
                else if (c.type === 'attributes') {
                    var v = c.target.getAttribute(c.attributeName);
                    if (v) { var t = traducirTexto(v); if (t !== v) c.target.setAttribute(c.attributeName, t); }
                } else c.addedNodes.forEach(traducirNodo);
            });
        }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
        new MutationObserver(function () {
            var t = traducirTexto(document.title);
            if (t !== document.title) document.title = t;
        }).observe(document.querySelector('title') || document.head, { childList: true, characterData: true, subtree: true });
        document.documentElement.classList.remove('i-traduciendo');
        if (window.UMBRAL_EN_AVISAR) window.UMBRAL_EN_AVISAR();
    }

    // confirm y alert también en inglés
    var confirmar = window.confirm, avisar = window.alert;
    window.confirm = function (t) { return confirmar.call(window, traducirTexto(t)); };
    window.alert = function (t) { return avisar.call(window, traducirTexto(t)); };

    // Diccionarios de los paneles + reglas comunes (números, páginas)
    var COMUNES = [
        [/^(\d+) (.+)$/, function (m) { return conteo(m[1], m[2]); }],
        [/^Mostrando (\d+)[–-](\d+) de (\d+)$/, function (m) { return 'Showing ' + m[1] + '–' + m[2] + ' of ' + m[3]; }],
        [/^\((\d+) de (\d+)\)$/, function (m) { return '(' + m[1] + ' of ' + m[2] + ')'; }],
        [/^Página (\d+)$/, function (m) { return 'Page ' + m[1]; }],
        [/^hace (\d+) (min|h|días?)$/, function (m) { return m[1] + ' ' + (m[2].indexOf('d') === 0 ? (m[1] === '1' ? 'day' : 'days') : m[2]) + ' ago'; }]
    ];
    var ayudas = { t: traducirTexto, fecha: fecha, lista: lista, conteo: conteo };
    (window.UMBRAL_EN || []).forEach(function (d) {
        Object.keys(d.dict || {}).forEach(function (k) { DICT[k] = d.dict[k]; });
        Object.keys(d.conteos || {}).forEach(function (k) { CONTEOS[k] = d.conteos[k]; });
        if (d.reglas) REGLAS = REGLAS.concat(d.reglas(ayudas));
    });
    REGLAS = REGLAS.concat(COMUNES);

    window.UmbralIdioma = { activo: true, t: traducirTexto };

    if (document.body) iniciar();
    else document.addEventListener('DOMContentLoaded', iniciar);
})();
