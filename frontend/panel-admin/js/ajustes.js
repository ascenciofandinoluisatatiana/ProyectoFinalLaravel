/* UMBRAL — Ajustes de cuenta del administrador:
   resumen y historial de SUS accesos (GET /admin/mis-accesos) + cambiar contraseña */
(function () {
    'use strict';

    var P = window.PanelAdmin;

    /* ================= Submenú (pestañas) ================= */
    document.querySelectorAll('.aj-pestana').forEach(function (b) {
        b.addEventListener('click', function () {
            var cual = b.getAttribute('data-pestana');
            document.querySelectorAll('.aj-pestana').forEach(function (x) {
                x.classList.toggle('activa', x === b);
            });
            document.getElementById('panel-accesos').classList.toggle('hidden', cual !== 'accesos');
            document.getElementById('panel-clave').classList.toggle('hidden', cual !== 'clave');
        });
    });

    /* ================= Cambiar contraseña ================= */
    var formulario = document.getElementById('form-clave');
    var aviso = document.getElementById('aviso');
    var boton = document.getElementById('boton-guardar');
    var CAMPOS = ['clave_actual', 'password'];

    function limpiar() {
        aviso.className = 'hidden';
        aviso.textContent = '';
        CAMPOS.forEach(function (c) {
            document.getElementById('error-' + c).textContent = '';
        });
    }

    function mostrarAviso(texto, correcto) {
        aviso.textContent = texto;
        aviso.className = 'rounded-xl px-4 py-3 text-sm ring-1 ' + (correcto
            ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
            : 'bg-red-500/10 text-red-400 ring-red-500/30');
    }

    formulario.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        limpiar();
        boton.disabled = true;

        try {
            var respuesta = await P.api('/clave', {
                metodo: 'POST',
                cuerpo: {
                    clave_actual: document.getElementById('clave_actual').value,
                    password: document.getElementById('password').value,
                    password_confirmation: document.getElementById('password_confirmation').value
                }
            });
            formulario.reset();
            mostrarAviso(respuesta.mensaje || 'Contraseña actualizada correctamente.', true);
        } catch (error) {
            var errores = (error.datos && error.datos.errors) || {};
            CAMPOS.forEach(function (campo) {
                if (errores[campo]) {
                    document.getElementById('error-' + campo).textContent = errores[campo][0];
                }
            });
            if (error.estado !== 422) mostrarAviso(error.message, false);
        } finally {
            boton.disabled = false;
        }
    });

    /* ================= Mis accesos ================= */
    var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    function partes(texto) {
        var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(texto || ''));
        return m ? { a: +m[1], m: +m[2], d: +m[3], h: m[4], i: m[5] } : null;
    }
    function textoDia(p) {
        var f = new Date(p.a, p.m - 1, p.d);
        var hoy = new Date(); hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        var dif = Math.round((hoy - f) / 86400000);
        if (dif === 0) return 'Hoy';
        if (dif === 1) return 'Ayer';
        return p.d + ' ' + MESES[p.m - 1] + (p.a !== hoy.getFullYear() ? ' ' + p.a : '');
    }
    // "Mozilla/5.0 (Windows NT 10.0…) Chrome/…" → "Chrome · Windows"
    function dispositivo(ua) {
        ua = String(ua || '');
        if (!ua) return '—';
        var navegador = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
            : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
        var sistema = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows'
            : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
        return sistema ? navegador + ' · ' + sistema : navegador;
    }

    function pintarResumen(r) {
        var u = r.ultimo, p = u && partes(u.fecha);
        document.getElementById('res-ultimo').textContent = p ? textoDia(p) + ' · ' + p.h + ':' + p.i : 'Sin registros';
        document.getElementById('res-ultimo-ip').textContent = u ? 'Último acceso · IP ' + (u.ip || '—') : 'Último acceso';
        document.getElementById('res-accesos').textContent = r.accesos_30;
        document.getElementById('res-fallidos').textContent = r.fallidos_30;
    }

    function pintarFilas(filas) {
        document.getElementById('tabla-accesos').innerHTML = filas.map(function (f) {
            var p = partes(f.fecha);
            return '<tr class="transition-colors hover:bg-slate-800/40">' +
                '<td class="c-fecha">' + P.esc(p ? textoDia(p) : '—') + '</td>' +
                '<td class="c-hora">' + P.esc(p ? p.h + ':' + p.i : '—') + '</td>' +
                '<td class="c-ip">' + P.esc(f.ip || '—') + '</td>' +
                '<td class="c-disp" title="' + P.esc(f.dispositivo || '') + '">' + P.esc(dispositivo(f.dispositivo)) + '</td>' +
            '</tr>';
        }).join('');
    }

    function pintarPaginacion(r) {
        document.getElementById('accesos-info').textContent = r.total === 0 ? 'Sin resultados'
            : 'Mostrando ' + r.desde + '–' + r.hasta + ' de ' + r.total + ' accesos';
        var cont = document.getElementById('accesos-pag');
        cont.innerHTML = '';
        if (r.ultima_pagina <= 1) return;

        function boton(texto, destino, activo, off) {
            var b = document.createElement('button');
            b.type = 'button'; b.innerHTML = texto; b.disabled = off;
            b.className = 'grid h-8 min-w-[2rem] place-items-center rounded-lg px-2 text-xs font-medium transition-all ' +
                (activo ? 'bg-violet-600 text-white shadow shadow-violet-600/30'
                        : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200') +
                (off ? ' cursor-not-allowed opacity-40' : '');
            if (!off && !activo) b.addEventListener('click', function () { cargar(destino); });
            cont.appendChild(b);
        }
        boton('<i class="fa-solid fa-chevron-left"></i>', r.pagina_actual - 1, false, r.pagina_actual <= 1);
        var ini = Math.max(1, r.pagina_actual - 1), fin = Math.min(r.ultima_pagina, ini + 2);
        for (var n = ini; n <= fin; n++) boton(n, n, n === r.pagina_actual, false);
        boton('<i class="fa-solid fa-chevron-right"></i>', r.pagina_actual + 1, false, r.pagina_actual >= r.ultima_pagina);
    }

    async function cargar(pagina) {
        var cuerpo = document.getElementById('tabla-accesos');
        cuerpo.style.opacity = '0.45';
        try {
            var r = await P.api('/mis-accesos?page=' + (pagina || 1));
            pintarResumen(r.resumen);
            pintarFilas(r.datos);
            pintarPaginacion(r);
            document.getElementById('accesos-vacio').classList.toggle('hidden', r.total !== 0);
        } catch (e) {
            if (e.estado === 401) return;
            mostrarAviso(e.estado ? (e.message || 'No se pudo cargar tus accesos.') : 'No se pudo contactar al servidor.', false);
        } finally {
            cuerpo.style.opacity = '1';
        }
    }

    P.listo.then(function () { cargar(1); }).catch(function (e) {
        if (e && e.estado !== 401 && window.console) console.error('Ajustes:', e);
    });
})();
