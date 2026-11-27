/* ============================================================
   UMBRAL — El nombre de la marca no se traduce
   Marca con translate="no" toda aparición de "Umbral"/"UMBRAL" (y ante cambios de idioma,
   porque los textos se reescriben). Así el traductor del navegador la deja intacta
   y el resto del texto sí se puede traducir.
   ============================================================ */
(function () {
    'use strict';
    var OMITIR = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, OPTION: 1 };

    function protegido(el) { return el && el.closest && el.closest('[translate="no"], .notranslate'); }

    function marcar(nodo) {
        var texto = nodo.nodeValue;
        if (!texto || !/umbral/i.test(texto)) return;
        var padre = nodo.parentNode;
        if (!padre || padre.nodeType !== 1 || OMITIR[padre.tagName] || protegido(padre)) return;

        /* Si el elemento solo contiene el nombre (logo, título), se marca el elemento entero */
        if (padre.childNodes.length === 1 && /^\s*umbral\s*$/i.test(texto)) {
            padre.setAttribute('translate', 'no'); padre.classList.add('notranslate'); return;
        }
        var re = /umbral/gi, i = 0, m, frag = document.createDocumentFragment();
        while ((m = re.exec(texto))) {
            if (m.index > i) frag.appendChild(document.createTextNode(texto.slice(i, m.index)));
            var s = document.createElement('span');
            s.setAttribute('translate', 'no'); s.className = 'notranslate'; s.textContent = m[0];
            frag.appendChild(s); i = m.index + m[0].length;
        }
        if (i < texto.length) frag.appendChild(document.createTextNode(texto.slice(i)));
        padre.replaceChild(frag, nodo);
    }

    function recorrer(raiz) {
        if (!raiz) return;
        if (raiz.nodeType === 3) { marcar(raiz); return; }
        if (raiz.nodeType !== 1 || OMITIR[raiz.tagName]) return;
        var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), lista = [], n;
        while ((n = w.nextNode())) { if (/umbral/i.test(n.nodeValue)) lista.push(n); }
        lista.forEach(marcar);
    }

    var pendientes = [], programado = false;
    function procesar() {
        programado = false;
        var lote = pendientes; pendientes = [];
        lote.forEach(function (n) { if (n.isConnected !== false) recorrer(n); });
    }
    function iniciar() {
        recorrer(document.body);
        new MutationObserver(function (cambios) {
            cambios.forEach(function (c) {
                if (c.type === 'characterData') pendientes.push(c.target);
                else c.addedNodes.forEach(function (n) { pendientes.push(n); });
            });
            if (pendientes.length && !programado) { programado = true; requestAnimationFrame(procesar); }
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
