/* =========================================================
   UMBRAL — Panel del vendedor (persona): utilidades comunes
   - Revisa que haya una sesión de VENDEDOR (la guarda login.js)
   - Dibuja la barra superior, el cambio de tema y el cierre de sesión
   - Guarda los inmuebles, contactos y visitas del vendedor

   IMPORTANTE (datos): todavía no existe una API autenticada para el
   vendedor, así que los datos viven en el navegador (localStorage) bajo
   la clave "umbral-vendedor-<id>". Cuando el backend la tenga, solo hay
   que cambiar el objeto Almacen (al final de este archivo): el resto de
   las pantallas no se toca.
   ========================================================= */
(function () {
    'use strict';

    var CLAVE_TEMA = 'umbral-tema';
    var CLAVE_USUARIO = 'umbral-usuario';

    /* ---------- Datos de cada operación ---------- */
    var OPERACIONES = {
        venta: {
            clave: 'venta', pagina: '/vendedor/vender.html', icono: 'fa-house-circle-check',
            etiqueta: 'Panel de ventas', titulo: 'Tus inmuebles en venta',
            descripcion: 'Publica, destaca y haz seguimiento a cada comprador interesado.',
            kpi1: 'Inmuebles en venta', kpiCierre: 'Ventas cerradas',
            cierre: 'vendida', cierreAccion: 'Marcar como vendido', cierreMensaje: 'Inmueble marcado como vendido.',
            sufijoPrecio: '', vacio: 'Aún no tienes inmuebles en venta'
        },
        arriendo: {
            clave: 'arriendo', pagina: '/vendedor/arrendar.html', icono: 'fa-key',
            etiqueta: 'Panel de arriendos', titulo: 'Tus inmuebles en arriendo',
            descripcion: 'Gestiona tus arriendos y coordina las visitas de posibles inquilinos.',
            kpi1: 'Inmuebles en arriendo', kpiCierre: 'Arriendos cerrados',
            cierre: 'arrendada', cierreAccion: 'Marcar como arrendado', cierreMensaje: 'Inmueble marcado como arrendado.',
            sufijoPrecio: ' / mes', vacio: 'Aún no tienes inmuebles en arriendo'
        }
    };

    var TIPOS = { casa: 'Casa', apartamento: 'Apartamento', finca: 'Finca', local: 'Local', lote: 'Lote' };
    var PLANES = { semanal: { dias: 7, nombre: 'Semanal' }, quincenal: { dias: 15, nombre: 'Quincenal' }, mensual: { dias: 30, nombre: 'Mensual' } };

    /* ---------- Utilidades ---------- */
    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function cop(n) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
    }

    function iniciales(nombre) {
        var p = String(nombre || '?').trim().split(/\s+/);
        return ((p[0] || '?')[0] + (p.length > 1 ? p[1][0] : '')).toUpperCase();
    }

    function fecha(iso) {
        return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    }

    function relativo(iso) {
        var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
        if (min < 1) return 'justo ahora';
        if (min < 60) return 'hace ' + min + ' min';
        if (min < 1440) return 'hace ' + Math.round(min / 60) + ' h';
        var d = Math.round(min / 1440);
        return d === 1 ? 'ayer' : 'hace ' + d + ' días';
    }

    /* ---------- Sesión ---------- */
    function leerUsuario() {
        try {
            var crudo = localStorage.getItem(CLAVE_USUARIO) || sessionStorage.getItem(CLAVE_USUARIO);
            return crudo ? JSON.parse(crudo) : null;
        } catch (e) { return null; }
    }

    // Sin sesión vuelve al inicio; con otro rol, a su propia pantalla.
    function guardia() {
        var u = leerUsuario();
        if (!u) { window.location.replace('/index.html'); return null; }
        if (u.rol !== 'vendedor') {
            window.location.replace(u.rol === 'administrador' ? '/panel-admin/dashboard.html' : '/panel.html');
            return null;
        }
        return u;
    }

    function cerrarSesion() {
        localStorage.removeItem(CLAVE_USUARIO);
        sessionStorage.removeItem(CLAVE_USUARIO);
        sessionStorage.removeItem('umbral-invitado');
        localStorage.removeItem('umbral-token');
        sessionStorage.removeItem('umbral-token');
        window.location.href = '/index.html';
    }

    /* ---------- Tema claro / oscuro (misma clave que el resto del sitio) ---------- */
    function aplicarTema(tema) {
        document.documentElement.setAttribute('data-theme', tema);
        try { localStorage.setItem(CLAVE_TEMA, tema); } catch (e) {}
        document.querySelectorAll('.v-tema button').forEach(function (b) {
            b.setAttribute('aria-pressed', b.dataset.tema === tema ? 'true' : 'false');
        });
        document.dispatchEvent(new CustomEvent('umbral:tema'));
    }

    /* ---------- Barra superior ---------- */
    function barra(usuario, activo) {
        var cont = document.getElementById('v-topbar');
        if (!cont) return;
        var tema = document.documentElement.getAttribute('data-theme') || 'light';

        function tab(id, href, icono, texto) {
            return '<a class="v-tab" href="' + href + '"' + (activo === id ? ' aria-current="page"' : '') +
                '><i class="fa-solid ' + icono + '"></i>' + texto + '</a>';
        }

        cont.innerHTML =
            '<a class="v-marca" href="/vendedor/perfil.html"><img src="/img/icono.png" alt="Umbral">' +
            '<span><strong>UMBRAL</strong><em>El paso hacia un nuevo hogar.</em></span></a>' +
            '<nav class="v-tabs" aria-label="Secciones del vendedor">' +
                tab('perfil', '/vendedor/perfil.html', 'fa-user', 'Mi perfil') +
                tab('venta', OPERACIONES.venta.pagina, OPERACIONES.venta.icono, 'Vender') +
                tab('arriendo', OPERACIONES.arriendo.pagina, OPERACIONES.arriendo.icono, 'Arrendar') +
            '</nav>' +
            '<div class="v-topbar-der">' +
                '<div class="v-tema" role="group" aria-label="Tema de la interfaz">' +
                    '<button type="button" data-tema="light" aria-pressed="' + (tema === 'light') + '" aria-label="Tema claro">' +
                        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>' +
                    '<button type="button" data-tema="dark" aria-pressed="' + (tema === 'dark') + '" aria-label="Tema oscuro">' +
                        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>' +
                '</div>' +
                '<div class="v-usuario"><span class="v-avatar">' + esc(iniciales(usuario.nombre)) + '</span>' +
                    '<div><b>' + esc(usuario.nombre) + '</b><small>Vendedor · Persona</small></div></div>' +
                '<button type="button" class="v-icono-btn" id="v-salir" title="Cerrar sesión" aria-label="Cerrar sesión">' +
                    '<i class="fa-solid fa-right-from-bracket"></i></button>' +
            '</div>';

        cont.querySelectorAll('[data-tema]').forEach(function (b) {
            b.addEventListener('click', function () { aplicarTema(b.dataset.tema); });
        });
        document.getElementById('v-salir').addEventListener('click', cerrarSesion);
    }

    /* ---------- Aviso emergente y ventanas ---------- */
    var temporizador;
    function toast(mensaje) {
        var t = document.getElementById('v-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'v-toast'; t.className = 'v-toast';
            t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
            document.body.appendChild(t);
        }
        t.textContent = mensaje;
        t.classList.add('visible');
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { t.classList.remove('visible'); }, 3200);
    }

    // Cierra una ventana <dialog> con la X, con "Cancelar" o al tocar fuera.
    function prepararVentana(dialogo) {
        dialogo.addEventListener('click', function (e) {
            if (e.target === dialogo || e.target.closest('[data-cerrar]')) dialogo.close();
        });
    }

    /* ---------- Datos de ejemplo (se pueden quitar con un clic) ---------- */
    function haceDias(d, h) { return new Date(Date.now() - ((d * 24) + (h || 0)) * 3600000).toISOString(); }
    function enDias(d, hora) {
        var f = new Date(); f.setDate(f.getDate() + d); f.setHours(hora || 10, 0, 0, 0); return f.toISOString();
    }

    function ejemplos() {
        function p(id, op, tipo, precio, dep, ciudad, barrio, dir, hab, ban, par, area, estrato, estado, img) {
            return { id: id, demo: true, operacion: op, tipo: tipo, precio: precio, departamento: dep, ciudad: ciudad, barrio: barrio,
                direccion: dir, habitaciones: hab, banos: ban, parqueaderos: par, area: area, estrato: estrato, estado: estado,
                imagen: img, creada: haceDias(20 - id) };
        }
        function c(id, prop, nombre, contacto, mensaje, dias, horas, atendido) {
            return { id: id, demo: true, propiedadId: prop, nombre: nombre, contacto: contacto, mensaje: mensaje, fecha: haceDias(dias, horas), atendido: !!atendido };
        }
        function v(id, prop, nombre, dias, hora, estado) {
            return { id: id, demo: true, propiedadId: prop, nombre: nombre, fecha: enDias(dias, hora), estado: estado };
        }
        return {
            membresia: { plan: 'quincenal', hasta: enDias(11, 23), demo: true },
            propiedades: [
                p(1, 'venta', 'apartamento', 620000000, 'Antioquia', 'Medellín', 'El Poblado', 'Cra 35 # 8A-20', 3, 2, 2, 98, 5, 'publicada', '/img/prop-bogota.png'),
                p(2, 'venta', 'casa', 890000000, 'Cundinamarca', 'Chía', 'Fusca', 'Cl 12 # 5-40', 4, 3, 2, 210, 4, 'publicada', '/img/residence-dusk.png'),
                p(3, 'venta', 'finca', 1450000000, 'Antioquia', 'Guatapé', 'Vereda El Roble', 'Km 4 vía Guatapé', 5, 4, 4, 3200, 6, 'borrador', '/img/prop-guatape.png'),
                p(4, 'venta', 'apartamento', 380000000, 'Bolívar', 'Cartagena', 'Bocagrande', 'Cra 2 # 9-15', 2, 2, 1, 74, 5, 'vendida', '/img/prop-cartagena.png'),
                p(5, 'arriendo', 'apartamento', 2800000, 'Bogotá D.C.', 'Bogotá', 'Chapinero', 'Cl 57 # 7-31', 2, 1, 1, 64, 4, 'publicada', '/img/prop-bogota.png'),
                p(6, 'arriendo', 'casa', 4200000, 'Valle del Cauca', 'Cali', 'Ciudad Jardín', 'Cl 18 # 122-60', 4, 3, 2, 180, 5, 'publicada', '/img/residence-night.png'),
                p(7, 'arriendo', 'apartamento', 1900000, 'Atlántico', 'Barranquilla', 'Alto Prado', 'Cra 53 # 79-12', 2, 2, 1, 72, 4, 'pausada', '/img/prop-cartagena.png'),
                p(8, 'arriendo', 'apartamento', 2300000, 'Antioquia', 'Medellín', 'Laureles', 'Cir 3 # 70-18', 2, 1, 1, 58, 4, 'arrendada', '/img/prop-bogota.png')
            ],
            contactos: [
                c(1, 1, 'Camila Rojas', '3104567890', 'Hola, ¿el precio es negociable? Me gustaría conocerlo esta semana.', 0, 2, false),
                c(2, 2, 'Andrés Gómez', 'andres.gomez@correo.co', 'Estoy interesado en la casa. ¿Tiene escrituras al día?', 1, 3, false),
                c(3, 1, 'Valentina Muñoz', '3118821144', '¿Se puede visitar el sábado en la mañana?', 2, 5, true),
                c(4, 2, 'Julián Herrera', '3206677889', 'Quisiera más fotos del jardín y de la cocina.', 4, 1, true),
                c(5, 5, 'Laura Becerra', '3015550123', 'Busco arrendar desde el mes entrante. ¿Aceptan mascotas?', 0, 5, false),
                c(6, 6, 'Sebastián Ortiz', 'sebas.ortiz@correo.co', '¿Incluye la administración en el canon?', 1, 8, false),
                c(7, 5, 'Mariana Duque', '3149990011', 'Me interesa, ¿podemos coordinar una visita?', 3, 2, true),
                c(8, 6, 'Felipe Castaño', '3023334455', '¿El contrato es a 12 meses?', 5, 6, true)
            ],
            visitas: [
                v(1, 1, 'Camila Rojas', 1, 10, 'pendiente'),
                v(2, 2, 'Andrés Gómez', 2, 15, 'confirmada'),
                v(3, 5, 'Laura Becerra', 1, 16, 'pendiente'),
                v(4, 6, 'Sebastián Ortiz', 3, 9, 'confirmada')
            ]
        };
    }

    /* ---------- Almacén de datos del vendedor ---------- */
    function Almacen(usuario) {
        var clave = 'umbral-vendedor-' + usuario.id;

        function guardar(d) {
                    try { localStorage.setItem(clave, JSON.stringify(d)); }
                    catch (e) { toast('No se pudo guardar: el almacenamiento del navegador está lleno. Usa fotos más livianas o elimina inmuebles.'); }
                    return d;
                }
        function leer() {
            try {
                var d = JSON.parse(localStorage.getItem(clave));
                if (d && d.propiedades) return d;
            } catch (e) {}
            // Primera visita: se muestran datos de ejemplo (avisados en pantalla)
            var base = ejemplos();
            base.demo = true; base.seq = 100;
            return guardar(base);
        }

        return {
            leer: leer,
            guardar: guardar,
            siguienteId: function (d) { d.seq = (d.seq || 100) + 1; return d.seq; },
            membresiaActiva: function (d) { return !!(d.membresia && new Date(d.membresia.hasta) > new Date()); },
            quitarEjemplos: function () {
                var d = leer();
                function propio(x) { return !x.demo; }
                d.propiedades = d.propiedades.filter(propio);
                d.contactos = d.contactos.filter(propio);
                d.visitas = d.visitas.filter(propio);
                if (d.membresia && d.membresia.demo) d.membresia = null;
                d.demo = false;
                return guardar(d);
            }
        };
    }

    window.Vendedor = {
        OPERACIONES: OPERACIONES, TIPOS: TIPOS, PLANES: PLANES,
        esc: esc, cop: cop, iniciales: iniciales, fecha: fecha, relativo: relativo,
        guardia: guardia, barra: barra, toast: toast, prepararVentana: prepararVentana, Almacen: Almacen
    };
})();