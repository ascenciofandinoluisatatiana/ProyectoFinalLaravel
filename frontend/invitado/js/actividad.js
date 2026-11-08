/* UMBRAL · actividad del visitante sin cuenta (invitado)
   Avisa al portal, de forma anónima, qué hace el visitante: que entró, qué publicación abrió,
   si marcó o quitó un favorito y si dejó su contacto. El administrador lo ve en Movimientos → Invitados.
   Usa el mismo código anónimo de las reseñas (umbral_huella). Si algo falla, no pasa nada: no se avisa ni se detiene la página. */
(function () {
  'use strict';
  var URL_ACTIVIDAD = '/api/v1/public/actividad';
  var token = '';

  function huella() {
    if (token) return token;
    try { token = localStorage.getItem('umbral_huella') || ''; } catch (_) { }
    if (!token) {
      var a = new Uint8Array(16);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
      else for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256);
      token = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      try { localStorage.setItem('umbral_huella', token); } catch (_) { }
    }
    return token;
  }

  function zona() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { return ''; } }

  function enviar(tipo, extra) {
    try {
      var cuerpo = { huella: huella(), tipo: tipo, idioma: (navigator.language || '').slice(0, 10), zona_horaria: zona() };
      for (var k in extra) if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') cuerpo[k] = extra[k];
      fetch(URL_ACTIVIDAD, {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(cuerpo)
      }).catch(function () { });
    } catch (_) { }
  }

  window.UmbralActividad = {
    visita: function () { enviar('visita', {}); },
    verPublicacion: function (id) { enviar('ver_publicacion', { propiedad_id: id }); },
    favorito: function (id, agregado) { enviar(agregado ? 'favorito_agregado' : 'favorito_quitado', { propiedad_id: id }); },
    contacto: function (id, nombre, contacto) { enviar('contacto', { propiedad_id: id, nombre: String(nombre).trim(), contacto: String(contacto).trim() }); }
  };

  window.UmbralActividad.visita();
})();
