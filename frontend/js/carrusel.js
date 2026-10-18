/* =========================================================
   UMBRAL — Carrusel de fotos (lo usan el formulario del vendedor
   y el detalle público del inmueble).

   Carrusel.montar(elemento, ['/storage/a.jpg', '/storage/b.jpg'], {
       inicio: 0,              // foto con la que empieza
       miniaturas: true,       // tira de fotos pequeñas debajo
       alCambiar: function (i) {}   // se llama cada vez que cambia la foto
   })
   → devuelve { ir(i), indice() }

   Se maneja con: flechas de pantalla, flechas del teclado y deslizando el dedo.
   ========================================================= */
(function () {
    'use strict';

    function crear(etiqueta, clase, atributos) {
        var el = document.createElement(etiqueta);
        if (clase) el.className = clase;
        Object.keys(atributos || {}).forEach(function (k) { el.setAttribute(k, atributos[k]); });
        return el;
    }

    function boton(clase, etiqueta, icono) {
        var b = crear('button', 'car-btn ' + clase, { type: 'button', 'aria-label': etiqueta });
        b.innerHTML = '<i class="fa-solid ' + icono + '" aria-hidden="true"></i>';
        return b;
    }

    function montar(el, fotos, opciones) {
        opciones = opciones || {};
        var urls = (fotos || []).filter(Boolean);
        var actual = Math.min(Math.max(Number(opciones.inicio) || 0, 0), Math.max(urls.length - 1, 0));

        el.innerHTML = '';
        el.classList.add('car');
        el.onkeydown = null;

        if (!urls.length) return { ir: function () {}, indice: function () { return 0; } };

        var varias = urls.length > 1;
        var vista = crear('div', 'car-vista');
        var img = crear('img', 'car-img', { alt: '' });
        var cuenta = crear('span', 'car-cuenta', { 'aria-live': 'polite' });
        vista.appendChild(img);
        vista.appendChild(cuenta);

        var anterior = null, siguiente = null;
        if (varias) {
            anterior = boton('car-prev', 'Foto anterior', 'fa-chevron-left');
            siguiente = boton('car-next', 'Foto siguiente', 'fa-chevron-right');
            vista.appendChild(anterior);
            vista.appendChild(siguiente);
        }
        el.appendChild(vista);

        // Si una foto no carga, se avisa en vez de dejar un hueco vacío
        img.onerror = function () { vista.classList.add('car-error'); };
        img.onload = function () { vista.classList.remove('car-error'); };

        var minis = [];
        if (varias && opciones.miniaturas !== false) {
            var tira = crear('div', 'car-minis');
            urls.forEach(function (u, i) {
                var m = crear('button', 'car-mini', { type: 'button', 'aria-label': 'Ver foto ' + (i + 1) });
                m.innerHTML = '<img alt="" loading="lazy">';
                m.firstChild.src = u;
                m.addEventListener('click', function () { ir(i); });
                tira.appendChild(m);
                minis.push(m);
            });
            el.appendChild(tira);
        }

        function pintar() {
            img.src = urls[actual];
            img.alt = 'Foto ' + (actual + 1) + ' de ' + urls.length;
            cuenta.textContent = (actual + 1) + ' / ' + urls.length;
            minis.forEach(function (m, i) {
                m.setAttribute('aria-current', i === actual ? 'true' : 'false');
                if (i === actual && m.scrollIntoView) m.scrollIntoView({ block: 'nearest', inline: 'center' });
            });
            // Carga por adelantado la siguiente para que el cambio sea instantáneo
            if (varias) { (new Image()).src = urls[(actual + 1) % urls.length]; }
            if (typeof opciones.alCambiar === 'function') opciones.alCambiar(actual);
        }

        function ir(i) {
            actual = (i + urls.length) % urls.length;
            pintar();
        }

        if (varias) {
            anterior.addEventListener('click', function () { ir(actual - 1); });
            siguiente.addEventListener('click', function () { ir(actual + 1); });

            el.setAttribute('tabindex', '0');
            el.setAttribute('aria-roledescription', 'carrusel');
            el.onkeydown = function (e) {
                if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
            };

            // Deslizar con el dedo
            var x0 = null;
            vista.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
            vista.addEventListener('touchend', function (e) {
                if (x0 === null) return;
                var dx = e.changedTouches[0].clientX - x0;
                x0 = null;
                if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
            }, { passive: true });
        }

        pintar();
        return { ir: ir, indice: function () { return actual; } };
    }

    window.Carrusel = { montar: montar };
})();