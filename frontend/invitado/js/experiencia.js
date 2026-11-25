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
    q_park: ['Con parqueadero', 'With parking', 'Com garagem', 'Avec parking', 'مع موقف سيارات', 'Mit Parkplatz', 'Con parcheggio', '有停车位', '駐車場あり', '주차 가능', 'С парковкой', 'पार्किंग के साथ'],
    q_beds: ['3+ habitaciones', '3+ bedrooms', '3+ quartos', '3+ chambres', '3 غرف نوم أو أكثر', '3+ Schlafzimmer', '3+ camere', '3 间以上卧室', '寝室3室以上', '침실 3개 이상', '3+ спальни', '3+ बेडरूम'],
    q_ver: ['Verificadas', 'Verified', 'Verificados', 'Vérifiés', 'موثّق', 'Geprüft', 'Verificati', '已验证', '確認済み', '인증됨', 'Проверенные', 'सत्यापित'],
    q_cheap: ['Hasta $300 millones', 'Up to $300M', 'Até $300 milhões', "Jusqu'à 300 M$", 'حتى 300 مليون', 'Bis 300 Mio.', 'Fino a 300 mln', '3 亿以内', '3億まで', '3억 이하', 'До 300 млн', '30 करोड़ तक'],
    q_cheapr: ['Hasta $2 millones/mes', 'Up to $2M/month', 'Até $2 milhões/mês', "Jusqu'à 2 M$/mois", 'حتى 2 مليون/شهريًا', 'Bis 2 Mio./Monat', 'Fino a 2 mln/mese', '每月 200 万以内', '月200万まで', '월 200만 이하', 'До 2 млн/мес.', '20 लाख/माह तक'],
    qs_my: ['Mis búsquedas', 'My searches', 'Minhas buscas', 'Mes recherches', 'عمليات بحثي', 'Meine Suchen', 'Le mie ricerche', '我的搜索', '保存した検索', '내 검색', 'Мои поиски', 'मेरी खोजें'],
    qs_save: ['Guardar búsqueda', 'Save search', 'Salvar busca', 'Enregistrer', 'حفظ البحث', 'Suche speichern', 'Salva ricerca', '保存搜索', '検索を保存', '검색 저장', 'Сохранить поиск', 'खोज सहेजें'],
    qs_saved: ['Búsqueda guardada', 'Search saved', 'Busca salva', 'Recherche enregistrée', 'تم حفظ البحث', 'Suche gespeichert', 'Ricerca salvata', '搜索已保存', '検索を保存しました', '검색을 저장했습니다', 'Поиск сохранён', 'खोज सहेजी गई'],
    qs_dup: ['Esa búsqueda ya estaba guardada', 'That search was already saved', 'Essa busca já estava salva', 'Cette recherche existe déjà', 'هذا البحث محفوظ بالفعل', 'Diese Suche ist bereits gespeichert', 'Hai già salvato questa ricerca', '你已保存过此搜索', 'この検索はすでに保存されています', '이미 저장한 검색입니다', 'Этот поиск уже сохранён', 'यह खोज पहले से सहेजी हुई है'],
    qs_none: ['Aún no guardas búsquedas. Filtra y toca «Guardar búsqueda».', 'No saved searches yet. Filter and tap “Save search”.', 'Nenhuma busca salva. Filtre e toque em «Salvar busca».', 'Aucune recherche. Filtrez puis touchez « Enregistrer ».', 'لا توجد عمليات بحث محفوظة بعد. استخدم الفلاتر واضغط «حفظ البحث».', 'Noch keine gespeicherten Suchen. Filtere und tippe auf „Suche speichern“.', 'Ancora nessuna ricerca salvata. Filtra e tocca «Salva ricerca».', '暂无保存的搜索。设置筛选后点击“保存搜索”。', '保存した検索はまだありません。絞り込んで「検索を保存」をタップしてください。', '저장한 검색이 아직 없습니다. 필터를 설정하고 \'검색 저장\'을 누르세요.', 'Сохранённых поисков пока нет. Настройте фильтры и нажмите «Сохранить поиск».', 'अभी कोई सहेजी गई खोज नहीं। फ़िल्टर लगाएँ और “खोज सहेजें” दबाएँ।'],
    qs_del: ['Quitar', 'Remove', 'Remover', 'Retirer', 'حذف', 'Entfernen', 'Rimuovi', '删除', '削除', '삭제', 'Удалить', 'हटाएँ'],
    qs_all: ['Todo', 'All', 'Tudo', 'Tout', 'الكل', 'Alle', 'Tutti', '全部', 'すべて', '전체', 'Все', 'सभी'],
    up_to: ['hasta', 'up to', 'até', "jusqu'à", 'حتى', 'bis', 'fino a', '至', 'まで', '최대', 'до', 'तक'],
    rc_title: ['Vistos recientemente', 'Recently viewed', 'Vistos recentemente', 'Vus récemment', 'شوهدت مؤخرًا', 'Zuletzt angesehen', 'Visti di recente', '最近浏览', '最近見た物件', '최근 본 매물', 'Недавно просмотренные', 'हाल ही में देखी गईं'],
    rc_clear: ['Borrar', 'Clear', 'Limpar', 'Effacer', 'مسح', 'Löschen', 'Cancella', '清除', '消去', '지우기', 'Очистить', 'साफ़ करें'],
    cmp_btn: ['Comparar', 'Compare', 'Comparar', 'Comparer', 'مقارنة', 'Vergleichen', 'Confronta', '比较', '比較', '비교', 'Сравнить', 'तुलना करें'],
    cmp_title: ['Comparar inmuebles', 'Compare properties', 'Comparar imóveis', 'Comparer les biens', 'مقارنة العقارات', 'Immobilien vergleichen', 'Confronta immobili', '比较房产', '物件を比較', '매물 비교', 'Сравнение объектов', 'संपत्तियों की तुलना'],
    cmp_max: ['Puedes comparar hasta 3 inmuebles', 'You can compare up to 3 properties', 'Você pode comparar até 3 imóveis', "Vous pouvez comparer jusqu'à 3 biens", 'يمكنك مقارنة 3 عقارات كحد أقصى', 'Du kannst bis zu 3 Immobilien vergleichen', 'Puoi confrontare fino a 3 immobili', '最多可比较 3 套房产', '最大3件まで比較できます', '최대 3개까지 비교할 수 있습니다', 'Можно сравнить до 3 объектов', 'आप अधिकतम 3 संपत्तियों की तुलना कर सकते हैं'],
    cmp_min: ['Elige al menos 2 inmuebles', 'Pick at least 2 properties', 'Escolha pelo menos 2 imóveis', 'Choisissez au moins 2 biens', 'اختر عقارين على الأقل', 'Wähle mindestens 2 Immobilien', 'Scegli almeno 2 immobili', '请至少选择 2 套房产', '2件以上選んでください', '2개 이상 선택하세요', 'Выберите не менее 2 объектов', 'कम से कम 2 संपत्तियाँ चुनें'],
    cmp_clear: ['Vaciar', 'Clear', 'Limpar', 'Vider', 'مسح', 'Zurücksetzen', 'Azzera', '清除', 'クリア', '초기화', 'Сбросить', 'साफ़ करें'],
    cmp_best: ['Mejor opción en esta fila', 'Best in this row', 'Melhor opção nesta linha', 'Meilleur de la ligne', 'الأفضل في هذا الصف', 'Bester Wert in dieser Zeile', 'Miglior valore in questa riga', '本行最佳值', 'この行の最良値', '이 행의 최고 값', 'Лучшее значение в строке', 'इस पंक्ति का सबसे अच्छा मान'],
    c_price: ['Precio', 'Price', 'Preço', 'Prix', 'السعر', 'Preis', 'Prezzo', '价格', '価格', '가격', 'Цена', 'कीमत'],
    c_type: ['Tipo', 'Type', 'Tipo', 'Type', 'النوع', 'Art', 'Tipo', '类型', '種類', '유형', 'Тип', 'प्रकार'],
    c_loc: ['Ubicación', 'Location', 'Localização', 'Lieu', 'الموقع', 'Lage', 'Posizione', '位置', '所在地', '위치', 'Расположение', 'स्थान'],
    c_beds: ['Habitaciones', 'Bedrooms', 'Quartos', 'Chambres', 'غرف النوم', 'Schlafzimmer', 'Camere', '卧室', '寝室', '침실', 'Спальни', 'बेडरूम'],
    c_baths: ['Baños', 'Bathrooms', 'Banheiros', 'Salles de bain', 'الحمّامات', 'Bäder', 'Bagni', '浴室', '浴室', '욕실', 'Ванные', 'बाथरूम'],
    c_park: ['Parqueaderos', 'Parking', 'Garagens', 'Parkings', 'مواقف السيارات', 'Parkplätze', 'Parcheggi', '停车位', '駐車場', '주차', 'Парковка', 'पार्किंग'],
    c_area: ['Área', 'Area', 'Área', 'Surface', 'المساحة', 'Fläche', 'Superficie', '面积', '面積', '면적', 'Площадь', 'क्षेत्रफल'],
    c_estrato: ['Estrato', 'Stratum', 'Estrato', 'Strate', 'الطبقة', 'Schicht', 'Fascia', '等级', '階層', '등급', 'Уровень', 'श्रेणी'],
    c_m2: ['Precio por m²', 'Price per m²', 'Preço por m²', 'Prix au m²', 'السعر لكل م²', 'Preis pro m²', 'Prezzo al m²', '每平方米价格', 'm² 単価', 'm²당 가격', 'Цена за м²', 'प्रति m² कीमत'],
    c_seller: ['Vendedor', 'Seller', 'Vendedor', 'Vendeur', 'البائع', 'Verkäufer', 'Venditore', '卖家', '売主', '판매자', 'Продавец', 'विक्रेता'],
    em_title: ['No encontramos inmuebles con esos filtros', "We couldn't find properties with those filters", 'Não encontramos imóveis com esses filtros', 'Aucun bien ne correspond à ces filtres', 'لم نجد عقارات بهذه الفلاتر', 'Wir haben keine Immobilien mit diesen Filtern gefunden', 'Non abbiamo trovato immobili con questi filtri', '没有找到符合这些筛选条件的房产', 'この条件に合う物件は見つかりませんでした', '이 필터에 맞는 매물을 찾지 못했습니다', 'Мы не нашли объектов с этими фильтрами', 'इन फ़िल्टर से कोई संपत्ति नहीं मिली'],
    em_sub: ['Prueba quitando algún filtro o explora una de estas ciudades:', 'Try removing a filter or explore one of these cities:', 'Tente remover algum filtro ou explore uma destas cidades:', 'Essayez de retirer un filtre ou explorez ces villes :', 'جرّب إزالة فلتر أو استكشف إحدى هذه المدن:', 'Entferne einen Filter oder entdecke eine dieser Städte:', 'Togli un filtro o esplora una di queste città:', '去掉一个筛选条件，或浏览以下城市：', '条件を一つ外すか、次の都市を探してみてください：', '필터를 하나 빼거나 다음 도시를 둘러보세요:', 'Уберите фильтр или посмотрите один из этих городов:', 'कोई फ़िल्टर हटाएँ या इनमें से कोई शहर देखें:'],
    em_clear: ['Quitar filtros', 'Clear filters', 'Remover filtros', 'Retirer les filtres', 'مسح الفلاتر', 'Filter zurücksetzen', 'Azzera filtri', '清除筛选', '条件をクリア', '필터 초기화', 'Сбросить фильтры', 'फ़िल्टर साफ़ करें'],
    emf_title: ['Aún no tienes favoritos', 'No favorites yet', 'Você ainda não tem favoritos', 'Pas encore de favoris', 'لا توجد مفضلات بعد', 'Noch keine Favoriten', 'Ancora nessun preferito', '暂无收藏', 'お気に入りはまだありません', '아직 즐겨찾기가 없습니다', 'В избранном пока пусто', 'अभी कोई पसंदीदा नहीं'],
    emf_sub: ['Toca el corazón de un inmueble para guardarlo aquí.', 'Tap the heart on a property to save it here.', 'Toque no coração de um imóvel para salvá-lo aqui.', 'Touchez le cœur d’un bien pour l’enregistrer ici.', 'اضغط على القلب في أي عقار لحفظه هنا.', 'Tippe auf das Herz einer Immobilie, um sie hier zu speichern.', 'Tocca il cuore di un immobile per salvarlo qui.', '点击房产上的爱心即可保存到这里。', '物件のハートをタップするとここに保存されます。', '매물의 하트를 누르면 여기에 저장됩니다.', 'Нажмите на сердечко объекта, чтобы сохранить его здесь.', 'किसी संपत्ति के दिल पर टैप करें ताकि वह यहाँ सहेजी जाए।'],
    em_all: ['Ver todos los inmuebles', 'See all properties', 'Ver todos os imóveis', 'Voir tous les biens', 'عرض كل العقارات', 'Alle Immobilien ansehen', 'Vedi tutti gli immobili', '查看全部房产', 'すべての物件を見る', '모든 매물 보기', 'Все объекты', 'सभी संपत्तियाँ देखें'],
    tr_ver: ['{n} vendedores verificados', '{n} verified sellers', '{n} vendedores verificados', '{n} vendeurs vérifiés', '{n} بائعين موثّقين', '{n} geprüfte Verkäufer', '{n} venditori verificati', '{n} 位已验证卖家', '確認済みの売主 {n} 人', '인증된 판매자 {n}명', 'Проверенных продавцов: {n}', '{n} सत्यापित विक्रेता'],
    tr_ver_s: ['Con documento verificado', 'With verified ID', 'Com documento verificado', "Pièce d'identité vérifiée", 'بهوية موثّقة', 'Mit geprüftem Ausweis', 'Con documento convalidato', '证件已核验', '身分証で確認済み', '신분증 확인 완료', 'С подтверждённым документом', 'पहचान दस्तावेज़ जाँचा गया'],
    tr_rv: ['Calificaciones reales', 'Real ratings', 'Avaliações reais', 'Avis réels', 'تقييمات حقيقية', 'Echte Bewertungen', 'Valutazioni reali', '真实评价', '本物の評価', '실제 평가', 'Реальные оценки', 'असली रेटिंग'],
    tr_rv_s: ['Una reseña por dispositivo', 'One review per device', 'Uma avaliação por dispositivo', 'Un avis par appareil', 'تقييم واحد لكل جهاز', 'Eine Bewertung pro Gerät', 'Una valutazione per dispositivo', '每台设备一条评价', '1台につき1件の評価', '기기당 평가 1개', 'Одна оценка с устройства', 'प्रति डिवाइस एक रेटिंग'],
    tr_ct: ['Contacto directo', 'Direct contact', 'Contato direto', 'Contact direct', 'تواصل مباشر', 'Direkter Kontakt', 'Contatto diretto', '直接联系', '直接連絡', '직접 연락', 'Прямой контакт', 'सीधा संपर्क'],
    tr_ct_s: ['Llama o escribe al vendedor', 'Call or message the seller', 'Ligue ou escreva ao vendedor', 'Appelez ou écrivez au vendeur', 'اتصل بالبائع أو راسله', 'Ruf den Verkäufer an oder schreib ihm', 'Chiama o scrivi al venditore', '致电或给卖家留言', '売主に電話またはメッセージ', '판매자에게 전화하거나 메시지 보내기', 'Позвоните или напишите продавцу', 'विक्रेता को कॉल करें या लिखें'],
    tr_free: ['Gratis para ti', 'Free for you', 'Grátis para você', 'Gratuit pour vous', 'مجاني لك', 'Kostenlos für dich', 'Gratis per te', '对你免费', '無料で利用', '무료 이용', 'Бесплатно для вас', 'आपके लिए मुफ़्त'],
    tr_free_s: ['Explora y contacta sin costo', 'Browse and get in touch at no cost', 'Explore e entre em contato sem custo', 'Explorez et contactez sans frais', 'تصفّح وتواصل دون تكلفة', 'Stöbern und Kontakt ohne Kosten', 'Navighi e contatti senza costi', '浏览和联系均不收费', '閲覧も問い合わせも無料', '둘러보기와 문의 모두 무료', 'Просмотр и связь без оплаты', 'देखना और संपर्क करना बिना शुल्क'],
    ft_title: ['Vendedores mejor calificados', 'Top-rated sellers', 'Vendedores mais bem avaliados', 'Vendeurs les mieux notés', 'البائعون الأعلى تقييمًا', 'Bestbewertete Verkäufer', 'Venditori più votati', '评分最高的卖家', '評価の高い売主', '평점 높은 판매자', 'Продавцы с лучшими оценками', 'सबसे अच्छी रेटिंग वाले विक्रेता'],
    ft_sub: ['Conoce a quienes publican en UMBRAL', 'Meet who lists on UMBRAL', 'Conheça quem anuncia na UMBRAL', 'Découvrez ceux qui publient sur UMBRAL', 'تعرّف على من ينشر في UMBRAL', 'Lerne kennen, wer auf UMBRAL inseriert', 'Scopri chi pubblica su UMBRAL', '认识在 UMBRAL 发布房源的人', 'UMBRAL に掲載している人たち', 'UMBRAL에 매물을 올리는 사람들', 'Познакомьтесь с теми, кто размещает объекты на UMBRAL', 'जानें कि UMBRAL पर कौन विज्ञापन देता है'],
    ft_see: ['Ver inmuebles', 'See properties', 'Ver imóveis', 'Voir les biens', 'عرض العقارات', 'Immobilien ansehen', 'Vedi immobili', '查看房产', '物件を見る', '매물 보기', 'Смотреть объекты', 'संपत्तियाँ देखें'],
    ft_n: ['{n} inmuebles', '{n} properties', '{n} imóveis', '{n} biens', '{n} عقارات', '{n} Immobilien', '{n} immobili', '{n} 套房产', '{n} 件の物件', '매물 {n}개', 'Объектов: {n}', '{n} संपत्तियाँ'],
    ft_n1: ['1 inmueble', '1 property', '1 imóvel', '1 bien', 'عقار واحد', '1 Immobilie', '1 immobile', '1 套房产', '1 件の物件', '매물 1개', '1 объект', '1 संपत्ति'],
    ft_norv: ['Aún sin reseñas', 'No reviews yet', 'Sem avaliações ainda', "Pas encore d'avis", 'لا توجد تقييمات بعد', 'Noch keine Bewertungen', 'Ancora nessuna valutazione', '暂无评价', 'まだ評価はありません', '아직 평가가 없습니다', 'Пока нет оценок', 'अभी कोई रेटिंग नहीं'],
    ft_ver: ['Verificado', 'Verified', 'Verificado', 'Vérifié', 'موثّق', 'Geprüft', 'Verificato', '已验证', '確認済み', '인증됨', 'Проверено', 'सत्यापित'],
    faq_title: ['Preguntas frecuentes', 'Frequently asked questions', 'Perguntas frequentes', 'Questions fréquentes', 'الأسئلة الشائعة', 'Häufige Fragen', 'Domande frequenti', '常见问题', 'よくある質問', '자주 묻는 질문', 'Частые вопросы', 'अक्सर पूछे जाने वाले प्रश्न'],
    faq1q: ['¿Necesito registrarme para ver inmuebles?', 'Do I need to sign up to browse?', 'Preciso me cadastrar para ver imóveis?', "Dois-je m'inscrire pour consulter ?", 'هل أحتاج إلى التسجيل للتصفّح؟', 'Muss ich mich registrieren, um zu stöbern?', 'Devo registrarmi per navigare?', '浏览需要注册吗？', '閲覧に登録は必要ですか？', '둘러보려면 가입해야 하나요?', 'Нужно ли регистрироваться, чтобы смотреть?', 'क्या देखने के लिए पंजीकरण ज़रूरी है?'],
    faq1a: ['No. Puedes explorar, guardar favoritos y comparar sin cuenta. Solo necesitas registrarte si quieres vender o arrendar tu inmueble.', 'No. You can browse, save favorites and compare without an account. You only need to sign up if you want to sell or rent out a property.', 'Não. Você pode explorar, salvar favoritos e comparar sem conta. Só precisa se cadastrar para vender ou alugar um imóvel.', 'Non. Vous pouvez explorer, enregistrer des favoris et comparer sans compte. L’inscription n’est utile que pour vendre ou louer.', 'لا. يمكنك التصفّح وحفظ المفضلات والمقارنة دون حساب. تحتاج إلى التسجيل فقط إذا أردت بيع عقار أو تأجيره.', 'Nein. Du kannst ohne Konto stöbern, Favoriten speichern und vergleichen. Registrieren musst du dich nur, wenn du eine Immobilie verkaufen oder vermieten möchtest.', 'No. Puoi esplorare, salvare preferiti e confrontare senza account. Devi registrarti solo se vuoi vendere o affittare un immobile.', '不需要。你可以在没有账户的情况下浏览、收藏和比较。只有想出售或出租房产时才需要注册。', 'いいえ。アカウントなしで閲覧、お気に入り保存、比較ができます。登録が必要なのは物件を売る・貸す場合だけです。', '아니요. 계정 없이 둘러보고, 즐겨찾기를 저장하고, 비교할 수 있습니다. 매물을 팔거나 임대하려는 경우에만 가입하면 됩니다.', 'Нет. Можно смотреть, сохранять избранное и сравнивать без учётной записи. Регистрация нужна, только если вы хотите продать или сдать объект.', 'नहीं। आप बिना खाते के देख सकते हैं, पसंदीदा सहेज सकते हैं और तुलना कर सकते हैं। पंजीकरण केवल तभी चाहिए जब आप संपत्ति बेचना या किराये पर देना चाहें।'],
    faq2q: ['¿Qué significa «Verificado»?', 'What does “Verified” mean?', 'O que significa «Verificado»?', 'Que signifie « Vérifié » ?', 'ماذا يعني «موثّق»؟', 'Was bedeutet „Geprüft“?', 'Cosa significa «Verificato»?', '“已验证”是什么意思？', '「確認済み」とはどういう意味ですか？', '\'인증됨\'은 무슨 뜻인가요?', 'Что значит «Проверено»?', '“सत्यापित” का क्या अर्थ है?'],
    faq2a: ['Que el vendedor verificó su identidad con documento en UMBRAL. Además puedes leer las calificaciones de otros usuarios en cada inmueble.', 'The seller has verified their identity with an ID document on UMBRAL. You can also read other users’ ratings on each property.', 'O vendedor verificou sua identidade com documento na UMBRAL. Você também pode ler as avaliações de outros usuários em cada imóvel.', 'Le vendeur a vérifié son identité avec un document sur UMBRAL. Vous pouvez aussi lire les avis des autres utilisateurs.', 'وثّق البائع هويته بوثيقة رسمية في UMBRAL. يمكنك أيضًا قراءة تقييمات المستخدمين الآخرين في كل عقار.', 'Der Verkäufer hat seine Identität bei UMBRAL mit einem Ausweisdokument bestätigt. Außerdem kannst du in jeder Immobilie die Bewertungen anderer Nutzer lesen.', 'Il venditore ha confermato la sua identità su UMBRAL con un documento. Inoltre, in ogni immobile puoi leggere le valutazioni di altri utenti.', '卖家已在 UMBRAL 通过身份证件确认身份。此外，你可以在每套房产中查看其他用户的评价。', '売主が UMBRAL で身分証により本人確認を行ったことを示します。また、各物件では他のユーザーの評価を読めます。', '판매자가 UMBRAL에서 신분증으로 본인 확인을 했다는 뜻입니다. 또한 각 매물에서 다른 사용자의 평가를 읽을 수 있습니다.', 'Продавец подтвердил свою личность в UMBRAL с помощью документа. Кроме того, в каждом объекте можно прочитать оценки других пользователей.', 'विक्रेता ने UMBRAL पर पहचान दस्तावेज़ से अपनी पहचान की पुष्टि की है। साथ ही, हर संपत्ति में आप अन्य उपयोगकर्ताओं की रेटिंग पढ़ सकते हैं।'],
    faq3q: ['¿Cómo contacto al vendedor?', 'How do I contact the seller?', 'Como entro em contato com o vendedor?', 'Comment contacter le vendeur ?', 'كيف أتواصل مع البائع؟', 'Wie kontaktiere ich den Verkäufer?', 'Come contatto il venditore?', '如何联系卖家？', '売主にはどう連絡しますか？', '판매자에게 어떻게 연락하나요?', 'Как связаться с продавцом?', 'विक्रेता से कैसे संपर्क करूँ?'],
    faq3a: ['Abre «Ver detalles» en el inmueble: ahí puedes llamar al vendedor o dejarle tu mensaje en el formulario de contacto.', 'Open “Details” on the property: you can call the seller or leave a message in the contact form.', 'Abra «Ver detalhes» no imóvel: ali você pode ligar ao vendedor ou deixar sua mensagem no formulário.', 'Ouvrez « Détails » sur le bien : vous pouvez appeler le vendeur ou lui écrire via le formulaire.', 'افتح «التفاصيل» في العقار: يمكنك الاتصال بالبائع أو ترك رسالة في نموذج التواصل.', 'Öffne „Details“ der Immobilie: Du kannst den Verkäufer anrufen oder im Kontaktformular eine Nachricht hinterlassen.', 'Apri «Vedi dettagli» dell\'immobile: puoi chiamare il venditore o lasciargli un messaggio nel modulo di contatto.', '打开房产的“查看详情”：你可以致电卖家，或在联系表单中留言。', '物件の「詳細を見る」を開くと、売主に電話するか、問い合わせフォームからメッセージを送れます。', '매물의 \'자세히 보기\'를 열면 판매자에게 전화하거나 문의 양식으로 메시지를 남길 수 있습니다.', 'Откройте «Подробнее» у объекта: можно позвонить продавцу или оставить сообщение в форме связи.', 'संपत्ति का “विवरण देखें” खोलें: आप विक्रेता को कॉल कर सकते हैं या संपर्क फ़ॉर्म में संदेश छोड़ सकते हैं।'],
    faq4q: ['¿Cómo cierro la compra o el arriendo?', 'How do I close the purchase or rental?', 'Como fecho a compra ou o aluguel?', 'Comment conclure l\'achat ou la location ?', 'كيف أُتمّ الشراء أو الإيجار؟', 'Wie schließe ich den Kauf oder die Miete ab?', 'Come chiudo l\'acquisto o l\'affitto?', '如何完成购买或租赁？', '購入や賃貸の手続きはどうしますか？', '매매나 임대는 어떻게 마무리하나요?', 'Как оформить покупку или аренду?', 'खरीद या किराया कैसे पूरा करूँ?'],
    faq4a: ['UMBRAL te conecta con el vendedor o la inmobiliaria: escríbeles, llámalos o agenda una visita desde «Ver detalles». El precio, el contrato y la forma de pago los acuerdas directamente con ellos; UMBRAL no recibe dinero de compras ni arriendos.', 'UMBRAL connects you with the seller or agency: message them, call them or schedule a visit from “Details”. You agree the price, contract and payment method directly with them; UMBRAL does not handle purchase or rental payments.', 'A UMBRAL conecta você ao vendedor ou à imobiliária: escreva, ligue ou agende uma visita em «Ver detalhes». Preço, contrato e forma de pagamento são combinados diretamente com eles; a UMBRAL não recebe dinheiro de compras nem aluguéis.', 'UMBRAL vous met en relation avec le vendeur ou l\'agence : écrivez-leur, appelez-les ou planifiez une visite depuis « Détails ». Prix, contrat et mode de paiement se conviennent directement avec eux ; UMBRAL ne perçoit aucun paiement d\'achat ou de location.', 'يربطك UMBRAL بالبائع أو الوكالة: راسله أو اتصل به أو احجز زيارة من «التفاصيل». تتفق على السعر والعقد وطريقة الدفع معه مباشرة؛ UMBRAL لا يتولى مدفوعات الشراء أو الإيجار.', 'UMBRAL verbindet dich mit dem Verkäufer oder der Agentur: Schreib, ruf an oder plane eine Besichtigung über „Details“. Preis, Vertrag und Zahlungsweise vereinbarst du direkt mit ihnen; UMBRAL wickelt keine Kauf- oder Mietzahlungen ab.', 'UMBRAL ti mette in contatto con il venditore o l\'agenzia: scrivi, chiama o prenota una visita da «Vedi dettagli». Prezzo, contratto e modalità di pagamento li concordi direttamente con loro; UMBRAL non gestisce pagamenti di acquisti o affitti.', 'UMBRAL 为你联系卖家或中介：在“查看详情”中留言、致电或预约看房。价格、合同和付款方式由你与对方直接商定；UMBRAL 不处理购房或租房款项。', 'UMBRAL は売主や不動産会社とつなぎます。「詳細を見る」からメッセージ、電話、内見予約ができます。価格、契約、支払い方法は相手と直接取り決めてください。UMBRAL は購入代金や家賃の支払いを扱いません。', 'UMBRAL은 판매자나 중개업체와 연결해 드립니다. \'자세히 보기\'에서 메시지, 전화 또는 방문 예약을 하세요. 가격, 계약, 결제 방식은 상대방과 직접 합의하며, UMBRAL은 매매 대금이나 임대료 결제를 처리하지 않습니다.', 'UMBRAL связывает вас с продавцом или агентством: пишите, звоните или запишитесь на просмотр через «Подробнее». Цену, договор и способ оплаты вы согласуете с ними напрямую; UMBRAL не проводит платежи за покупку или аренду.', 'UMBRAL आपको विक्रेता या एजेंसी से जोड़ता है: “विवरण देखें” से संदेश भेजें, कॉल करें या विज़िट बुक करें। कीमत, अनुबंध और भुगतान का तरीका आप सीधे उनसे तय करते हैं; UMBRAL खरीद या किराये के भुगतान नहीं संभालता।'],
    faq5q: ['¿Puedo calificar a un vendedor?', 'Can I rate a seller?', 'Posso avaliar um vendedor?', 'Puis-je noter un vendeur ?', 'هل يمكنني تقييم بائع؟', 'Kann ich einen Verkäufer bewerten?', 'Posso valutare un venditore?', '我可以评价卖家吗？', '売主を評価できますか？', '판매자를 평가할 수 있나요?', 'Можно ли оценить продавца?', 'क्या मैं विक्रेता को रेटिंग दे सकता हूँ?'],
    faq5a: ['Sí. En «Ver detalles» entra a la pestaña «Comentarios y calificación». Se permite una reseña por dispositivo para que las opiniones sean reales.', 'Yes. In “Details” open the “Comments & rating” tab. One review per device keeps opinions genuine.', 'Sim. Em «Ver detalhes» abra a aba «Comentários e avaliação». Uma avaliação por dispositivo mantém as opiniões reais.', 'Oui. Dans « Détails » ouvrez l’onglet « Commentaires et note ». Un avis par appareil garantit des avis authentiques.', 'نعم. في «التفاصيل» افتح تبويب «التعليقات والتقييم». تقييم واحد لكل جهاز يحافظ على صدق الآراء.', 'Ja. Öffne in „Details“ den Reiter „Kommentare und Bewertung“. Eine Bewertung pro Gerät hält die Meinungen ehrlich.', 'Sì. In «Vedi dettagli» apri la scheda «Commenti e valutazione». Una valutazione per dispositivo mantiene le opinioni oneste.', '可以。在“查看详情”中打开“评论与评分”标签。每台设备一条评价，确保评价真实。', 'はい。「詳細を見る」で「コメントと評価」タブを開いてください。1台につき1件の評価で公正な意見を保ちます。', '네. \'자세히 보기\'에서 \'댓글 및 평가\' 탭을 여세요. 기기당 평가 1개로 의견의 신뢰성을 지킵니다.', 'Да. В «Подробнее» откройте вкладку «Отзывы и оценка». Одна оценка с устройства сохраняет честность мнений.', 'हाँ। “विवरण देखें” में “टिप्पणियाँ और रेटिंग” टैब खोलें। प्रति डिवाइस एक रेटिंग राय को ईमानदार रखती है।'],
    faq6q: ['¿Cómo publico mi inmueble?', 'How do I list my property?', 'Como publico meu imóvel?', 'Comment publier mon bien ?', 'كيف أنشر عقاري؟', 'Wie inseriere ich meine Immobilie?', 'Come pubblico il mio immobile?', '如何发布我的房产？', '物件を掲載するには？', '내 매물은 어떻게 올리나요?', 'Как разместить свой объект?', 'अपनी संपत्ति का विज्ञापन कैसे दूँ?'],
    faq6a: ['Toca «Registrarme para vender» en el menú, crea tu cuenta de vendedor y publica. Tu inmueble tendrá su propia página que Google puede encontrar.', 'Tap “Sign up to sell” in the menu, create your seller account and publish. Your property gets its own page that Google can find.', 'Toque em «Cadastrar para vender» no menu, crie sua conta de vendedor e publique. Seu imóvel terá uma página própria que o Google pode encontrar.', 'Touchez « S’inscrire pour vendre » dans le menu, créez votre compte vendeur et publiez. Votre bien aura sa propre page indexable par Google.', 'اضغط «سجّل للبيع» في القائمة، وأنشئ حساب بائع وانشر. يحصل عقارك على صفحة خاصة يمكن لـ Google العثور عليها.', 'Tippe im Menü auf „Zum Verkaufen registrieren“, erstelle dein Verkäuferkonto und veröffentliche. Deine Immobilie bekommt eine eigene Seite, die Google finden kann.', 'Tocca «Registrati per vendere» nel menu, crea il tuo account venditore e pubblica. Il tuo immobile avrà una pagina propria che Google può trovare.', '在菜单中点击“注册成为卖家”，创建卖家账户并发布。你的房产将拥有可被 Google 搜索到的独立页面。', 'メニューの「売主として登録」をタップし、売主アカウントを作成して掲載してください。物件には Google で見つけられる専用ページが作られます。', '메뉴에서 \'판매자로 가입\'을 눌러 판매자 계정을 만들고 게시하세요. 매물마다 Google에서 찾을 수 있는 전용 페이지가 생깁니다.', 'Нажмите в меню «Зарегистрироваться как продавец», создайте учётную запись продавца и публикуйте. У объекта будет собственная страница, которую найдёт Google.', 'मेनू में “बेचने के लिए पंजीकरण करें” दबाएँ, अपना विक्रेता खाता बनाएँ और प्रकाशित करें। आपकी संपत्ति का अपना पेज होगा जिसे Google ढूँढ सकता है।'],
    bn_all: ['Explorar', 'Explore', 'Explorar', 'Explorer', 'استكشاف', 'Entdecken', 'Esplora', '浏览', '探す', '둘러보기', 'Обзор', 'खोजें'],
    bn_map: ['Mapa', 'Map', 'Mapa', 'Carte', 'الخريطة', 'Karte', 'Mappa', '地图', '地図', '지도', 'Карта', 'नक्शा'],
    bn_fav: ['Favoritos', 'Favorites', 'Favoritos', 'Favoris', 'المفضلة', 'Favoriten', 'Preferiti', '收藏', 'お気に入り', '즐겨찾기', 'Избранное', 'पसंदीदा'],
    bn_menu: ['Menú', 'Menu', 'Menu', 'Menu', 'القائمة', 'Menü', 'Menu', '菜单', 'メニュー', '메뉴', 'Меню', 'मेनू'],
    wl_title: ['Bienvenido a UMBRAL', 'Welcome to UMBRAL', 'Bem-vindo à UMBRAL', 'Bienvenue sur UMBRAL', 'مرحبًا بك في UMBRAL', 'Willkommen bei UMBRAL', 'Benvenuto su UMBRAL', '欢迎来到 UMBRAL', 'UMBRAL へようこそ', 'UMBRAL에 오신 것을 환영합니다', 'Добро пожаловать в UMBRAL', 'UMBRAL में आपका स्वागत है'],
    wl_sub: ['Tres pasos para encontrar tu próximo hogar', 'Three steps to find your next home', 'Três passos para encontrar seu próximo lar', 'Trois étapes pour trouver votre prochain foyer', 'ثلاث خطوات للعثور على منزلك القادم', 'Drei Schritte zu deinem nächsten Zuhause', 'Tre passi verso la tua prossima casa', '三步找到你的下一个家', '次の住まいまで3ステップ', '다음 집까지 세 단계', 'Три шага к вашему следующему дому', 'आपके अगले घर तक तीन कदम'],
    wl1: ['Busca', 'Search', 'Busque', 'Cherchez', 'ابحث', 'Suchen', 'Cerca', '搜索', '探す', '검색', 'Ищите', 'खोजें'],
    wl1s: ['Filtra por ciudad, tipo y precio.', 'Filter by city, type and price.', 'Filtre por cidade, tipo e preço.', 'Filtrez par ville, type et prix.', 'صفِّ حسب المدينة والنوع والسعر.', 'Filtere nach Stadt, Art und Preis.', 'Filtra per città, tipo e prezzo.', '按城市、类型和价格筛选。', '都市、種類、価格で絞り込み。', '도시, 유형, 가격으로 필터링하세요.', 'Фильтруйте по городу, типу и цене.', 'शहर, प्रकार और कीमत से फ़िल्टर करें।'],
    wl2: ['Guarda y compara', 'Save and compare', 'Salve e compare', 'Enregistrez et comparez', 'احفظ وقارن', 'Speichern und vergleichen', 'Salva e confronta', '收藏和比较', '保存して比較', '저장 및 비교', 'Сохраняйте и сравнивайте', 'सहेजें और तुलना करें'],
    wl2s: ['Marca favoritos y míralos lado a lado.', 'Mark favorites and view them side by side.', 'Marque favoritos e veja lado a lado.', 'Marquez des favoris et comparez-les.', 'ضع علامة على المفضلات واعرضها جنبًا إلى جنب.', 'Markiere Favoriten und sieh sie nebeneinander an.', 'Segna i preferiti e guardali fianco a fianco.', '标记收藏并并排查看。', 'お気に入りに登録して並べて比較。', '즐겨찾기를 표시하고 나란히 비교하세요.', 'Отмечайте избранное и сравнивайте рядом.', 'पसंदीदा चिह्नित करें और साथ-साथ देखें।'],
    wl3: ['Contacta', 'Get in touch', 'Entre em contato', 'Contactez', 'تواصل', 'Kontakt aufnehmen', 'Contatta', '联系', '連絡する', '연락', 'Связывайтесь', 'संपर्क करें'],
    wl3s: ['Llama al vendedor o déjale tu mensaje.', 'Call the seller or leave a message.', 'Ligue ao vendedor ou deixe uma mensagem.', 'Appelez le vendeur ou laissez un message.', 'اتصل بالبائع أو اترك رسالة.', 'Ruf den Verkäufer an oder hinterlasse eine Nachricht.', 'Chiama il venditore o lascia un messaggio.', '致电卖家或留下留言。', '売主に電話するかメッセージを残す。', '판매자에게 전화하거나 메시지를 남기세요.', 'Позвоните продавцу или оставьте сообщение.', 'विक्रेता को कॉल करें या संदेश छोड़ें।'],
    wl_go: ['Empezar a explorar', 'Start exploring', 'Começar a explorar', 'Commencer', 'ابدأ الاستكشاف', 'Los geht’s', 'Iniziamo', '开始吧', '始めましょう', '시작하기', 'Начать', 'शुरू करें'],
    close: ['Cerrar', 'Close', 'Fechar', 'Fermer', 'إغلاق', 'Schließen', 'Chiudi', '关闭', '閉じる', '닫기', 'Закрыть', 'बंद करें'],
    map_title: ['Mapa de propiedades', 'Property map', 'Mapa de imóveis', 'Carte des biens', 'خريطة العقارات', 'Immobilienkarte', 'Mappa degli immobili', '房产地图', '物件マップ', '매물 지도', 'Карта объектов', 'संपत्तियों का नक्शा'],
    map_hint: ['Toca un marcador para ver el inmueble', 'Tap a marker to see the property', 'Toque num marcador para ver o imóvel', 'Touchez un repère pour voir le bien', 'اضغط على علامة لرؤية العقار', 'Tippe auf eine Markierung, um die Immobilie zu sehen', 'Tocca un indicatore per vedere l\'immobile', '点击标记查看房产', 'マーカーをタップして物件を表示', '마커를 눌러 매물을 확인하세요', 'Нажмите на метку, чтобы увидеть объект', 'संपत्ति देखने के लिए किसी मार्कर पर टैप करें'],
    share_n: ['Compartir', 'Share', 'Compartilhar', 'Partager', 'مشاركة', 'Teilen', 'Condividi', '分享', '共有', '공유', 'Поделиться', 'साझा करें']
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
    '<div class="tr-i"><span class="tr-ic"><i class="fa-solid fa-tag"></i></span><div><b data-xk="tr_free"></b><small data-xk="tr_free_s"></small></div></div>' +
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
        return '<article class="ft-c"><div class="ft-top"><div class="avatar" translate="no">' + esc(s.ini || '') + '</div><div><b>' + esc(s.name) + '</b><small>' + t(s.kind === 'agency' ? 'agency' : 'person') + ' · ' + (cnt[i] === 1 ? X('ft_n1') : X('ft_n', { n: cnt[i] })) + '</small></div></div>' +
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
