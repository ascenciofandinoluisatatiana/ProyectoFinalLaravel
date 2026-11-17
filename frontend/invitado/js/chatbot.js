/* UMBRAL · invitado · ASISTENTE VIRTUAL ("Umbra")
   Botón flotante abajo a la derecha que abre un chat. Las preguntas van a
   POST /api/v1/public/chatbot (el backend habla con DeepSeek; la llave nunca llega al navegador).
   - Preguntas sugeridas (las más comunes) para tocar y enviar.
   - Búsqueda de propiedades: si el visitante pide ver propiedades, el backend (DeepSeek) devuelve los filtros y
     la página muestra tarjetas con foto con las propiedades que YA tiene cargadas (P); no se inventa nada.
   - La conversación se guarda en esta pestaña (sessionStorage) mientras la pestaña siga abierta.
   - Se traduce con el selector de idioma de la página (es / en / pt / fr).
   Se carga al final, después de experiencia.js. No modifica ninguna otra función. */
(function () {
  'use strict';

  var TX = {
    fab: ['Pregúntale a Umbra', 'Ask Umbra', 'Pergunte à Umbra', 'Demandez à Umbra'],
    tip: ['¿Buscas propiedad? ¡Te ayudo a encontrarla!', 'Looking for a property? I\'ll help you find it!', 'Procurando imóvel? Eu ajudo você a encontrar!', 'Vous cherchez un bien ? Je vous aide à le trouver !'],
    title: ['Umbra · Asistente', 'Umbra · Assistant', 'Umbra · Assistente', 'Umbra · Assistant'],
    sub: ['En línea · Aquí para ayudarte', 'Online · Here to help you', 'Online · Aqui para ajudar', 'En ligne · À votre service'],
    hello: ['¡Hola! Soy Umbra. Te cuento cómo funciona UMBRAL y también te busco propiedades: dime qué quieres (tipo, ciudad, presupuesto…) y te muestro opciones.',
      'Hi! I\'m Umbra. I can explain how UMBRAL works and also find properties for you: tell me what you want (type, city, budget…) and I\'ll show options.',
      'Olá! Eu sou a Umbra. Explico como o UMBRAL funciona e também busco imóveis: diga o que quer (tipo, cidade, orçamento…) e mostro opções.',
      'Bonjour ! Je suis Umbra. J\'explique comment fonctionne UMBRAL et je cherche aussi des biens : dites-moi ce que vous voulez (type, ville, budget…) et je vous montre des options.'],
    none: ['No encontré propiedades con esos criterios. Prueba con otra ciudad, un presupuesto más alto o menos filtros.', 'I couldn\'t find properties with those criteria. Try another city, a higher budget or fewer filters.', 'Não encontrei imóveis com esses critérios. Tente outra cidade, um orçamento maior ou menos filtros.', 'Je n\'ai trouvé aucun bien avec ces critères. Essayez une autre ville, un budget plus élevé ou moins de filtres.'],
    seeall: ['Ver las {n} en la lista', 'See all {n} in the list', 'Ver os {n} na lista', 'Voir les {n} dans la liste'],
    showing: ['Mostrando {a} de {n}', 'Showing {a} of {n}', 'Mostrando {a} de {n}', 'Affichage de {a} sur {n}'],
    ph: ['Escribe tu pregunta…', 'Type your question…', 'Escreva sua pergunta…', 'Écrivez votre question…'],
    send: ['Enviar', 'Send', 'Enviar', 'Envoyer'],
    open: ['Abrir asistente', 'Open assistant', 'Abrir assistente', 'Ouvrir l\'assistant'],
    close: ['Cerrar', 'Close', 'Fechar', 'Fermer'],
    reset: ['Nueva conversación', 'New conversation', 'Nova conversa', 'Nouvelle conversation'],
    typing: ['Escribiendo…', 'Typing…', 'Digitando…', 'Écrit…'],
    off: ['Ahora no puedo responder. Intenta de nuevo en unos minutos.', 'I can\'t answer right now. Please try again in a few minutes.', 'Não posso responder agora. Tente novamente em alguns minutos.', 'Je ne peux pas répondre pour le moment. Réessayez dans quelques minutes.'],
    limit: ['Llegaste al límite de preguntas por hoy. Vuelve mañana o escribe directamente al vendedor.', 'You reached today\'s question limit. Come back tomorrow or write to the seller directly.', 'Você atingiu o limite de perguntas de hoje. Volte amanhã ou escreva diretamente ao vendedor.', 'Vous avez atteint la limite de questions du jour. Revenez demain ou écrivez directement au vendeur.'],
    net: ['No hay conexión. Revisa tu internet e intenta otra vez.', 'No connection. Check your internet and try again.', 'Sem conexão. Verifique sua internet e tente novamente.', 'Pas de connexion. Vérifiez votre internet et réessayez.'],
    note: ['Respuestas generadas por IA; confirma los datos importantes con el vendedor.', 'AI-generated answers; confirm important details with the seller.', 'Respostas geradas por IA; confirme os dados importantes com o vendedor.', 'Réponses générées par IA ; confirmez les informations importantes avec le vendeur.']
  };

  /* Preguntas sugeridas: son las más probables de un invitado. Cada una se envía tal cual al asistente. */
  var SUG = [
    ['Quiero un apartamento en arriendo', 'I want an apartment for rent', 'Quero um apartamento para alugar', 'Je veux un appartement à louer'],
    ['Casas en venta hasta 600 millones', 'Houses for sale up to 600 million', 'Casas à venda até 600 milhões', 'Maisons à vendre jusqu\'à 600 millions'],
    ['Muéstrame lo más barato para arrendar', 'Show me the cheapest rentals', 'Mostre os aluguéis mais baratos', 'Montrez-moi les locations les moins chères'],
    ['¿Cómo funciona UMBRAL?', 'How does UMBRAL work?', 'Como funciona o UMBRAL?', 'Comment fonctionne UMBRAL ?'],
    ['¿Necesito cuenta para ver propiedades?', 'Do I need an account to browse?', 'Preciso de conta para ver imóveis?', 'Faut-il un compte pour consulter les annonces ?'],
    ['¿Cómo contacto al vendedor?', 'How do I contact the seller?', 'Como contato o vendedor?', 'Comment contacter le vendeur ?'],
    ['¿Mi mensaje sí le llega al vendedor?', 'Does my message really reach the seller?', 'Minha mensagem chega ao vendedor?', 'Mon message arrive-t-il au vendeur ?'],
    ['¿Cómo pago una compra o arriendo?', 'How do I pay for a purchase or rental?', 'Como pago uma compra ou aluguel?', 'Comment payer un achat ou une location ?'],
    ['¿Qué significa "Verificada"?', 'What does "Verified" mean?', 'O que significa "Verificada"?', 'Que signifie « Vérifiée » ?'],
    ['¿Qué son Oro, Plata y Bronce?', 'What are Gold, Silver and Bronze?', 'O que são Ouro, Prata e Bronze?', 'Que sont Or, Argent et Bronze ?'],
    ['¿Cómo guardo mis favoritos y búsquedas?', 'How do I save favorites and searches?', 'Como salvo favoritos e buscas?', 'Comment enregistrer favoris et recherches ?'],
    ['¿Cómo vendo o arriendo mi propiedad?', 'How do I sell or rent out my property?', 'Como vendo ou alugo meu imóvel?', 'Comment vendre ou louer mon bien ?']
  ];

  var KEY = 'umbral_chat';
  var MAX_MSG = 12;       // lo que se guarda y se envía (el backend usa los últimos 10)
  var msgs = [];          // [{rol:'user'|'assistant', texto:'...', buscar:{...}|null, ids:[...], total:N}]
  var ocupado = false;

  function I() { try { var i = LANGS.indexOf(lang); return i < 0 ? 0 : i; } catch (_) { return 0; } }
  function T(k) { return (TX[k] || [k])[I()] || TX[k][0]; }
  function idioma() { try { return LANGS[I()] || 'es'; } catch (_) { return 'es'; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* texto del asistente -> HTML seguro: escapa todo y solo permite **negrita**, saltos de línea y viñetas simples */
  function md(s) {
    var h = esc(s).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
    return h.split(/\n/).map(function (l) {
      return /^\s*[-•*]\s+/.test(l) ? '<span class="cb-li">' + l.replace(/^\s*[-•*]\s+/, '') + '</span>' : l;
    }).join('<br>').replace(/(<\/span>)<br>/g, '$1');
  }
  function guardar() { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-MAX_MSG))); } catch (_) { } }
  function cargar() { try { var a = JSON.parse(sessionStorage.getItem(KEY) || '[]'); if (Array.isArray(a)) msgs = a.filter(function (m) { return m && (m.rol === 'user' || m.rol === 'assistant') && typeof m.texto === 'string'; }).slice(-MAX_MSG); } catch (_) { } }


  /* ---------- búsqueda de propiedades (con las que la página ya tiene cargadas) ---------- */
  var MAX_TARJ = 4;
  function norm(x) { return String(x == null ? '' : x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function listaP() { try { return Array.isArray(P) ? P : []; } catch (_) { return []; } }
  function buscarProps(b) {
    var c = norm(b.ciudad), br = norm(b.barrio);
    var r = listaP().filter(function (p) {
      if (b.operacion && p.op !== b.operacion) return false;
      if (b.tipo && p.type !== b.tipo) return false;
      if (c && norm(p.city) !== c && norm(p.dept) !== c) return false;
      if (br && norm(p.barrio).indexOf(br) < 0) return false;
      if (b.precio_min != null && p.price < b.precio_min) return false;
      if (b.precio_max != null && p.price > b.precio_max) return false;
      if (b.habitaciones_min != null && (p.beds || 0) < b.habitaciones_min) return false;
      if (b.parqueadero && !(p.park > 0)) return false;
      return true;
    });
    if (b.orden === 'menor_precio') r = r.slice().sort(function (a, z) { return a.price - z.price; });
    else if (b.orden === 'mayor_precio') r = r.slice().sort(function (a, z) { return z.price - a.price; });
    return r;
  }
  function ciudadesDelPortal() {
    var seen = {}, out = [];
    listaP().forEach(function (p) { if (p.city && !seen[p.city]) { seen[p.city] = 1; out.push(p.city); } });
    return out.slice(0, 80);
  }
  function tarjetaHTML(p) {
    var rent = p.op === 'arriendo';
    var specs = [p.beds ? '<span><i class="fa-solid fa-bed"></i>' + p.beds + '</span>' : '',
      p.baths ? '<span><i class="fa-solid fa-bath"></i>' + p.baths + '</span>' : '',
      p.area ? '<span><i class="fa-solid fa-ruler-combined"></i>' + Number(p.area).toLocaleString('es-CO') + ' m²</span>' : ''].join('');
    return '<button type="button" class="cb-pc" data-pid="' + esc(p.id) + '">' +
      '<span class="cb-pi" style="' + esc(imgStyle(p)) + '">' + (p.img ? '' : icon(p)) +
      '<em class="cb-op ' + (rent ? 'r' : 's') + '">' + esc(t(rent ? 'rental' : 'sale')) + '</em></span>' +
      '<span class="cb-pb"><b class="cb-pr">' + esc(cop(p.price)) + (rent ? '<small> ' + esc(t('per_month')) + '</small>' : '') + '</b>' +
      '<span class="cb-pt">' + esc(title(p)) + (p.prem ? ' <i class="fa-solid fa-star cb-st" title="Premium"></i>' : '') + '</span>' +
      '<span class="cb-pl"><i class="fa-solid fa-location-dot"></i>' + esc(p.city) + '</span>' +
      '<span class="cb-ps">' + specs + '</span></span></button>';
  }
  /* pinta las tarjetas de un mensaje del asistente: ids = las que se muestran, total = cuántas coinciden */
  function tarjetas(m) {
    var ps = (m.ids || []).map(function (id) { return listaP().find(function (x) { return String(x.id) === String(id); }); }).filter(Boolean);
    if (!ps.length) return;
    var w = document.createElement('div');
    w.className = 'cb-cards';
    var total = m.total || ps.length;
    w.innerHTML = ps.map(tarjetaHTML).join('') +
      '<div class="cb-more"><small>' + esc(T('showing').replace('{a}', ps.length).replace('{n}', total)) + '</small>' +
      (m.buscar && m.buscar.precio_min == null && total > ps.length
        ? '<button type="button" class="cb-all" data-all="1"><i class="fa-solid fa-table-cells-large"></i>' + esc(T('seeall').replace('{n}', total)) + '</button>' : '') +
      '</div>';
    w._m = m;
    body.appendChild(w);
    body.scrollTop = body.scrollHeight;
  }
  /* "Ver las N en la lista": lleva los mismos filtros a la página principal */
  function aplicarALista(b) {
    var r = buscarProps(b), p0 = r[0];
    S.op = b.operacion || 'all'; S.type = b.tipo || ''; S.q = b.barrio || ''; S.barrio = '';
    S.beds = b.habitaciones_min ? String(b.habitaciones_min) : ''; S.max = b.precio_max ? String(b.precio_max) : '';
    S.park = !!b.parqueadero; S.sort = b.orden === 'menor_precio' ? 'low' : b.orden === 'mayor_precio' ? 'high' : 'rel';
    S.favOnly = false; S.seller = null; S.showAll = false; S.dept = ''; S.city = '';
    if (b.ciudad && p0) { var c = norm(b.ciudad); if (norm(p0.city) === c) { S.dept = p0.dept; S.city = p0.city; } else if (norm(p0.dept) === c) { S.dept = p0.dept; } }
    var q = document.querySelector('#q'), qh = document.querySelector('#qHero'), mx = document.querySelector('#fMax');
    if (q) q.value = S.q; if (qh) qh.value = S.q; if (mx) mx.value = S.max;
    document.querySelectorAll('.op').forEach(function (x) { x.classList.toggle('active', x.dataset.op === S.op); });
    try { buildFilters(); } catch (_) { }
    render();
    var cards = document.querySelector('#cards'); if (cards) cards.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- interfaz ---------- */
  var root = document.createElement('div');
  root.className = 'cb';
  root.innerHTML =
    '<div class="cb-tip" id="cbTip" hidden role="status"><button type="button" class="cb-tip-x" id="cbTipX" aria-label="x"><i class="fa-solid fa-xmark"></i></button><span data-cb="tip"></span></div>' +
    '<button type="button" class="cb-fab" id="cbFab" aria-expanded="false" aria-controls="cbPanel"><span class="cb-fab-ic"><i class="fa-solid fa-wand-magic-sparkles"></i><i class="cb-on"></i></span><span class="cb-fab-t" data-cb="fab"></span></button>' +
    '<section class="cb-panel" id="cbPanel" role="dialog" aria-label="Umbra" hidden>' +
    '<header class="cb-head"><span class="cb-av"><i class="fa-solid fa-wand-magic-sparkles"></i><i class="cb-on"></i></span>' +
    '<div class="cb-ht"><b data-cb="title"></b><small data-cb="sub"></small></div>' +
    '<button type="button" class="cb-ic" id="cbReset" data-cbt="reset"><i class="fa-solid fa-rotate-right"></i></button>' +
    '<button type="button" class="cb-ic" id="cbClose" data-cbt="close"><i class="fa-solid fa-xmark"></i></button></header>' +
    '<div class="cb-body" id="cbBody" aria-live="polite"></div>' +
    '<div class="cb-sug" id="cbSug"></div>' +
    '<form class="cb-form" id="cbForm" autocomplete="off"><input id="cbIn" type="text" maxlength="500" data-cbph="ph" aria-label="Pregunta">' +
    '<button type="submit" class="cb-send" id="cbSend" data-cbt="send"><i class="fa-solid fa-paper-plane"></i></button></form>' +
    '<p class="cb-note" data-cb="note"></p></section>';
  document.body.appendChild(root);

  var $ = function (s) { return root.querySelector(s); };
  var fab = $('#cbFab'), panel = $('#cbPanel'), body = $('#cbBody'), sug = $('#cbSug'), form = $('#cbForm'), inp = $('#cbIn');

  function textos() {
    root.querySelectorAll('[data-cb]').forEach(function (e) { e.textContent = T(e.getAttribute('data-cb')); });
    root.querySelectorAll('[data-cbt]').forEach(function (e) { var t = T(e.getAttribute('data-cbt')); e.title = t; e.setAttribute('aria-label', t); });
    root.querySelectorAll('[data-cbph]').forEach(function (e) { e.placeholder = T(e.getAttribute('data-cbph')); });
    fab.setAttribute('aria-label', T('open'));
    pintarSug();
  }
  function burbuja(rol, html, extra) {
    var d = document.createElement('div');
    d.className = 'cb-m cb-' + (rol === 'user' ? 'u' : 'b') + (extra ? ' ' + extra : '');
    d.innerHTML = html;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }
  function pintar() {
    body.innerHTML = '';
    burbuja('assistant', '<span data-hello>' + esc(T('hello')) + '</span>');
    msgs.forEach(function (m) { burbuja(m.rol, m.rol === 'user' ? esc(m.texto) : md(m.texto)); if (m.rol === 'assistant' && m.ids) tarjetas(m); });
    pintarSug();
  }
  function pintarSug() {
    /* las sugerencias se muestran solo al empezar; después estorban */
    if (msgs.length) { sug.innerHTML = ''; sug.hidden = true; return; }
    sug.hidden = false;
    sug.innerHTML = SUG.map(function (q, i) { return '<button type="button" class="cb-chip' + (i < 3 ? ' s' : '') + '" data-q="' + i + '">' + (i < 3 ? '<i class="fa-solid fa-magnifying-glass"></i>' : '') + esc(q[I()] || q[0]) + '</button>'; }).join('');
  }

  /* globito de invitación: una sola vez por sesión, a los 4 s; se cierra solo */
  var tip = $('#cbTip'), tipT = null;
  function tipOff(recordar) {
    clearTimeout(tipT); tip.hidden = true;
    if (recordar) { try { sessionStorage.setItem('umbral_chat_tip', '1'); } catch (_) { } }
  }
  (function () {
    var visto = false; try { visto = !!sessionStorage.getItem('umbral_chat_tip') || !!sessionStorage.getItem(KEY); } catch (_) { }
    if (visto) return;
    setTimeout(function () {
      if (!panel.hidden || document.querySelector('.mbg.open, .wl')) return;
      tip.hidden = false; tipT = setTimeout(function () { tipOff(true); }, 9000);
    }, 4000);
  })();
  $('#cbTipX').addEventListener('click', function (e) { e.stopPropagation(); tipOff(true); });
  tip.addEventListener('click', function () { tipOff(true); abrir(true); });

  function abrir(v) {
    if (v) tipOff(true);
    panel.hidden = !v;
    root.classList.toggle('open', v);
    fab.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v) { pintar(); setTimeout(function () { inp.focus(); }, 60); }
  }

  /* ---------- envío ---------- */
  function enviar(texto) {
    texto = String(texto || '').trim().slice(0, 500);
    if (!texto || ocupado) return;
    ocupado = true;
    msgs.push({ rol: 'user', texto: texto }); msgs = msgs.slice(-MAX_MSG); guardar();
    burbuja('user', esc(texto));
    pintarSug();
    inp.value = '';
    $('#cbSend').disabled = true;
    var esperando = burbuja('assistant', '<span class="cb-dots"><i></i><i></i><i></i></span><span class="cb-sr">' + esc(T('typing')) + '</span>', 'cb-wait');

    var base = (typeof API !== 'undefined' && API) ? API : '/api/v1/public';
    fetch(base + '/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        mensajes: msgs.map(function (m) { return { rol: m.rol, texto: m.texto, buscar: m.buscar || null }; }),
        idioma: idioma(), ciudades: ciudadesDelPortal()
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { st: r.status, j: j }; });
    }).then(function (x) {
      esperando.remove();
      if (x.j && x.j.ok && x.j.respuesta) {
        var m = { rol: 'assistant', texto: x.j.respuesta, buscar: null };
        var b = x.j.buscar && typeof x.j.buscar === 'object' ? x.j.buscar : null;
        if (b) {
          var r = buscarProps(b);
          m.buscar = b;
          if (r.length) { m.ids = r.slice(0, MAX_TARJ).map(function (p) { return p.id; }); m.total = r.length; }
          else m.texto = T('none');   // no hay coincidencias: no se deja la frase "estas son opciones"
        }
        msgs.push(m); msgs = msgs.slice(-MAX_MSG); guardar();
        burbuja('assistant', md(m.texto));
        if (m.ids) tarjetas(m);
      } else {
        /* no se guarda el error en la conversación: el visitante puede volver a intentar la misma pregunta */
        msgs.pop(); guardar();
        burbuja('assistant', esc(x.st === 429 || (x.j && x.j.limite) ? T('limit') : T('off')), 'cb-err');
      }
    }).catch(function () {
      esperando.remove(); msgs.pop(); guardar();
      burbuja('assistant', esc(T('net')), 'cb-err');
    }).then(function () {
      ocupado = false; $('#cbSend').disabled = false; inp.focus();
    });
  }

  /* ---------- eventos ---------- */
  fab.addEventListener('click', function () { abrir(panel.hidden); });
  $('#cbClose').addEventListener('click', function () { abrir(false); fab.focus(); });
  $('#cbReset').addEventListener('click', function () { msgs = []; guardar(); pintar(); inp.focus(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); enviar(inp.value); });
  body.addEventListener('click', function (e) {
    var c = e.target.closest('[data-pid]');
    if (c) { var id = c.getAttribute('data-pid'), p = listaP().find(function (x) { return String(x.id) === id; }); if (p) { abrir(false); openDetail(p.id); } return; }
    var a = e.target.closest('[data-all]');
    if (a) { var w = a.closest('.cb-cards'); if (w && w._m && w._m.buscar) { abrir(false); aplicarALista(w._m.buscar); } }
  });
  sug.addEventListener('click', function (e) {
    var b = e.target.closest('[data-q]'); if (!b) return;
    var q = SUG[+b.getAttribute('data-q')]; if (q) enviar(q[I()] || q[0]);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { abrir(false); fab.focus(); } });
  var sel = document.querySelector('#lang');
  if (sel) sel.addEventListener('change', function () {
    textos();
    var h = body.querySelector('[data-hello]'); if (h) h.textContent = T('hello');
  });

  cargar();
  textos();
})();
