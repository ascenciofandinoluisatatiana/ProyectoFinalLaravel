/* UMBRAL · app instalada (PWA). Mismo diseño y mismos textos que la app APK:
   Inicio (Continuar explorando) → Idioma (Continuar) → Cómo continuar (invitado o personal).
   - El idioma se guarda con la clave que ya usan Inicio e Invitado (umbral-idioma), solo cuando la persona lo elige.
   - El tema usa la clave de todo el sitio (umbral-tema). Por defecto: oscuro.
   - "Ya tengo una cuenta" lleva al login que ya existe (index.html?auth=login); ahí está "¿No tienes cuenta? Crear una cuenta". */
(function () {
  'use strict';
  var CLAVE_IDIOMA = 'umbral-idioma', CLAVE_TEMA = 'umbral-tema';
  var IDIOMAS = [
    { c: 'es', n: 'Español', d: 'Spanish', b: '🇨🇴', dir: 'ltr' },
    { c: 'en', n: 'English', d: 'Inglés', b: '🇬🇧', dir: 'ltr' },
    { c: 'fr', n: 'Français', d: 'Francés', b: '🇫🇷', dir: 'ltr' },
    { c: 'pt', n: 'Português', d: 'Portugués', b: '🇧🇷', dir: 'ltr' },
    { c: 'ar', n: 'العربية', d: 'Árabe', b: '🇸🇦', dir: 'rtl' }
  ];
  var T = {
    "es": {
      "slogan": "El paso hacia un nuevo hogar.",
      "headline": "Más que propiedades,",
      "headline2": "nuevos comienzos.",
      "intro": "Casas, apartamentos y fincas seleccionadas en toda Colombia, de Bogotá a Cartagena.",
      "continueExplore": "Continuar explorando",
      "chooseLanguage": "Elige tu idioma",
      "chooseLanguageSub": "Choose your language",
      "continue": "Continuar",
      "welcome": "Bienvenido a UMBRAL",
      "chooseProfile": "Elige cómo deseas continuar.",
      "guest": "Explorar propiedades",
      "guestDesc": "Conoce casas, apartamentos, apartaestudios y propiedades en venta o arriendo. No necesitas una cuenta.",
      "guestAction": "Continuar como invitado",
      "staff": "Acceso al personal",
      "staffDesc": "Para personal de la inmobiliaria y vendedores autorizados que ya tienen una cuenta.",
      "haveAccount": "Ya tengo una cuenta",
      "note": "Encuentra el lugar donde comienza tu próxima historia.",
      "back": "Volver",
      "login": "Iniciar sesión",
      "noAccount": "¿No tienes cuenta?",
      "createAccount": "Crear cuenta"
    },
    "en": {
      "slogan": "The step toward a new home.",
      "headline": "More than properties,",
      "headline2": "new beginnings.",
      "intro": "Selected houses, apartments and country homes across Colombia, from Bogotá to Cartagena.",
      "continueExplore": "Continue exploring",
      "chooseLanguage": "Choose your language",
      "chooseLanguageSub": "Choose your language",
      "continue": "Continue",
      "welcome": "Welcome to UMBRAL",
      "chooseProfile": "Choose how you would like to continue.",
      "guest": "Explore properties",
      "guestDesc": "Discover houses, apartments, studios and properties for sale or rent. No account needed.",
      "guestAction": "Continue as guest",
      "staff": "Staff access",
      "staffDesc": "For real estate staff and authorized sellers who already have an account.",
      "haveAccount": "I already have an account",
      "note": "Find the place where your next story begins.",
      "back": "Back",
      "login": "Sign in",
      "noAccount": "Don't have an account?",
      "createAccount": "Create account"
    },
    "fr": {
      "slogan": "Le chemin vers un nouveau chez-soi.",
      "headline": "Plus que des biens,",
      "headline2": "de nouveaux départs.",
      "intro": "Maisons, appartements et propriétés sélectionnés en Colombie, de Bogotá à Carthagène.",
      "continueExplore": "Continuer à explorer",
      "chooseLanguage": "Choisissez votre langue",
      "chooseLanguageSub": "Choose your language",
      "continue": "Continuer",
      "welcome": "Bienvenue chez UMBRAL",
      "chooseProfile": "Choisissez comment continuer.",
      "guest": "Explorer les propriétés",
      "guestDesc": "Découvrez des maisons, appartements et biens à vendre ou à louer. Aucun compte requis.",
      "guestAction": "Continuer comme invité",
      "staff": "Accès du personnel",
      "staffDesc": "Pour le personnel immobilier et les vendeurs autorisés disposant déjà d’un compte.",
      "haveAccount": "J’ai déjà un compte",
      "note": "Trouvez le lieu où commence votre prochaine histoire.",
      "back": "Retour",
      "login": "Se connecter",
      "noAccount": "Vous n’avez pas de compte ?",
      "createAccount": "Créer un compte"
    },
    "pt": {
      "slogan": "O caminho para um novo lar.",
      "headline": "Mais que imóveis,",
      "headline2": "novos começos.",
      "intro": "Casas, apartamentos e sítios selecionados na Colômbia, de Bogotá a Cartagena.",
      "continueExplore": "Continuar explorando",
      "chooseLanguage": "Escolha seu idioma",
      "chooseLanguageSub": "Choose your language",
      "continue": "Continuar",
      "welcome": "Bem-vindo à UMBRAL",
      "chooseProfile": "Escolha como deseja continuar.",
      "guest": "Explorar imóveis",
      "guestDesc": "Conheça casas, apartamentos e imóveis à venda ou para alugar. Não precisa de conta.",
      "guestAction": "Continuar como visitante",
      "staff": "Acesso da equipe",
      "staffDesc": "Para funcionários imobiliários e vendedores autorizados que já possuem uma conta.",
      "haveAccount": "Já tenho uma conta",
      "note": "Encontre o lugar onde começa sua próxima história.",
      "back": "Voltar",
      "login": "Entrar",
      "noAccount": "Não tem uma conta?",
      "createAccount": "Criar conta"
    },
    "ar": {
      "slogan": "الخطوة نحو منزل جديد.",
      "headline": "أكثر من مجرد عقارات،",
      "headline2": "بدايات جديدة.",
      "intro": "منازل وشقق وعقارات مختارة في كولومبيا، من بوغوتا إلى قرطاجنة.",
      "continueExplore": "متابعة الاستكشاف",
      "chooseLanguage": "اختر لغتك",
      "chooseLanguageSub": "اختر لغتك",
      "continue": "متابعة",
      "welcome": "مرحبًا بك في UMBRAL",
      "chooseProfile": "اختر كيف تريد المتابعة.",
      "guest": "استكشاف العقارات",
      "guestDesc": "اكتشف المنازل والشقق والعقارات للبيع أو للإيجار. لا تحتاج إلى حساب.",
      "guestAction": "المتابعة كزائر",
      "staff": "دخول الموظفين",
      "staffDesc": "لموظفي العقارات والبائعين المعتمدين الذين لديهم حساب بالفعل.",
      "haveAccount": "لدي حساب بالفعل",
      "note": "اعثر على المكان الذي تبدأ فيه قصتك القادمة.",
      "back": "رجوع",
      "login": "تسجيل الدخول",
      "noAccount": "ليس لديك حساب؟",
      "createAccount": "إنشاء حساب"
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var raiz = document.documentElement;
  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function valido(c) { return IDIOMAS.some(function (i) { return i.c === c; }); }

  var guardado = leer(CLAVE_IDIOMA) || leer('umbral_lang');
  var nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  var idioma = valido(guardado) ? guardado : (valido(nav) ? nav : 'es');
  var pantalla = 'inicio';
  try { sessionStorage.setItem('umbral-app', '1'); } catch (e) {}   // las demás páginas saben que se entró desde la app

  function pintar() {
    var t = T[idioma], info = IDIOMAS.filter(function (i) { return i.c === idioma; })[0];
    raiz.lang = idioma; raiz.dir = info.dir;
    var textos = { 'x-slogan': 'slogan', 'x-headline': 'headline', 'x-headline2': 'headline2', 'x-intro': 'intro', 'b-explorar': 'continueExplore',
      't-idioma': 'chooseLanguage', 'x-idioma-sub': 'chooseLanguageSub', 'b-continuar': 'continue',
      't-acceso': 'welcome', 'x-acceso-sub': 'chooseProfile', 'x-invitado': 'guest', 'x-invitado-d': 'guestDesc', 'x-invitado-a': 'guestAction',
      'x-personal': 'staff', 'x-personal-d': 'staffDesc', 'x-personal-a': 'haveAccount', 'x-nota': 'note' };
    Object.keys(textos).forEach(function (id) { $(id).textContent = t[textos[id]]; });
    document.querySelectorAll('[data-volver]').forEach(function (b) { b.setAttribute('aria-label', t.back); });
    document.querySelectorAll('.tarjeta-idioma').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.c === idioma ? 'true' : 'false'); b.classList.toggle('sel', b.dataset.c === idioma); b.querySelector('.marca-sel').textContent = b.dataset.c === idioma ? '●' : '○'; });
  }

  function construirIdiomas() {
    var caja = $('lista-idiomas');
    IDIOMAS.forEach(function (i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tarjeta-idioma'; b.dataset.c = i.c; b.setAttribute('role', 'radio');
      b.innerHTML = '<span class="bandera"></span><span class="textos-idioma"><span class="nombre-idioma"></span><span class="detalle-idioma"></span></span><span class="marca-sel"></span>';
      b.querySelector('.bandera').textContent = i.b; b.querySelector('.nombre-idioma').textContent = i.n; b.querySelector('.detalle-idioma').textContent = i.d;
      b.addEventListener('click', function () { idioma = i.c; guardar(CLAVE_IDIOMA, i.c); pintar(); });
      caja.appendChild(b);
    });
  }

  function ir(nombre, empujar) {
    ['inicio', 'idioma', 'acceso'].forEach(function (p) { $('p-' + p).hidden = (p !== nombre); });
    pantalla = nombre;
    window.scrollTo(0, 0);
    if (empujar) { try { history.pushState({ umbralApp: nombre }, ''); } catch (e) {} }
  }
  function atras() { ir({ idioma: 'inicio', acceso: 'idioma' }[pantalla] || 'inicio', false); }

  function colocarTema(t) {
    raiz.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = (t === 'light') ? '#F8F7FF' : '#140826';
  }
  document.querySelectorAll('[data-modo]').forEach(function (b) {
    b.addEventListener('click', function () {
      var nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      colocarTema(nuevo); guardar(CLAVE_TEMA, nuevo);
    });
  });
  colocarTema(raiz.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  $('b-explorar').addEventListener('click', function () { ir('idioma', true); });
  $('b-continuar').addEventListener('click', function () { guardar(CLAVE_IDIOMA, idioma); ir('acceso', true); });
  document.querySelectorAll('[data-volver]').forEach(function (b) {
    b.addEventListener('click', function () { if (history.state && history.state.umbralApp) history.back(); else atras(); });
  });
  window.addEventListener('popstate', function (e) { ir((e.state && e.state.umbralApp) || 'inicio', false); });

  // Sincroniza el tema si cambió desde otra sección (invitado, login...) y la persona vuelve con "atrás"
  function sincronizarTema() {
    var t = leer(CLAVE_TEMA);
    if ((t === 'dark' || t === 'light') && raiz.getAttribute('data-theme') !== t) colocarTema(t);
  }
  window.addEventListener('pageshow', sincronizarTema);
  window.addEventListener('storage', function (e) { if (e.key === CLAVE_TEMA) sincronizarTema(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sincronizarTema(); });

  construirIdiomas(); pintar();
  // ?p=acceso: se abre directo en "cómo continuar" (así la flecha de atrás del login vuelve ahí)
  var abrirEn = /[?&]p=(idioma|acceso)\b/.exec(location.search);
  ir(abrirEn ? abrirEn[1] : 'inicio', false);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();
