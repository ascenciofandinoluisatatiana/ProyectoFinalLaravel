/* =========================================================
   UMBRAL — Perfil del vendedor (persona)
   Muestra los datos de la cuenta, permite EDITARLOS (nombre y
   teléfono) y las dos opciones (Vender / Arrendar) con un
   resumen de cada una.
   ========================================================= */
(function () {
    'use strict';

    var V = window.Vendedor;
    var usuario = V.guardia();
    if (!usuario) return;

    var CLAVE_USUARIO = 'umbral-usuario';

    V.barra(usuario, 'perfil');

    function poner(id, texto) {
        var el = document.getElementById(id);
        if (el) el.textContent = texto;
    }

    function pintarCuenta() {
        poner('p-nombre', usuario.nombre);
        poner('p-nombre-dato', usuario.nombre);
        poner('p-correo', usuario.email);
        poner('p-correo-chip', usuario.email);
        poner('p-telefono', usuario.telefono || 'Sin registrar');
    }
    pintarCuenta();

    /* ---------- Editar perfil ---------- */
    var ventana = document.getElementById('p-editar');
    var form = document.getElementById('p-editar-form');
    V.prepararVentana(ventana);

    // Guarda el usuario actualizado donde lo dejó el login (localStorage o sessionStorage)
    function guardarUsuario(nuevo) {
        [localStorage, sessionStorage].forEach(function (almacen) {
            try {
                var crudo = almacen.getItem(CLAVE_USUARIO);
                if (!crudo) return;
                var actual = JSON.parse(crudo);
                actual.nombre = nuevo.nombre;
                actual.telefono = nuevo.telefono;
                almacen.setItem(CLAVE_USUARIO, JSON.stringify(actual));
            } catch (e) {}
        });
    }

    document.getElementById('p-editar-abrir').addEventListener('click', function () {
        form.nombre.value = usuario.nombre || '';
        form.telefono.value = usuario.telefono || '';
        document.getElementById('e-correo').value = usuario.email || '';
        ventana.showModal();
        form.nombre.focus();
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var nombre = form.nombre.value.trim();
        if (!nombre) { V.toast('Escribe tu nombre.'); form.nombre.focus(); return; }

        var boton = form.querySelector('[type="submit"]');
        boton.disabled = true;
        try {
            var r = await V.api('/perfil', {
                metodo: 'PUT',
                datos: { nombre: nombre, telefono: form.telefono.value.trim() }
            });
            usuario.nombre = r.usuario.nombre;
            usuario.telefono = r.usuario.telefono;
            guardarUsuario(usuario);
            pintarCuenta();
            V.barra(usuario, 'perfil');   // la barra de arriba también muestra el nombre
            ventana.close();
            V.toast(r.message || 'Perfil actualizado.');
        } catch (err) {
            if (err.message !== 'Sin acceso') V.toast(err.message || 'No se pudo guardar el perfil.');
        } finally {
            boton.disabled = false;
        }
    });

    /* ---------- Resumen de cada operación (desde la API) ---------- */
    function dato(valor, texto) { return '<div><b>' + valor + '</b><span>' + texto + '</span></div>'; }

    function pintarResumen(id, publicados, contactos, visitas) {
        document.getElementById(id).innerHTML =
            dato(publicados, 'Publicados') + dato(contactos, 'Contactos') + dato(visitas, 'Visitas próximas');
    }

    function resumen(operacion, datos) {
        var props = datos.propiedades.filter(function (p) { return p.operacion === operacion; });
        var ids = props.map(function (p) { return p.id; });
        var publicados = props.filter(function (p) { return p.estado === 'publicada'; }).length;
        var contactos = datos.contactos.filter(function (c) { return c.propiedad && ids.indexOf(c.propiedad.id) !== -1; }).length;
        var visitas = datos.visitas.filter(function (v) {
            return v.propiedad && ids.indexOf(v.propiedad.id) !== -1 &&
                (v.estado === 'pendiente' || v.estado === 'confirmada') && new Date(v.fecha) > new Date();
        }).length;
        return [publicados, contactos, visitas];
    }

    // Mientras llega la respuesta se muestran ceros
    ['venta', 'arriendo'].forEach(function (op) { pintarResumen('p-datos-' + op, 0, 0, 0); });

    // Trae también el teléfono guardado en el servidor (el login antiguo no lo guardaba en el navegador)
    V.api('/yo').then(function (r) {
        if (r.usuario && r.usuario.telefono !== usuario.telefono) {
            usuario.telefono = r.usuario.telefono;
            guardarUsuario(usuario);
            pintarCuenta();
        }
    }).catch(function () {});

    Promise.all([V.api('/propiedades'), V.api('/contactos'), V.api('/visitas?periodo=proximas')])
        .then(function (r) {
            var datos = { propiedades: r[0].data || [], contactos: r[1].data || [], visitas: r[2].data || [] };
            ['venta', 'arriendo'].forEach(function (op) {
                var x = resumen(op, datos);
                pintarResumen('p-datos-' + op, x[0], x[1], x[2]);
            });
        })
        .catch(function (e) {
            if (e.message !== 'Sin acceso') V.toast(e.message || 'No se pudo cargar el resumen.');
        });
})();