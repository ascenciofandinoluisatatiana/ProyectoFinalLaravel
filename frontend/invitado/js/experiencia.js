/* ============ UMBRAL · invitado · EXPERIENCIA ============
   Todo lo que ayuda a que el invitado se enganche, confíe y vuelva:
     1) Filtros rápidos (un clic) y búsquedas guardadas
     2) Vistos recientemente
     3) Comparador de inmuebles (hasta 3)
     4) Estado vacío amable y fotos que aparecen con suavidad
     5) Barra de confianza, vendedores mejor calificados y preguntas frecuentes
     6) Barra inferior en celular y bienvenida para quien llega por primera vez
   Se arma desde aquí encima del HTML existente; no cambia la estructura de dashboard.html.
   Se carga después de comercial.js (usa window.render, window.filtered y window.openDetail ya definidos). */
(function () {
  'use strict';

  /* ---------- textos (es · en · pt · fr) ---------- */
  var TX = {
    q_park: ['Con parqueadero', 'With parking', 'Com garagem', 'Avec parking'],
    q_beds: ['3+ habitaciones', '3+ bedrooms', '3+ quartos', '3+ chambres'],
    q_ver: ['Verificadas', 'Verified', 'Verificados', 'Vérifiés'],
    q_cheap: ['Hasta $300 millones', 'Up to $300M', 'Até $300 milhões', "Jusqu'à 300 M$"],
    q_cheapr: ['Hasta $2 millones/mes', 'Up to $2M/month', 'Até $2 milhões/mês', "Jusqu'à 2 M$/mois"],
    qs_my: ['Mis búsquedas', 'My searches', 'Minhas buscas', 'Mes recherches'],
    qs_save: ['Guardar búsqueda', 'Save search', 'Salvar busca', 'Enregistrer'],
    qs_saved: ['Búsqueda guardada', 'Search saved', 'Busca salva', 'Recherche enregistrée'],
    qs_dup: ['Esa búsqueda ya estaba guardada', 'That search was already saved', 'Essa busca já estava salva', 'Cette recherche existe déjà'],
    qs_none: ['Aún no guardas búsquedas. Filtra y toca «Guardar búsqueda».', 'No saved searches yet. Filter and tap “Save search”.', 'Nenhuma busca salva. Filtre e toque em «Salvar busca».', 'Aucune recherche. Filtrez puis touchez « Enregistrer ».'],
    qs_del: ['Quitar', 'Remove', 'Remover', 'Retirer'],
    qs_all: ['Todo', 'All', 'Tudo', 'Tout'],
    up_to: ['hasta', 'up to', 'até', "jusqu'à"],
    rc_title: ['Vistos recientemente', 'Recently viewed', 'Vistos recentemente', 'Vus récemment'],
    rc_clear: ['Borrar', 'Clear', 'Limpar', 'Effacer'],
    cmp_btn: ['Comparar', 'Compare', 'Comparar', 'Comparer'],
    cmp_title: ['Comparar inmuebles', 'Compare properties', 'Comparar imóveis', 'Comparer les biens'],
    cmp_max: ['Puedes comparar hasta 3 inmuebles', 'You can compare up to 3 properties', 'Você pode comparar até 3 imóveis', "Vous pouvez comparer jusqu'à 3 biens"],
    cmp_min: ['Elige al menos 2 inmuebles', 'Pick at least 2 properties', 'Escolha pelo menos 2 imóveis', 'Choisissez au moins 2 biens'],
    cmp_clear: ['Vaciar', 'Clear', 'Limpar', 'Vider'],
    cmp_best: ['Mejor opción en esta fila', 'Best in this row', 'Melhor opção nesta linha', 'Meilleur de la ligne'],
    c_price: ['Precio', 'Price', 'Preço', 'Prix'],
    c_type: ['Tipo', 'Type', 'Tipo', 'Type'],
    c_loc: ['Ubicación', 'Location', 'Localização', 'Lieu'],
    c_beds: ['Habitaciones', 'Bedrooms', 'Quartos', 'Chambres'],
    c_baths: ['Baños', 'Bathrooms', 'Banheiros', 'Salles de bain'],
    c_park: ['Parqueaderos', 'Parking', 'Garagens', 'Parkings'],
    c_area: ['Área', 'Area', 'Área', 'Surface'],
    c_estrato: ['Estrato', 'Stratum', 'Estrato', 'Strate'],
    c_m2: ['Precio por m²', 'Price per m²', 'Preço por m²', 'Prix au m²'],
    c_seller: ['Vendedor', 'Seller', 'Vendedor', 'Vendeur'],
    em_title: ['No encontramos inmuebles con esos filtros', "We couldn't find properties with those filters", 'Não encontramos imóveis com esses filtros', 'Aucun bien ne correspond à ces filtres'],
    em_sub: ['Prueba quitando algún filtro o explora una de estas ciudades:', 'Try removing a filter or explore one of these cities:', 'Tente remover algum filtro ou explore uma destas cidades:', 'Essayez de retirer un filtre ou explorez ces villes :'],
    em_clear: ['Quitar filtros', 'Clear filters', 'Remover filtros', 'Retirer les filtres'],
    emf_title: ['Aún no tienes favoritos', 'No favorites yet', 'Você ainda não tem favoritos', 'Pas encore de favoris'],
    emf_sub: ['Toca el corazón de un inmueble para guardarlo aquí.', 'Tap the heart on a property to save it here.', 'Toque no coração de um imóvel para salvá-lo aqui.', 'Touchez le cœur d’un bien pour l’enregistrer ici.'],
    em_all: ['Ver todos los inmuebles', 'See all properties', 'Ver todos os imóveis', 'Voir tous les biens'],
    tr_ver: ['{n} vendedores verificados', '{n} verified sellers', '{n} vendedores verificados', '{n} vendeurs vérifiés'],
    tr_ver_s: ['Con documento verificado', 'With verified ID', 'Com documento verificado', "Pièce d'identité vérifiée"],
    tr_rv: ['Calificaciones reales', 'Real ratings', 'Avaliações reais', 'Avis réels'],
    tr_rv_s: ['Una reseña por dispositivo', 'One review per device', 'Uma avaliação por dispositivo', 'Un avis par appareil'],
    tr_ct: ['Contacto directo', 'Direct contact', 'Contato direto', 'Contact direct'],
    tr_ct_s: ['Llama o escribe al vendedor', 'Call or message the seller', 'Ligue ou escreva ao vendedor', 'Appelez ou écrivez au vendeur'],
    tr_pse: ['Pago seguro con PSE', 'Secure payment with PSE', 'Pagamento seguro com PSE', 'Paiement sécurisé PSE'],
    tr_pse_s: ['No guardamos datos bancarios', 'We do not store bank data', 'Não guardamos dados bancários', 'Aucune donnée bancaire stockée'],
    ft_title: ['Vendedores mejor calificados', 'Top-rated sellers', 'Vendedores mais bem avaliados', 'Vendeurs les mieux notés'],
    ft_sub: ['Conoce a quienes publican en UMBRAL', 'Meet who lists on UMBRAL', 'Conheça quem anuncia na UMBRAL', 'Découvrez ceux qui publient sur UMBRAL'],
    ft_see: ['Ver inmuebles', 'See properties', 'Ver imóveis', 'Voir les biens'],
    ft_n: ['{n} inmuebles', '{n} properties', '{n} imóveis', '{n} biens'],
    ft_n1: ['1 inmueble', '1 property', '1 imóvel', '1 bien'],
    ft_norv: ['Aún sin reseñas', 'No reviews yet', 'Sem avaliações ainda', "Pas encore d'avis"],
    ft_ver: ['Verificado', 'Verified', 'Verificado', 'Vérifié'],
    faq_title: ['Preguntas frecuentes', 'Frequently asked questions', 'Perguntas frequentes', 'Questions fréquentes'],
    faq1q: ['¿Necesito registrarme para ver inmuebles?', 'Do I need to sign up to browse?', 'Preciso me cadastrar para ver imóveis?', "Dois-je m'inscrire pour consulter ?"],
    faq1a: ['No. Puedes explorar, guardar favoritos y comparar sin cuenta. Solo necesitas registrarte si quieres vender o arrendar tu inmueble.', 'No. You can browse, save favorites and compare without an account. You only need to sign up if you want to sell or rent out a property.', 'Não. Você pode explorar, salvar favoritos e comparar sem conta. Só precisa se cadastrar para vender ou alugar um imóvel.', 'Non. Vous pouvez explorer, enregistrer des favoris et comparer sans compte. L’inscription n’est utile que pour vendre ou louer.'],
    faq2q: ['¿Qué significa «Verificado»?', 'What does “Verified” mean?', 'O que significa «Verificado»?', 'Que signifie « Vérifié » ?'],
    faq2a: ['Que el vendedor verificó su identidad con documento en UMBRAL. Además puedes leer las calificaciones de otros usuarios en cada inmueble.', 'The seller has verified their identity with an ID document on UMBRAL. You can also read other users’ ratings on each property.', 'O vendedor verificou sua identidade com documento na UMBRAL. Você também pode ler as avaliações de outros usuários em cada imóvel.', 'Le vendeur a vérifié son identité avec un document sur UMBRAL. Vous pouvez aussi lire les avis des autres utilisateurs.'],
    faq3q: ['¿Cómo contacto al vendedor?', 'How do I contact the seller?', 'Como entro em contato com o vendedor?', 'Comment contacter le vendeur ?'],
    faq3a: ['Abre «Ver detalles» en el inmueble: ahí puedes llamar al vendedor o dejarle tu mensaje en el formulario de contacto.', 'Open “Details” on the property: you can call the seller or leave a message in the contact form.', 'Abra «Ver detalhes» no imóvel: ali você pode ligar ao vendedor ou deixar sua mensagem no formulário.', 'Ouvrez « Détails » sur le bien : vous pouvez appeler le vendeur ou lui écrire via le formulaire.'],
    faq4q: ['¿Cómo funciona el pago con PSE?', 'How does PSE payment work?', 'Como funciona o pagamento com PSE?', 'Comment fonctionne le paiement PSE ?'],
    faq4a: ['Al tocar «Comprar» o «Arrendar» te llevamos al portal seguro de PSE. UMBRAL no almacena tus datos bancarios.', 'When you tap “Buy” or “Rent” we send you to the secure PSE portal. UMBRAL does not store your bank data.', 'Ao tocar em «Comprar» ou «Alugar» levamos você ao portal seguro do PSE. A UMBRAL não armazena seus dados bancários.', 'En touchant « Acheter » ou « Louer » vous passez par le portail sécurisé PSE. UMBRAL ne stocke aucune donnée bancaire.'],
    faq5q: ['¿Puedo calificar a un vendedor?', 'Can I rate a seller?', 'Posso avaliar um vendedor?', 'Puis-je noter un vendeur ?'],
    faq5a: ['Sí. En «Ver detalles» entra a la pestaña «Comentarios y calificación». Se permite una reseña por dispositivo para que las opiniones sean reales.', 'Yes. In “Details” open the “Comments & rating” tab. One review per device keeps opinions genuine.', 'Sim. Em «Ver detalhes» abra a aba «Comentários e avaliação». Uma avaliação por dispositivo mantém as opiniões reais.', 'Oui. Dans « Détails » ouvrez l’onglet « Commentaires et note ». Un avis par appareil garantit des avis authentiques.'],
    faq6q: ['¿Cómo publico mi inmueble?', 'How do I list my property?', 'Como publico meu imóvel?', 'Comment publier mon bien ?'],
    faq6a: ['Toca «Registrarme para vender» en el menú, crea tu cuenta de vendedor y publica. Tu inmueble tendrá su propia página que Google puede encontrar.', 'Tap “Sign up to sell” in the menu, create your seller account and publish. Your property gets its own page that Google can find.', 'Toque em «Cadastrar para vender» no menu, crie sua conta de vendedor e publique. Seu imóvel terá uma página própria que o Google pode encontrar.', 'Touchez « S’inscrire pour vendre » dans le menu, créez votre compte vendeur et publiez. Votre bien aura sa propre page indexable par Google.'],
    bn_all: ['Explorar', 'Explore', 'Explorar', 'Explorer'],
    bn_map: ['Mapa', 'Map', 'Mapa', 'Carte'],
    bn_fav: ['Favoritos', 'Favorites', 'Favoritos', 'Favoris'],
    bn_menu: ['Menú', 'Menu', 'Menu', 'Menu'],
    wl_title: ['Bienvenido a UMBRAL', 'Welcome to UMBRAL', 'Bem-vindo à UMBRAL', 'Bienvenue sur UMBRAL'],
    wl_sub: ['Tres pasos para encontrar tu próximo hogar', 'Three steps to find your next home', 'Três passos para encontrar seu próximo lar', 'Trois étapes pour trouver votre prochain foyer'],
    wl1: ['Busca', 'Search', 'Busque', 'Cherchez'],
    wl1s: ['Filtra por ciudad, tipo y precio.', 'Filter by city, type and price.', 'Filtre por cidade, tipo e preço.', 'Filtrez par ville, type et prix.'],
    wl2: ['Guarda y compara', 'Save and compare', 'Salve e compare', 'Enregistrez et comparez'],
    wl2s: ['Marca favoritos y míralos lado a lado.', 'Mark favorites and view them side by side.', 'Marque favoritos e veja lado a lado.', 'Marquez des favoris et comparez-les.'],
    wl3: ['Contacta', 'Get in touch', 'Entre em contato', 'Contactez'],
    wl3s: ['Llama al vendedor o déjale tu mensaje.', 'Call the seller or leave a message.', 'Ligue ao vendedor ou deixe uma mensagem.', 'Appelez le vendeur ou laissez un message.'],
    wl_go: ['Empezar a explorar', 'Start exploring', 'Começar a explorar', 'Commencer'],
    close: ['Cerrar', 'Close', 'Fechar', 'Fermer'],
    map_title: ['Mapa de propiedades', 'Property map', 'Mapa de imóveis', 'Carte des biens'],
    map_hint: ['Toca un marcador para ver el inmueble', 'Tap a marker to see the property', 'Toque num marcador para ver o imóvel', 'Touchez un repère pour voir le bien'],
    share_n: ['Compartir', 'Share', 'Compartilhar', 'Partager']
  };
  function X(k, v) {
    var i = Math.max(0, LANGS.indexOf(lang)), a = TX[k] || [k], s = a[i] || a[0];
    if (v) for (var n in v) s = s.split('{' + n + '}').join(v[n]);
    return s;
  }
  function H(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function J(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (_) { return def; } }
  function W(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } }
  function tipo(p) { return t('t_' + p.type); }

  /* ---------- filtros extra (parqueadero, verificadas) ---------- */
  S.park = false; S.ver = false;
  var filtered0 = window.filtered, activos0 = window.filtersActive;
  window.filtered = function () {
    var r = filtered0.apply(this, arguments);
    if (S.park) r = r.filter(function (p) { return p.park > 0; });
    if (S.ver) r = r.filter(function (p) { return p.ver; });
    return r;
  };
  window.filtersActive = function () { return !!(activos0.apply(this, arguments) || S.park || S.ver); };
  function hayFiltros() { return !!(window.filtersActive() || S.op !== 'all'); }

  /* ---------- estructura: se inserta alrededor del contenido existente ---------- */
  var hero = document.querySelector('.hero-shell') || document.querySelector('#hero');
  var resHead = document.querySelector('.res-head');
  var mapView = document.querySelector('#mapView');
  if (!hero || !resHead || !mapView) return;

  var confianza = H('<section class="trust" id="confianza" aria-label="UMBRAL">' +
    '<div class="tr-i"><span class="tr-ic"><i class="fa-solid fa-circle-check"></i></span><div><b id="trVer"></b><small data-xk="tr_ver_s"></small></div></div>' +
    '<div class="tr-i"><span class="tr-ic"><i class="fa-solid fa-star"></i></span><div><b data-xk="tr_rv"></b><small data-xk="tr_rv_s"></small></div></div>' +
    '<div class="tr-i"><span class="tr-ic"><i class="fa-solid fa-comments"></i></span><div><b data-xk="tr_ct"></b><small data-xk="tr_ct_s"></small></div></div>' +
    '<div class="tr-i"><span class="tr-ic"><i class="fa-solid fa-shield-halved"></i></span><div><b data-xk="tr_pse"></b><small data-xk="tr_pse_s"></small></div></div>' +
    '</section>');
  var rapidos = H('<section class="quick" id="rapidos"><div class="q-row" id="qRow"></div>' +
    '<div class="qs"><button type="button" class="qs-save" id="qsSave" hidden><i class="fa-regular fa-bookmark"></i><span data-xk="qs_save"></span></button>' +
    '<button type="button" class="qs-btn" id="qsBtn" aria-haspopup="true" aria-expanded="false"><i class="fa-solid fa-bookmark"></i><span data-xk="qs_my"></span><em id="qsN">0</em></button>' +
    '<div class="qs-panel" id="qsPanel" hidden></div></div></section>');
  var recientes = H('<section class="recent" id="recientes" hidden></section>');
  var destacados = H('<section class="feat" id="destacados" hidden></section>');
  var faq = H('<section class="faq" id="faq"><h3><i class="fa-regular fa-circle-question"></i><span data-xk="faq_title"></span></h3><div class="faq-list">' +
    [1, 2, 3, 4, 5, 6].map(function (n) { return '<details><summary data-xk="faq' + n + 'q"></summary><p data-xk="faq' + n + 'a"></p></details>'; }).join('') +
    '</div></section>');
  var tray = H('<div class="cmp-bar" id="cmpBar" hidden><div class="cmp-th" id="cmpTh"></div>' +
    '<button type="button" class="btn btn-primary btn-sm" id="cmpGo"><i class="fa-solid fa-code-compare"></i><span data-xk="cmp_btn"></span> <em id="cmpN"></em></button>' +
    '<button type="button" class="cmp-x" id="cmpClear" data-xt="cmp_clear"><i class="fa-solid fa-trash-can"></i></button></div>');
  var cmpModal = H('<div class="mbg" id="mCmp"><div class="modal"><button class="mclose" data-close data-xt="close"><i class="fa-solid fa-xmark"></i></button><div class="mbody"><h3 data-xk="cmp_title"></h3><div id="cmpBody"></div></div></div></div>');
  var bnav = H('<nav class="bnav" id="bnav" aria-label="UMBRAL">' +
    '<button type="button" data-bn="all"><i class="fa-solid fa-compass"></i><span data-xk="bn_all"></span></button>' +
    '<button type="button" data-bn="map"><i class="fa-solid fa-map-location-dot"></i><span data-xk="bn_map"></span></button>' +
    '<button type="button" data-bn="favs"><i class="fa-solid fa-heart"></i><span data-xk="bn_fav"></span><em id="bnFav" hidden></em></button>' +
    '<button type="button" data-bn="menu"><i class="fa-solid fa-bars"></i><span data-xk="bn_menu"></span></button></nav>');

  hero.insertAdjacentElement('afterend', rapidos);
  hero.insertAdjacentElement('afterend', confianza);
  resHead.insertAdjacentElement('beforebegin', recientes);
  mapView.insertAdjacentElement('afterend', destacados);
  destacados.insertAdjacentElement('afterend', faq);
  document.body.appendChild(tray);
  document.body.appendChild(cmpModal);
  document.body.appendChild(bnav);

  function traducir() {
    document.querySelectorAll('[data-xk]').forEach(function (n) { n.textContent = X(n.getAttribute('data-xk')); });
    document.querySelectorAll('[data-xt]').forEach(function (n) { var s = X(n.getAttribute('data-xt')); n.setAttribute('title', s); n.setAttribute('aria-label', s); });
    document.querySelectorAll('.cmp').forEach(function (n) { n.setAttribute('title', X('cmp_btn')); n.setAttribute('aria-label', X('cmp_btn')); });
    document.querySelectorAll('.sh-toggle').forEach(function (n) { n.setAttribute('title', X('share_n')); n.setAttribute('aria-label', X('share_n')); });
    var lg = document.querySelector('.wl'); if (lg) pintarBienvenida(lg);
    pintarFaqJsonLd();
  }

  /* ---------- 1) filtros rápidos ---------- */
  var QUICK = [
    { k: 'type:casa', ic: 'fa-house', lab: function () { return tipo({ type: 'casa' }); } },
    { k: 'type:apartamento', ic: 'fa-building', lab: function () { return tipo({ type: 'apartamento' }); } },
    { k: 'park', ic: 'fa-car', lab: function () { return X('q_park'); } },
    { k: 'beds', ic: 'fa-bed', lab: function () { return X('q_beds'); } },
    { k: 'cheap', ic: 'fa-piggy-bank', lab: function () { return X(S.op === 'arriendo' ? 'q_cheapr' : 'q_cheap'); } },
    { k: 'ver', ic: 'fa-circle-check', lab: function () { return X('q_ver'); } }
  ];
  function topeBarato() { return S.op === 'arriendo' ? 2000000 : 300000000; }
  function chipOn(k) {
    if (k.indexOf('type:') === 0) return S.type === k.slice(5);
    if (k === 'park') return S.park;
    if (k === 'beds') return String(S.beds) === '3';
    if (k === 'cheap') return +S.max === topeBarato();
    if (k === 'ver') return S.ver;
    return false;
  }
  var qRow = document.querySelector('#qRow');
  qRow.innerHTML = QUICK.map(function (q) {
    return '<button type="button" class="qchip" data-q="' + q.k + '" aria-pressed="false"><i class="fa-solid ' + q.ic + '"></i><span></span></button>';
  }).join('');
  function refrescarChips() {
    QUICK.forEach(function (q, i) {
      var b = qRow.children[i], on = chipOn(q.k), sp = b.querySelector('span'), tx = q.lab();
      if (sp.textContent !== tx) sp.textContent = tx;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    document.querySelector('#qsSave').hidden = !hayFiltros();
  }
  function sincronizarCampos() { // lleva el estado S a los campos visibles
    var q = document.querySelector('#q'), qh = document.querySelector('#qHero'), mx = document.querySelector('#fMax');
    if (q) q.value = S.q || ''; if (qh) qh.value = S.q || ''; if (mx) mx.value = S.max || '';
    document.querySelectorAll('.op').forEach(function (b) { b.classList.toggle('active', b.dataset.op === S.op); });
    buildFilters();
  }
  function aplicarChip(k) {
    var on = chipOn(k);
    if (k.indexOf('type:') === 0) S.type = on ? '' : k.slice(5);
    else if (k === 'park') S.park = !on;
    else if (k === 'beds') S.beds = on ? '' : '3';
    else if (k === 'cheap') S.max = on ? '' : String(topeBarato());
    else if (k === 'ver') S.ver = !on;
    S.showAll = false;
    sincronizarCampos(); render();
  }

  /* ---------- 1b) búsquedas guardadas ---------- */
  var KEYS = ['op', 'type', 'dept', 'city', 'barrio', 'max', 'beds', 'q', 'sort', 'park', 'ver'];
  var DEF = { op: 'all', type: '', dept: '', city: '', barrio: '', max: '', beds: '', q: '', sort: 'rel', park: false, ver: false };
  var panel = document.querySelector('#qsPanel');
  function guardadas() { return J('umbral_busquedas', []); }
  function etiqueta(b) {
    var a = [];
    if (b.op === 'venta') a.push(t('sale')); else if (b.op === 'arriendo') a.push(t('rental'));
    if (b.type) a.push(tipo({ type: b.type }));
    if (b.barrio) a.push(b.barrio);
    if (b.city) a.push(b.city); else if (b.dept) a.push(b.dept);
    if (b.beds) a.push(b.beds + '+ ' + t('f_beds').toLowerCase());
    if (b.max) a.push(X('up_to') + ' ' + cop(+b.max));
    if (b.park) a.push(X('q_park').toLowerCase());
    if (b.ver) a.push(X('q_ver').toLowerCase());
    if (b.q) a.push('“' + b.q + '”');
    return a.join(' · ') || X('qs_all');
  }
  function pintarPanel() {
    var l = guardadas();
    document.querySelector('#qsN').textContent = l.length;
    document.querySelector('#qsN').hidden = !l.length;
    panel.innerHTML = l.length ? l.map(function (b, i) {
      return '<div class="qs-it"><button type="button" class="qs-go" data-qs="' + i + '"><i class="fa-solid fa-magnifying-glass"></i><span>' + esc(etiqueta(b)) + '</span></button>' +
        '<button type="button" class="qs-del" data-qsdel="' + i + '" aria-label="' + X('qs_del') + '" title="' + X('qs_del') + '"><i class="fa-solid fa-xmark"></i></button></div>';
    }).join('') : '<p class="qs-none">' + X('qs_none') + '</p>';
  }
  function guardarBusqueda() {
    var snap = {}; KEYS.forEach(function (k) { snap[k] = S[k]; });
    var l = guardadas(), s = JSON.stringify(snap);
    if (l.some(function (b) { return JSON.stringify(b) === s; })) { toast(X('qs_dup')); return; }
    l.unshift(snap); W('umbral_busquedas', l.slice(0, 8));
    pintarPanel(); toast(X('qs_saved'));
  }
  function aplicarBusqueda(i) {
    var b = guardadas()[i]; if (!b) return;
    Object.assign(S, DEF, b, { favOnly: false, seller: null, showAll: false });
    sincronizarCampos(); render();
    panelAbrir(false);
    var c = document.querySelector('#cards'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function panelAbrir(on) {
    panel.hidden = !on; document.querySelector('#qsBtn').setAttribute('aria-expanded', String(on));
    if (on) pintarPanel();
  }

  /* ---------- 2) vistos recientemente ---------- */
  var VISTOS = J('umbral_vistos', []);
  var openDetail0 = window.openDetail;
  window.openDetail = function (id) {
    openDetail0.apply(this, arguments);
    VISTOS = [id].concat(VISTOS.filter(function (x) { return x !== id; })).slice(0, 8);
    W('umbral_vistos', VISTOS);
    pintarRecientes();
  };
  var ultRecientes = '';
  function pintarRecientes() {
    var l = VISTOS.map(function (id) { return P.find(function (p) { return p.id === id; }); }).filter(Boolean);
    var ver = l.length && S.view === 'cards' && !hayFiltros() && !S.favOnly;
    recientes.hidden = !ver;
    if (!ver) { ultRecientes = ''; return; }
    var h = '<div class="rc-head"><h4><i class="fa-regular fa-clock"></i>' + X('rc_title') + '</h4><button type="button" class="rc-clear" id="rcClear">' + X('rc_clear') + '</button></div><div class="rc-track">' +
      l.map(function (p) {
        return '<button type="button" class="rc-it" data-open="' + p.id + '"><span class="rc-ph" style="' + imgStyle(p) + '">' + icon(p) + '</span>' +
          '<span class="rc-tx"><b>' + cop(p.price) + (p.op === 'arriendo' ? '<small>' + t('per_month') + '</small>' : '') + '</b><span>' + esc(title(p)) + '</span><small>' + esc(p.city) + '</small></span></button>';
      }).join('') + '</div>';
    if (h !== ultRecientes) { recientes.innerHTML = h; ultRecientes = h; }
  }

  /* ---------- 3) comparador ---------- */
  var CMP = [];
  function marcarCmp() {
    document.querySelectorAll('.cmp').forEach(function (b) {
      var on = CMP.indexOf(+b.dataset.cmp) >= 0;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    tray.hidden = !CMP.length;
    document.body.classList.toggle('has-cmp', CMP.length > 0);
    document.querySelector('#cmpN').textContent = '(' + CMP.length + ')';
    document.querySelector('#cmpGo').disabled = CMP.length < 2;
    document.querySelector('#cmpTh').innerHTML = CMP.map(function (id) {
      var p = P.find(function (x) { return x.id === id; }); if (!p) return '';
      return '<span class="cmp-it" style="' + imgStyle(p) + '" title="' + esc(title(p)) + '">' + icon(p) +
        '<button type="button" data-cmpx="' + id + '" aria-label="' + X('qs_del') + '"><i class="fa-solid fa-xmark"></i></button></span>';
    }).join('');
  }
  function alternarCmp(id) {
    var i = CMP.indexOf(id);
    if (i >= 0) CMP.splice(i, 1);
    else if (CMP.length >= 3) { toast(X('cmp_max')); return; }
    else CMP.push(id);
    marcarCmp();
    if (document.querySelector('#mCmp').classList.contains('open')) pintarCmp();
  }
  function pintarCmp() {
    var l = CMP.map(function (id) { return P.find(function (x) { return x.id === id; }); }).filter(Boolean);
    var body = document.querySelector('#cmpBody');
    if (l.length < 2) { body.innerHTML = '<p class="cmp-min">' + X('cmp_min') + '</p>'; return; }
    var mismaOp = l.every(function (p) { return p.op === l[0].op; });
    var m2 = function (p) { return p.area > 0 ? Math.round(p.price / p.area) : null; };
    var filas = [
      ['c_price', 'fa-tag', function (p) { return '<b class="cmp-price">' + cop(p.price) + '</b>' + (p.op === 'arriendo' ? '<small>' + t('per_month') + '</small>' : ''); }, mismaOp ? function (p) { return p.price; } : null, 'min'],
      ['c_type', 'fa-house', function (p) { return esc(tipo(p)) + ' · ' + t(p.op === 'arriendo' ? 'rental' : 'sale'); }],
      ['c_loc', 'fa-location-dot', function (p) { return esc(p.barrio) + '<small>' + esc(p.city) + '</small>'; }],
      ['c_beds', 'fa-bed', function (p) { return p.beds || '—'; }, function (p) { return p.beds || 0; }, 'max'],
      ['c_baths', 'fa-bath', function (p) { return p.baths || '—'; }, function (p) { return p.baths || 0; }, 'max'],
      ['c_park', 'fa-car', function (p) { return p.park || '—'; }, function (p) { return p.park || 0; }, 'max'],
      ['c_area', 'fa-ruler-combined', function (p) { return (p.area || 0).toLocaleString('es-CO') + ' ' + t('m2'); }, function (p) { return p.area || 0; }, 'max'],
      ['c_estrato', 'fa-layer-group', function (p) { return p.estrato || '—'; }],
      ['c_m2', 'fa-calculator', function (p) { return m2(p) ? cop(m2(p)) : '—'; }, mismaOp ? function (p) { return m2(p) || Infinity; } : null, 'min'],
      ['c_seller', 'fa-address-card', function (p) { var s = SELLERS[p.seller] || {}; return esc(s.name || '') + (s.reviews > 0 ? '<small><i class="fa-solid fa-star"></i> ' + Number(s.rating).toFixed(1) + ' (' + s.reviews + ')</small>' : ''); }]
    ];
    var cols = 'grid-template-columns:minmax(74px,.8fr) repeat(' + l.length + ',minmax(0,1.4fr))';
    var h = '<div class="cmp-grid"><div class="cmp-r cmp-top" style="' + cols + '"><span></span>' + l.map(function (p) {
      return '<div class="cmp-h"><span class="cmp-ph" style="' + imgStyle(p) + '">' + icon(p) + '</span><button type="button" class="cmp-rm" data-cmpx="' + p.id + '" aria-label="' + X('qs_del') + '"><i class="fa-solid fa-xmark"></i></button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-open="' + p.id + '"><i class="fa-solid fa-eye"></i>' + t('details') + '</button></div>';
    }).join('') + '</div>';
    filas.forEach(function (f) {
      var vals = f[3] ? l.map(f[3]) : null, best = null;
      if (vals) {
        best = f[4] === 'min' ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
        if (vals.every(function (v) { return v === vals[0]; })) best = null;
      }
      h += '<div class="cmp-r" style="' + cols + '"><span class="cmp-l"><i class="fa-solid ' + f[1] + '"></i>' + X(f[0]) + '</span>' +
        l.map(function (p, i) { return '<div class="cmp-c' + (best !== null && vals[i] === best ? ' best' : '') + '"' + (best !== null && vals[i] === best ? ' title="' + X('cmp_best') + '"' : '') + '>' + f[2](p) + '</div>'; }).join('') + '</div>';
    });
    body.innerHTML = h + '</div>';
  }

  /* ---------- 4) estado vacío amable + fotos que aparecen con suavidad ---------- */
  function pintarVacio() {
    var e = document.querySelector('#cards .empty'); if (!e || e.classList.contains('em2')) return;
    var sinFavs = S.favOnly && !favs.length;
    var ciudades = {}; P.forEach(function (p) { ciudades[p.city] = (ciudades[p.city] || 0) + 1; });
    var top = Object.keys(ciudades).sort(function (a, b) { return ciudades[b] - ciudades[a]; }).slice(0, 5);
    e.classList.add('em2');
    e.innerHTML = '<div class="em-ic"><i class="fa-solid ' + (sinFavs ? 'fa-heart' : 'fa-house-circle-xmark') + '"></i></div>' +
      '<h4>' + X(sinFavs ? 'emf_title' : 'em_title') + '</h4>' +
      '<p>' + X(sinFavs ? 'emf_sub' : 'em_sub') + '</p>' +
      (sinFavs ? '' : '<div class="em-cities">' + top.map(function (c) { return '<button type="button" class="qchip" data-xcity="' + esc(c) + '"><i class="fa-solid fa-location-dot"></i><span>' + esc(c) + '</span></button>'; }).join('') + '</div>') +
      '<button type="button" class="btn btn-primary btn-sm" data-xclear><i class="fa-solid ' + (sinFavs ? 'fa-compass' : 'fa-rotate-left') + '"></i>' + X(sinFavs ? 'em_all' : 'em_clear') + '</button>';
  }
  var cargadas = {};
  function precargar() {
    document.querySelectorAll('#cards .pimg').forEach(function (n) {
      if (n.dataset.ld) return;
      n.dataset.ld = '1';
      var m = /url\(["']?([^"')]+)["']?\)/.exec(n.getAttribute('style') || ''); if (!m) return;
      var u = m[1]; if (cargadas[u]) return;
      n.classList.add('img-wait');
      var im = new Image();
      im.onload = im.onerror = function () { cargadas[u] = 1; document.querySelectorAll('#cards .pimg.img-wait').forEach(function (x) { if ((x.getAttribute('style') || '').indexOf(u) >= 0) x.classList.remove('img-wait'); }); };
      im.src = u;
    });
  }

  /* ---------- 5) confianza + vendedores destacados ---------- */
  function pintarConfianza() {
    var n = SELLERS.filter(function (s) { return s.ver; }).length, el = document.querySelector('#trVer'), tx = X('tr_ver', { n: n });
    if (el.textContent !== tx) el.textContent = tx;
  }
  var ultDest = '';
  function pintarDestacados() {
    var ver = S.view === 'cards' && SELLERS.length > 0;
    destacados.hidden = !ver; if (!ver) return;
    var cnt = SELLERS.map(function (s, i) { return P.filter(function (p) { return p.seller === i; }).length; });
    var orden = SELLERS.map(function (s, i) { return i; }).filter(function (i) { return cnt[i] > 0; }).sort(function (a, b) {
      var sa = SELLERS[a], sb = SELLERS[b];
      var pa = (sa.reviews > 0 ? sa.rating * 20 + Math.min(sa.reviews, 20) : 0) + (sa.ver ? 10 : 0) + cnt[a];
      var pb = (sb.reviews > 0 ? sb.rating * 20 + Math.min(sb.reviews, 20) : 0) + (sb.ver ? 10 : 0) + cnt[b];
      return pb - pa;
    }).slice(0, 4);
    var h = '<div class="ft-head"><h3><i class="fa-solid fa-ranking-star"></i>' + X('ft_title') + '</h3><p>' + X('ft_sub') + '</p></div><div class="ft-grid">' +
      orden.map(function (i) {
        var s = SELLERS[i];
        var rv = s.reviews > 0 ? '<span class="ft-rv">' + RV.stars(s.rating, 'sm') + '<b>' + Number(s.rating).toFixed(1) + '</b><small>(' + s.reviews + ')</small></span>' : '<span class="ft-rv none">' + X('ft_norv') + '</span>';
        return '<article class="ft-c"><div class="ft-top"><div class="avatar">' + esc(s.ini || '') + '</div><div><b>' + esc(s.name) + '</b><small>' + t(s.kind === 'agency' ? 'agency' : 'person') + ' · ' + (cnt[i] === 1 ? X('ft_n1') : X('ft_n', { n: cnt[i] })) + '</small></div></div>' +
          rv + (s.ver ? '<span class="ft-ver"><i class="fa-solid fa-circle-check"></i>' + X('ft_ver') + '</span>' : '') +
          '<button type="button" class="btn btn-ghost btn-sm" data-seller="' + i + '"><i class="fa-solid fa-house"></i>' + X('ft_see') + '</button></article>';
      }).join('') + '</div>';
    if (h !== ultDest) { destacados.innerHTML = h; ultDest = h; }
  }
  function pintarFaqJsonLd() {
    var el = document.querySelector('script#faq-jsonld');
    if (!el) { el = document.createElement('script'); el.id = 'faq-jsonld'; el.type = 'application/ld+json'; document.head.appendChild(el); }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: [1, 2, 3, 4, 5, 6].map(function (n) { return { '@type': 'Question', name: X('faq' + n + 'q'), acceptedAnswer: { '@type': 'Answer', text: X('faq' + n + 'a') } }; })
    });
  }

  /* ---------- 6) barra inferior (celular) y bienvenida ---------- */
  function marcarBnav() {
    var act = S.view === 'map' ? 'map' : S.favOnly ? 'favs' : 'all';
    bnav.querySelectorAll('[data-bn]').forEach(function (b) { b.classList.toggle('on', b.dataset.bn === act); });
    var f = document.querySelector('#bnFav'); f.textContent = favs.length; f.hidden = !favs.length;
  }
  function irNav(n) { var a = document.querySelector('.sidebar [data-nav="' + n + '"]'); if (a) a.click(); }

  function pintarBienvenida(w) {
    w.innerHTML = '<div class="wl-card" role="dialog" aria-modal="true" aria-labelledby="wlT"><button type="button" class="wl-x" data-wlclose aria-label="' + X('close') + '"><i class="fa-solid fa-xmark"></i></button>' +
      '<img class="wl-logo" src="/img/icono.png" alt="" width="52" height="52">' +
      '<h2 id="wlT">' + X('wl_title') + '</h2><p class="wl-sub">' + X('wl_sub') + '</p><ol class="wl-steps">' +
      [['fa-magnifying-glass', 'wl1'], ['fa-heart', 'wl2'], ['fa-phone', 'wl3']].map(function (s, i) {
        return '<li><span class="wl-n"><i class="fa-solid ' + s[0] + '"></i></span><div><b>' + (i + 1) + '. ' + X(s[1]) + '</b><small>' + X(s[1] + 's') + '</small></div></li>';
      }).join('') + '</ol><button type="button" class="btn btn-primary" data-wlclose><i class="fa-solid fa-arrow-right"></i>' + X('wl_go') + '</button></div>';
  }
  function cerrarBienvenida() {
    var w = document.querySelector('.wl'); if (!w) return;
    w.classList.remove('show'); setTimeout(function () { w.remove(); }, 250);
    try { localStorage.setItem('umbral_bienvenida', '1'); } catch (_) { }
  }
  function mostrarBienvenida() {
    var vista = false; try { vista = localStorage.getItem('umbral_bienvenida') === '1'; } catch (_) { }
    if (vista || !/^\/inmuebles\/?$/.test(location.pathname) || location.search) return; // solo al entrar al listado (no estorba enlaces a un inmueble)
    var w = document.createElement('div'); w.className = 'wl'; pintarBienvenida(w);
    document.body.appendChild(w);
    requestAnimationFrame(function () { w.classList.add('show'); });
    var b = w.querySelector('.btn'); if (b) b.focus();
  }

  /* ---------- 7) mapa en ventana emergente (como la calculadora) ---------- */
  var mapModal = H('<div class="mbg" id="mMap"><div class="modal map-modal" role="dialog" aria-modal="true" aria-labelledby="mapT">' +
    '<button class="mclose" data-close data-xt="close"><i class="fa-solid fa-xmark"></i></button>' +
    '<div class="map-head"><h3 id="mapT"><i class="fa-solid fa-map-location-dot"></i><span data-xk="map_title"></span></h3>' +
    '<p><b id="mapN"></b> · <span data-xk="map_hint"></span></p></div><div class="map-body" id="mapBody"></div></div></div>');
  document.body.appendChild(mapModal);
  document.querySelector('#mapBody').appendChild(mapView); // el mismo #mapView de siempre, ahora dentro de la ventana
  function mapaAbierto() { return mapModal.classList.contains('open'); }
  function pintarMapa() {
    var r = window.filtered();
    document.querySelector('#mapN').textContent = r.length + ' ' + t('n_found');
    if (typeof L !== 'undefined') renderMap(r);
  }
  function abrirMapa() {
    openModal('#mMap'); pintarMapa();
    setTimeout(function () { if (map) map.invalidateSize(); }, 150);
  }
  var setView0 = window.setView;
  window.setView = function (v) {
    if (v === 'map') { abrirMapa(); return; }
    if (mapaAbierto()) window.closeModals();
    setView0.apply(this, arguments);
  };
  var closeModals1 = window.closeModals;
  window.closeModals = function () {
    var estaba = mapaAbierto();
    closeModals1.apply(this, arguments);
    if (estaba) { // al cerrar el mapa, el menú vuelve a marcar Explorar (o Favoritos)
      document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.toggle('active', a.dataset.nav === (S.favOnly ? 'favs' : 'all')); });
    }
  };

  /* ---------- eventos ---------- */
  function cerrarMenusCompartir(salvo) {
    document.querySelectorAll('.pshare.open').forEach(function (n) {
      if (n === salvo) return;
      n.classList.remove('open'); var b = n.querySelector('.sh-toggle'); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  /* en captura: los botones que están encima de la foto no deben abrir el detalle */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target : e.target.parentElement;
    var tg = el.closest('[data-shtoggle]');
    if (tg) {
      e.stopPropagation(); e.preventDefault();
      var box = tg.closest('.pshare'), on = !box.classList.contains('open');
      cerrarMenusCompartir(box); box.classList.toggle('open', on); tg.setAttribute('aria-expanded', String(on));
      return;
    }
    var cm = el.closest('[data-cmp]');
    if (cm) { e.stopPropagation(); e.preventDefault(); alternarCmp(+cm.dataset.cmp); return; }
    var cx = el.closest('[data-cmpx]');
    if (cx) { e.stopPropagation(); e.preventDefault(); alternarCmp(+cx.dataset.cmpx); if (!CMP.length) closeModals(); return; }
    if (!el.closest('.pshare')) cerrarMenusCompartir(null);
    else if (el.closest('[data-share]')) setTimeout(function () { cerrarMenusCompartir(null); }, 0);
  }, true);

  document.addEventListener('click', function (e) {
    var el = e.target, g = function (s) { return el.closest(s); }, x;
    if (!g('.qs')) panelAbrir(false); // un clic fuera del panel de búsquedas lo cierra
    if ((x = g('.qchip[data-q]'))) { aplicarChip(x.dataset.q); return; }
    if ((x = g('[data-xcity]'))) {
      var c = x.dataset.xcity, p = P.find(function (q) { return q.city === c; });
      Object.assign(S, DEF, { favOnly: false, seller: null, showAll: false });
      S.dept = p ? p.dept : ''; S.city = c; sincronizarCampos(); render(); return;
    }
    if (g('[data-xclear]')) { var cb = document.querySelector('#clearBtn'); if (cb) cb.click(); return; }
    if (g('#clearBtn')) { S.park = false; S.ver = false; render(); return; }
    if (g('#qsBtn')) { panelAbrir(panel.hidden); return; }
    if (g('#qsSave')) { guardarBusqueda(); return; }
    if ((x = g('[data-qs]'))) { aplicarBusqueda(+x.dataset.qs); return; }
    if ((x = g('[data-qsdel]'))) { var l = guardadas(); l.splice(+x.dataset.qsdel, 1); W('umbral_busquedas', l); pintarPanel(); return; }
    if (g('#rcClear')) { VISTOS = []; W('umbral_vistos', []); pintarRecientes(); return; }
    if (g('#cmpGo')) { pintarCmp(); openModal('#mCmp'); return; }
    if (g('#cmpClear')) { CMP = []; marcarCmp(); return; }
    if ((x = g('[data-bn]'))) {
      var n = x.dataset.bn;
      if (n === 'menu') { var mb = document.querySelector('#menuBtn'); if (mb) mb.click(); }
      else { irNav(n); if (n === 'all') window.scrollTo({ top: 0, behavior: 'smooth' }); }
      return;
    }
    if (g('[data-wlclose]')) { cerrarBienvenida(); return; }
    if (el.classList && el.classList.contains('wl')) cerrarBienvenida();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    cerrarMenusCompartir(null); panelAbrir(false); cerrarBienvenida();
  });

  /* ---------- engancharse a render() y al cambio de idioma ---------- */
  function post() {
    try {
      refrescarChips(); pintarRecientes(); pintarVacio(); pintarConfianza(); pintarDestacados();
      marcarCmp(); marcarBnav(); precargar();
      if (mapaAbierto()) pintarMapa();
      if (!panel.hidden) pintarPanel(); else { var n = guardadas().length, e = document.querySelector('#qsN'); e.textContent = n; e.hidden = !n; }
    } catch (err) { if (window.console) console.error('experiencia.js', err); }
  }
  var render0 = window.render;
  window.render = function () { try { render0.apply(this, arguments); } finally { post(); } };
  var lg = document.querySelector('#lang');
  if (lg) lg.addEventListener('change', function () { setTimeout(function () { traducir(); post(); }, 0); });

  traducir(); post();
  var espera = 0, iv = setInterval(function () {
    espera++;
    if (window.__loadDone || espera > 60) { clearInterval(iv); post(); setTimeout(mostrarBienvenida, 700); }
  }, 150);
})();
