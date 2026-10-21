/* UMBRAL — Mi perfil del administrador */
(function () {
    'use strict';

    var P = window.PanelAdmin;
    var esc = P.esc;

    var TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_BYTES = 4 * 1024 * 1024;           // el backend rechaza más de 4 MB

    var usuarioActual = null;                  // último usuario recibido de la API
    var urlPrevia = null;                      // URL temporal de la foto elegida
    var temporizadorAviso = null;

    /* ---------- utilidades ---------- */
    function mayuscula(texto) {
        texto = String(texto || '');
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function iniciales(nombre) {
        return String(nombre || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
            .map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
    }

    function leerCookie(nombre) {
        var fila = document.cookie.split('; ').filter(function (f) { return f.indexOf(nombre + '=') === 0; })[0];
        return fila ? decodeURIComponent(fila.substring(nombre.length + 1)) : '';
    }

    function el(id) { return document.getElementById(id); }

    /* Pone un texto; si no hay valor muestra "No registrado" en gris */
    function poner(id, texto, textoVacio) {
        var nodo = el(id);
        var hayValor = texto !== undefined && texto !== null && String(texto).trim() !== '';
        nodo.textContent = hayValor ? texto : (textoVacio || '');
        if (textoVacio !== undefined) nodo.classList.toggle('pf-vacio', !hayValor);
    }

    function tamano(bytes) {
        return bytes < 1024 * 1024
            ? Math.max(1, Math.round(bytes / 1024)) + ' KB'
            : (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
    }

    function claseEstado(estado) {
        estado = String(estado || '').toLowerCase();
        if (estado === 'activo') return 'chip-verde';
        if (estado === 'pendiente') return 'chip-ambar';
        return 'chip-rojo';
    }

    /* ---------- aviso (éxito / error) ---------- */
    function mostrarAviso(tipo, texto) {
        var aviso = el('aviso');
        clearTimeout(temporizadorAviso);
        aviso.className = 'pf-aviso ' + (tipo === 'ok' ? 'pf-aviso-ok' : 'pf-aviso-error');
        aviso.innerHTML = '<i class="fa-solid ' + (tipo === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation') + '"></i><span>' + esc(texto) + '</span>';
        aviso.hidden = false;
        temporizadorAviso = setTimeout(function () { aviso.hidden = true; }, 4500);
    }

    /* ---------- avatar ---------- */
    function pintarAvatar(usuario) {
        var zona = el('zona-avatar');
        zona.classList.remove('pf-previa');
        if (usuario.avatar) {
            zona.innerHTML = '<img src="/storage/' + esc(usuario.avatar) + '?v=' + Date.now() + '" alt="Foto de ' + esc(usuario.name) + '">';
        } else {
            zona.textContent = iniciales(usuario.name) || '?';
        }
    }

    /* ---------- elegir foto: vista previa antes de guardar ---------- */
    function limpiarPrevia() {
        if (urlPrevia) { URL.revokeObjectURL(urlPrevia); urlPrevia = null; }
        el('archivo-avatar').value = '';
        el('form-avatar').hidden = true;
        if (usuarioActual) pintarAvatar(usuarioActual);
    }

    function alElegirArchivo() {
        var archivo = el('archivo-avatar').files[0];
        var errorAvatar = el('error-avatar');
        errorAvatar.textContent = '';
        if (!archivo) return;

        if (TIPOS_VALIDOS.indexOf(archivo.type) === -1) {
            errorAvatar.textContent = 'La imagen debe ser JPG, PNG o WEBP.';
            limpiarPrevia();
            return;
        }
        if (archivo.size > MAX_BYTES) {
            errorAvatar.textContent = 'La imagen pesa ' + tamano(archivo.size) + ' y no puede superar 4 MB.';
            limpiarPrevia();
            return;
        }

        if (urlPrevia) URL.revokeObjectURL(urlPrevia);
        urlPrevia = URL.createObjectURL(archivo);

        var zona = el('zona-avatar');
        zona.classList.add('pf-previa');
        zona.innerHTML = '<img src="' + urlPrevia + '" alt="Vista previa">';

        el('previa-img').src = urlPrevia;
        poner('previa-nombre', archivo.name);
        poner('previa-detalle', tamano(archivo.size) + ' · así se verá tu foto');
        el('form-avatar').hidden = false;
    }

    /* ---------- decisiones ---------- */
    function pintarDecisiones(lista) {
        var zona = el('lista-decisiones');

        if (!lista.length) {
            zona.innerHTML =
                '<div class="pf-vacio-total">' +
                    '<span class="pf-icono"><i class="fa-solid fa-clock-rotate-left"></i></span>' +
                    '<b>Todavía no hay decisiones registradas.</b>' +
                    '<small>Cuando realices una verificación, aparecerá aquí.</small>' +
                '</div>';
            return;
        }

        zona.innerHTML = lista.map(function (d) {
            var aprobada = d.decision === 'aprobada';
            var clase = aprobada ? 'pf-ok' : 'pf-no';
            var fecha = d.fecha ? new Date(d.fecha) : null;

            return '<div class="pf-decision">' +
                '<span class="pf-decision-icono ' + clase + '"><i class="fa-solid ' + (aprobada ? 'fa-check' : 'fa-xmark') + '"></i></span>' +
                '<div class="pf-decision-cuerpo">' +
                    '<div class="pf-decision-nombre">' +
                        '<span>' + esc(d.cuenta_nombre || 'Cuenta no disponible') + '</span>' +
                        '<span class="pf-etiqueta ' + clase + '">' + esc(mayuscula(d.decision)) + '</span>' +
                    '</div>' +
                    '<p class="pf-decision-sub">' + esc(d.cuenta_email || 'Correo no disponible') +
                        (d.cuenta_rol ? ' · ' + esc(mayuscula(d.cuenta_rol)) : '') + '</p>' +
                    (d.motivo ? '<p class="pf-motivo">' + esc(d.motivo) + '</p>' : '') +
                '</div>' +
                '<div class="pf-decision-fecha">' +
                    (fecha ? fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '') +
                    '<small>' + (fecha ? fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) : '') + '</small>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function pintarTasa(aprobadas, rechazadas) {
        var total = aprobadas + rechazadas;
        var barra = el('tasa-barra');

        if (!total) {
            poner('tasa-texto', '—');
            barra.setAttribute('aria-label', 'Sin decisiones todavía');
            el('barra-ok').style.width = '0';
            el('barra-no').style.width = '0';
            return;
        }

        var pctOk = Math.round((aprobadas / total) * 100);
        poner('tasa-texto', pctOk + '%');
        barra.setAttribute('aria-label', pctOk + '% aprobadas, ' + (100 - pctOk) + '% rechazadas');
        // se aplica en el siguiente cuadro para que la barra se anime
        requestAnimationFrame(function () {
            el('barra-ok').style.width = (aprobadas / total * 100) + '%';
            el('barra-no').style.width = (rechazadas / total * 100) + '%';
        });
    }

    /* ---------- pintar toda la pantalla ---------- */
    function pintar(datos) {
        var u = datos.usuario;
        var documento = ((u.tipo_documento || '') + ' ' + (u.numero_documento || '')).trim();
        usuarioActual = u;

        pintarAvatar(u);
        poner('perfil-nombre', u.name);
        poner('perfil-correo', u.email);
        poner('perfil-rol', mayuscula(u.rol || 'sin rol'));
        poner('perfil-estado', mayuscula(u.estado));
        el('chip-estado').className = 'chip ' + claseEstado(u.estado);

        poner('dato-correo', u.email);
        poner('dato-telefono', u.telefono, 'No registrado');
        poner('dato-documento', documento, 'No registrado');
        poner('dato-rol', mayuscula(u.rol || '—'));
        poner('dato-estado', mayuscula(u.estado));
        poner('dato-desde', u.creado
            ? new Date(u.creado).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—');

        poner('total-decisiones', datos.total);
        poner('total-aprobadas', datos.aprobadas);
        poner('total-rechazadas', datos.rechazadas);
        pintarTasa(Number(datos.aprobadas) || 0, Number(datos.rechazadas) || 0);
        pintarDecisiones(datos.ultimas || []);
    }

    async function cargar() {
        try {
            pintar(await P.api('/perfil'));
        } catch (error) {
            if (error.estado === 401) return;
            el('lista-decisiones').innerHTML =
                '<p style="padding:32px 22px;text-align:center;font-size:.875rem;color:#ef4444">No se pudo cargar el perfil: ' + esc(error.message) + '</p>';
        }
    }

    /* ---------- subir la foto (multipart, no JSON) ---------- */
    async function guardarFoto(evento) {
        evento.preventDefault();

        var errorAvatar = el('error-avatar');
        var boton = el('boton-avatar');
        var textoBoton = boton.querySelector('span');
        var archivo = el('archivo-avatar').files[0];
        errorAvatar.textContent = '';

        if (!archivo) {
            errorAvatar.textContent = 'Selecciona una imagen.';
            return;
        }

        var formulario = new FormData();
        formulario.append('avatar', archivo);

        var cabeceras = { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
        var xsrf = leerCookie('XSRF-TOKEN');
        if (xsrf) cabeceras['X-XSRF-TOKEN'] = xsrf;

        boton.disabled = true;
        el('cancelar-avatar').disabled = true;
        textoBoton.textContent = 'Subiendo…';

        try {
            var respuesta = await fetch('/api/v1/admin/perfil/avatar', {
                method: 'POST',
                credentials: 'same-origin',
                headers: cabeceras,
                body: formulario
            });
            var datos = await respuesta.json().catch(function () { return {}; });

            if (respuesta.status === 401) { window.location.replace('/index.html'); return; }

            if (!respuesta.ok) {
                var errores = datos.errors || {};
                errorAvatar.textContent = (errores.avatar && errores.avatar[0]) || datos.message || ('Error ' + respuesta.status);
                return;
            }

            limpiarPrevia();
            await cargar();
            mostrarAviso('ok', datos.mensaje || 'Foto de perfil actualizada correctamente.');
        } catch (e) {
            errorAvatar.textContent = 'No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.';
        } finally {
            boton.disabled = false;
            el('cancelar-avatar').disabled = false;
            textoBoton.textContent = 'Guardar foto';
        }
    }

    /* ---------- eventos ---------- */
    function abrirSelector() { el('archivo-avatar').click(); }

    el('boton-elegir').addEventListener('click', abrirSelector);
    el('boton-elegir-2').addEventListener('click', abrirSelector);
    el('archivo-avatar').addEventListener('change', alElegirArchivo);
    el('cancelar-avatar').addEventListener('click', function () {
        el('error-avatar').textContent = '';
        limpiarPrevia();
    });
    el('form-avatar').addEventListener('submit', guardarFoto);

    P.listo.then(cargar);
})();
