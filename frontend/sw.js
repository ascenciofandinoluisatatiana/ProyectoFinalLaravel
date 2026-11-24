/* UMBRAL · service worker (app instalada)
   Regla: SIEMPRE se pide primero al servidor (revalidando, para no mostrar copias viejas).
   La copia guardada solo se usa si no hay internet. No guarda /api, /storage ni nada que no sea GET. */
var VERSION = 'umbral-pwa-4';
var BASICOS = ['/app/', '/app/app.css?v=3', '/app/app.js?v=4', '/img/icono.png', '/img/hero-noche.webp', '/img/hero-dia.webp'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(BASICOS.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/^\/(api|storage|up|admin|panel-admin)(\/|$)/.test(url.pathname)) return;   // datos y paneles: siempre directo al servidor

  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(function (resp) {
      if (resp && resp.ok && resp.type === 'basic') {
        var copia = resp.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(req).then(function (guardada) {
        return guardada || (req.mode === 'navigate' ? caches.match('/app/') : Response.error());
      });
    })
  );
});
