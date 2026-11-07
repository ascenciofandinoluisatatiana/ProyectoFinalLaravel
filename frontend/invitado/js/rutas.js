/* ============ URL propia por inmueble (para compartir y para Google) ============
   Al abrir el detalle la barra de direcciones cambia a:
       /inmuebles/venta/apartamento-en-cedritos-bogota-12
       /inmuebles/arriendo/local-comercial-en-centro-ibague-7
   - El número del final es el id: es lo que busca la página, así el enlace sigue sirviendo
     aunque cambie el nombre del barrio o de la ciudad.
   - También actualiza título, descripción, <link rel="canonical">, Open Graph y JSON-LD
     (datos estructurados) con los datos del inmueble, y los restaura al cerrar.
   - Atrás / Adelante del navegador abren y cierran el detalle.
   - Los enlaces viejos "?propiedad=12" siguen funcionando y se convierten a la URL nueva.
   Se carga al final, después de detalle.js, modales.js y mejoras.js (envuelve openDetail y closeModals). */
const RT = (function () {
  'use strict';

  var BASE = '/inmuebles';
  var navegando = false;          // true mientras la propia navegación (Atrás/Adelante/enlace) abre o cierra el detalle
  var original = null;            // título y metas de la página antes de abrir un detalle

  /* ---------- URL <-> propiedad ---------- */
  function slug(txt) {
    return String(txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function pathOf(p) {
    var op = p.op === 'arriendo' ? 'arriendo' : 'venta';
    var nombre = slug(p.type + ' en ' + p.barrio + ' ' + p.city) || 'inmueble';
    return BASE + '/' + op + '/' + nombre + '-' + p.id;
  }
  function idDe(pathname) { // /inmuebles/venta/loquesea-12  ->  12   (cualquier otra ruta -> null)
    var m = /^\/inmuebles\/(?:venta|arriendo)\/[^\/]*?-(\d+)\/?$/.exec(pathname);
    return m ? +m[1] : null;
  }
  function enDetalle() { return idDe(location.pathname) !== null; }
  function detalleAbierto() { var m = document.querySelector('#mDetail'); return !!(m && m.classList.contains('open')); }

  /* ---------- metadatos para buscadores y redes ---------- */
  function setMeta(attr, key, content) {
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); el.setAttribute('data-rt', '1'); document.head.appendChild(el); }
    else if (original && !el.hasAttribute('data-rt') && !(key in original.metas)) original.metas[key] = el.getAttribute('content');
    el.setAttribute('content', content);
  }
  function setCanonical(href) {
    var el = document.querySelector('link[rel="canonical"]');
    if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); el.setAttribute('data-rt', '1'); document.head.appendChild(el); }
    el.setAttribute('href', href);
  }
  function setJsonLd(obj) {
    var el = document.querySelector('script#rt-jsonld');
    if (!el) { el = document.createElement('script'); el.id = 'rt-jsonld'; el.type = 'application/ld+json'; document.head.appendChild(el); }
    el.textContent = JSON.stringify(obj);
  }
  function aplicarMeta(p) {
    if (!original) original = { title: document.title, metas: {} };
    var url = location.origin + pathOf(p), rent = p.op === 'arriendo';
    var precio = cop(p.price) + (rent ? ' ' + t('per_month') : '');
    var titulo = title(p) + ' · ' + p.city + ' · ' + precio + ' | UMBRAL';
    var specs = [p.beds ? p.beds + ' ' + t('f_beds') : '', p.baths ? p.baths + ' ' + (lang === 'es' ? 'baños' : 'bath') : '', (p.area || 0).toLocaleString('es-CO') + ' ' + t('m2')].filter(Boolean).join(' · ');
    var resumen = String(p.desc || '').replace(/\s+/g, ' ').trim();
    var desc = (t(rent ? 'rental' : 'sale') + ': ' + title(p) + ', ' + ubic(p) + '. ' + precio + '. ' + specs + '.' + (resumen ? ' ' + resumen : '')).slice(0, 220);
    var foto = (p.fotos && p.fotos[0]) || p.img || '';
    if (foto && foto.charAt(0) === '/') foto = location.origin + foto;

    document.title = titulo;
    setMeta('name', 'description', desc);
    setCanonical(url);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'UMBRAL');
    setMeta('property', 'og:title', titulo);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    if (foto) setMeta('property', 'og:image', foto);
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: title(p) + ' · ' + p.city,
      description: desc,
      url: url,
      image: (p.fotos && p.fotos.length ? p.fotos : (p.img ? [p.img] : [])).map(function (f) { return f.charAt(0) === '/' ? location.origin + f : f; }),
      offers: { '@type': 'Offer', price: p.price, priceCurrency: 'COP', availability: 'https://schema.org/InStock', url: url },
      contentLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', streetAddress: p.addr, addressLocality: p.city, addressRegion: p.dept, addressCountry: 'CO' },
        geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng }
      }
    });
  }
  function restaurarMeta() {
    if (!original) return;
    document.title = original.title;
    document.querySelectorAll('[data-rt], script#rt-jsonld').forEach(function (n) { n.remove(); });
    Object.keys(original.metas).forEach(function (k) {
      var el = document.querySelector('meta[name="' + k + '"], meta[property="' + k + '"]'); if (el) el.setAttribute('content', original.metas[k]);
    });
    original = null;
  }
  /* ---------- historial ---------- */
  function irAlDetalle(p) {
    var ruta = pathOf(p);
    if (location.pathname !== ruta) {
      if (navegando || enDetalle()) history.replaceState({ umbralProp: p.id }, '', ruta);   // viene de la URL o cambia de inmueble: no se apila otra entrada
      else history.pushState({ umbralProp: p.id }, '', ruta);                                  // click normal: nueva entrada (Atrás vuelve al listado)
    } else if (!history.state || history.state.umbralProp !== p.id) {
      history.replaceState({ umbralProp: p.id, directo: true }, '', ruta);                     // entró directo por el enlace
    }
    aplicarMeta(p);
  }
  function volverAlListado() {
    restaurarMeta();
    if (!enDetalle()) return;
    if (history.state && history.state.umbralProp && !history.state.directo) history.back();   // deshace el pushState: el historial queda limpio
    else history.replaceState(null, '', BASE);                                                  // entró directo por el enlace: no hay entrada anterior de la app
  }

  /* ---------- envolver openDetail / closeModals (siguen siendo las mismas funciones para el resto del código) ---------- */
  var abrirOriginal = window.openDetail, cerrarOriginal = window.closeModals;
  window.openDetail = function (id) {
    var p = P.find(function (x) { return x.id === id; });
    abrirOriginal.apply(this, arguments);
    if (p) irAlDetalle(p);
  };
  window.closeModals = function () {
    var estabaAbierto = detalleAbierto();
    cerrarOriginal.apply(this, arguments);
    if (estabaAbierto && !navegando) volverAlListado();
  };

  function cerrarDetalleSinHistorial() { // Atrás con el detalle abierto: solo cierra ese detalle (otro modal que se abra después no se toca)
    navegando = true;
    try { cerrarOriginal(); } finally { navegando = false; }
    restaurarMeta();
  }
  function abrirDesdeUrl() {
    var id = idDe(location.pathname), p = id !== null && P.find(function (x) { return x.id === id; });
    if (!p) {
      if (id !== null) { try { toast(t('no_results')); } catch (_) { } history.replaceState(null, '', BASE); }
      return;
    }
    navegando = true;
    try { window.openDetail(id); } finally { navegando = false; }
  }

  window.addEventListener('popstate', function () {
    if (enDetalle()) abrirDesdeUrl();
    else if (detalleAbierto()) cerrarDetalleSinHistorial();
  });

  /* ---------- entrada por URL: /inmuebles/venta/...-12   o el enlace viejo ?propiedad=12 ---------- */
  var viejo = new URLSearchParams(location.search).get('propiedad');
  var entrada = idDe(location.pathname) !== null || viejo;
  if (entrada) {
    var intentos = 0, iv = setInterval(function () {
      intentos++;
      if (window.__loadDone && typeof P !== 'undefined') {
        clearInterval(iv);
        if (viejo && idDe(location.pathname) === null) { // convierte ?propiedad=12 en la URL nueva
          var p = P.find(function (x) { return x.id === +viejo; });
          if (p) { history.replaceState(null, '', pathOf(p)); } else { history.replaceState(null, '', BASE); return; }
        }
        abrirDesdeUrl();
      } else if (intentos > 60) { clearInterval(iv); }
    }, 150);
  }

  return { pathOf: pathOf, idDe: idDe, slug: slug };
})();
