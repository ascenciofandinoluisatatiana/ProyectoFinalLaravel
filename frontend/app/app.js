/* UMBRAL · app instalada (PWA). Pantallas de la app instalada:
   Inicio (Continuar explorando) → Idioma (Continuar) → Cómo continuar (invitado o personal).
   - 12 idiomas (los mismos del Inicio y el Invitado; solo el árabe va de derecha a izquierda).
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
    { c: 'ar', n: 'العربية', d: 'Árabe', b: '🇸🇦', dir: 'rtl' },
    { c: 'de', n: 'Deutsch', d: 'Alemán', b: '🇩🇪', dir: 'ltr' },
    { c: 'it', n: 'Italiano', d: 'Italiano', b: '🇮🇹', dir: 'ltr' },
    { c: 'zh', n: '中文', d: 'Chino', b: '🇨🇳', dir: 'ltr' },
    { c: 'ja', n: '日本語', d: 'Japonés', b: '🇯🇵', dir: 'ltr' },
    { c: 'ko', n: '한국어', d: 'Coreano', b: '🇰🇷', dir: 'ltr' },
    { c: 'ru', n: 'Русский', d: 'Ruso', b: '🇷🇺', dir: 'ltr' },
    { c: 'hi', n: 'हिन्दी', d: 'Hindi', b: '🇮🇳', dir: 'ltr' }
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
    },
    "de": {
      "slogan": "Der Schritt in ein neues Zuhause.",
      "headline": "Mehr als Immobilien,",
      "headline2": "neue Anfänge.",
      "intro": "Ausgewählte Häuser, Wohnungen und Landgüter in ganz Kolumbien, von Bogotá bis Cartagena.",
      "continueExplore": "Weiter erkunden",
      "chooseLanguage": "Wähle deine Sprache",
      "chooseLanguageSub": "Choose your language",
      "continue": "Weiter",
      "welcome": "Willkommen bei UMBRAL",
      "chooseProfile": "Wähle, wie du fortfahren möchtest.",
      "guest": "Immobilien entdecken",
      "guestDesc": "Entdecke Häuser, Wohnungen, Studios und Immobilien zum Kauf oder zur Miete. Du brauchst kein Konto.",
      "guestAction": "Als Gast fortfahren",
      "staff": "Zugang für Mitarbeiter",
      "staffDesc": "Für Immobilienmitarbeiter und autorisierte Verkäufer, die bereits ein Konto haben.",
      "haveAccount": "Ich habe bereits ein Konto",
      "note": "Finde den Ort, an dem deine nächste Geschichte beginnt.",
      "back": "Zurück",
      "login": "Anmelden",
      "noAccount": "Noch kein Konto?",
      "createAccount": "Konto erstellen"
    },
    "it": {
      "slogan": "Il passo verso una nuova casa.",
      "headline": "Più che immobili,",
      "headline2": "nuovi inizi.",
      "intro": "Case, appartamenti e tenute selezionati in tutta la Colombia, da Bogotá a Cartagena.",
      "continueExplore": "Continua a esplorare",
      "chooseLanguage": "Scegli la tua lingua",
      "chooseLanguageSub": "Choose your language",
      "continue": "Continua",
      "welcome": "Benvenuto in UMBRAL",
      "chooseProfile": "Scegli come vuoi continuare.",
      "guest": "Esplora gli immobili",
      "guestDesc": "Scopri case, appartamenti, monolocali e immobili in vendita o in affitto. Non serve un account.",
      "guestAction": "Continua come ospite",
      "staff": "Accesso per il personale",
      "staffDesc": "Per il personale delle agenzie e i venditori autorizzati che hanno già un account.",
      "haveAccount": "Ho già un account",
      "note": "Trova il luogo dove inizia la tua prossima storia.",
      "back": "Indietro",
      "login": "Accedi",
      "noAccount": "Non hai un account?",
      "createAccount": "Crea account"
    },
    "zh": {
      "slogan": "迈向新家的一步。",
      "headline": "不只是房产，",
      "headline2": "更是新的开始。",
      "intro": "精选哥伦比亚各地的房屋、公寓和庄园，从波哥大到卡塔赫纳。",
      "continueExplore": "继续探索",
      "chooseLanguage": "选择你的语言",
      "chooseLanguageSub": "Choose your language",
      "continue": "继续",
      "welcome": "欢迎来到 UMBRAL",
      "chooseProfile": "请选择你想如何继续。",
      "guest": "浏览房产",
      "guestDesc": "了解待售或出租的房屋、公寓、单间和其他房产。无需账户。",
      "guestAction": "以访客身份继续",
      "staff": "员工入口",
      "staffDesc": "适用于已有账户的房产机构员工和授权卖家。",
      "haveAccount": "我已有账户",
      "note": "找到你下一个故事开始的地方。",
      "back": "返回",
      "login": "登录",
      "noAccount": "还没有账户？",
      "createAccount": "创建账户"
    },
    "ja": {
      "slogan": "新しい家への一歩。",
      "headline": "物件以上の、",
      "headline2": "新しい始まり。",
      "intro": "ボゴタからカルタヘナまで、コロンビア各地の厳選された住宅、アパートメント、別荘をご紹介します。",
      "continueExplore": "探索を続ける",
      "chooseLanguage": "言語を選択",
      "chooseLanguageSub": "Choose your language",
      "continue": "続ける",
      "welcome": "UMBRALへようこそ",
      "chooseProfile": "続ける方法を選んでください。",
      "guest": "物件を探す",
      "guestDesc": "売買・賃貸の住宅、アパートメント、スタジオなどをご覧いただけます。アカウントは不要です。",
      "guestAction": "ゲストとして続ける",
      "staff": "スタッフ用ログイン",
      "staffDesc": "すでにアカウントをお持ちの不動産会社のスタッフおよび認定販売者向けです。",
      "haveAccount": "アカウントをお持ちの方",
      "note": "あなたの次の物語が始まる場所を見つけましょう。",
      "back": "戻る",
      "login": "ログイン",
      "noAccount": "アカウントをお持ちでないですか？",
      "createAccount": "アカウントを作成"
    },
    "ko": {
      "slogan": "새 집으로 가는 한 걸음.",
      "headline": "매물 그 이상,",
      "headline2": "새로운 시작.",
      "intro": "보고타에서 카르타헤나까지, 콜롬비아 전역의 엄선된 주택, 아파트, 별장을 만나보세요.",
      "continueExplore": "계속 둘러보기",
      "chooseLanguage": "언어를 선택하세요",
      "chooseLanguageSub": "Choose your language",
      "continue": "계속",
      "welcome": "UMBRAL에 오신 것을 환영합니다",
      "chooseProfile": "계속하는 방법을 선택하세요.",
      "guest": "매물 둘러보기",
      "guestDesc": "매매 또는 임대 중인 주택, 아파트, 원룸 등을 살펴보세요. 계정이 필요 없습니다.",
      "guestAction": "게스트로 계속",
      "staff": "직원 전용 로그인",
      "staffDesc": "이미 계정이 있는 부동산 직원 및 승인된 판매자용입니다.",
      "haveAccount": "이미 계정이 있어요",
      "note": "다음 이야기가 시작되는 곳을 찾아보세요.",
      "back": "뒤로",
      "login": "로그인",
      "noAccount": "계정이 없으신가요?",
      "createAccount": "계정 만들기"
    },
    "ru": {
      "slogan": "Шаг к новому дому.",
      "headline": "Больше, чем недвижимость,",
      "headline2": "новые начала.",
      "intro": "Отобранные дома, квартиры и усадьбы по всей Колумбии, от Боготы до Картахены.",
      "continueExplore": "Продолжить обзор",
      "chooseLanguage": "Выберите язык",
      "chooseLanguageSub": "Choose your language",
      "continue": "Продолжить",
      "welcome": "Добро пожаловать в UMBRAL",
      "chooseProfile": "Выберите, как вы хотите продолжить.",
      "guest": "Смотреть объекты",
      "guestDesc": "Знакомьтесь с домами, квартирами, студиями и объектами на продажу или в аренду. Аккаунт не нужен.",
      "guestAction": "Продолжить как гость",
      "staff": "Вход для сотрудников",
      "staffDesc": "Для сотрудников агентств недвижимости и авторизованных продавцов, у которых уже есть аккаунт.",
      "haveAccount": "У меня уже есть аккаунт",
      "note": "Найдите место, где начнётся ваша следующая история.",
      "back": "Назад",
      "login": "Войти",
      "noAccount": "Нет аккаунта?",
      "createAccount": "Создать аккаунт"
    },
    "hi": {
      "slogan": "नए घर की ओर एक कदम।",
      "headline": "संपत्तियों से बढ़कर,",
      "headline2": "नई शुरुआतें।",
      "intro": "बोगोटा से कार्टाजेना तक, पूरे कोलंबिया में चुने हुए घर, अपार्टमेंट और फ़ार्महाउस।",
      "continueExplore": "खोज जारी रखें",
      "chooseLanguage": "अपनी भाषा चुनें",
      "chooseLanguageSub": "Choose your language",
      "continue": "जारी रखें",
      "welcome": "UMBRAL में आपका स्वागत है",
      "chooseProfile": "चुनें कि आप कैसे आगे बढ़ना चाहते हैं।",
      "guest": "संपत्तियाँ देखें",
      "guestDesc": "बिक्री या किराये के लिए घर, अपार्टमेंट, स्टूडियो और अन्य संपत्तियाँ देखें। खाते की ज़रूरत नहीं।",
      "guestAction": "अतिथि के रूप में जारी रखें",
      "staff": "कर्मचारी प्रवेश",
      "staffDesc": "रियल एस्टेट कर्मचारियों और अधिकृत विक्रेताओं के लिए, जिनका पहले से खाता है।",
      "haveAccount": "मेरा पहले से खाता है",
      "note": "वह जगह खोजें जहाँ आपकी अगली कहानी शुरू होती है।",
      "back": "वापस",
      "login": "लॉग इन",
      "noAccount": "खाता नहीं है?",
      "createAccount": "खाता बनाएँ"
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
