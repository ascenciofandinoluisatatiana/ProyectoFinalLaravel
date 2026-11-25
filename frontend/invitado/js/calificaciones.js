/* ============ calificaciones y comentarios del vendedor ============
   Pestañas del detalle ("Detalles" / "Comentarios y calificación"), resumen con estrellas,
   formulario para calificar y lista de comentarios.
   - Con la API (vendedor con id): GET/POST /api/v1/public/vendedores/{id}/calificaciones
   - Sin API (datos de ejemplo): se guarda en este navegador (localStorage) para poder probar la interfaz.
   Se carga después de detalle.js y antes de mejoras.js. */
const RV = (function () {
  'use strict';

  /* ---------- textos (es · en · pt · fr) ---------- */
  var TX = {
    tab_info: ['Detalles', 'Details', 'Detalhes', 'Détails', 'التفاصيل', 'Details', 'Dettagli', '详情', '詳細', '상세 정보', 'Подробности', 'विवरण'],
    tab_reviews: ['Comentarios y calificación', 'Comments & rating', 'Comentários e avaliação', 'Commentaires et note', 'التعليقات والتقييم', 'Kommentare und Bewertung', 'Commenti e valutazione', '评论与评分', 'コメントと評価', '댓글 및 평가', 'Отзывы и оценка', 'टिप्पणियाँ और रेटिंग'],
    tabs_aria: ['Secciones del inmueble', 'Property sections', 'Seções do imóvel', 'Sections du bien', 'أقسام العقار', 'Bereiche der Immobilie', 'Sezioni dell\'immobile', '房产栏目', '物件のセクション', '매물 섹션', 'Разделы объекта', 'संपत्ति के अनुभाग'],
    reviews_of: ['Reseñas de', 'Reviews of', 'Avaliações de', 'Avis sur', 'تقييمات', 'Bewertungen von', 'Valutazioni di', '评价对象', '評価対象', '평가 대상', 'Оценки продавца', 'रेटिंग:'],
    based_on: ['Basado en', 'Based on', 'Com base em', 'Basé sur', 'بناءً على', 'Basierend auf', 'Basato su', '基于', '評価数', '평가 수', 'На основе', 'आधार:'],
    one: ['{n} reseña', '{n} review', '{n} avaliação', '{n} avis', '{n} تقييم', '{n} Bewertung', '{n} valutazione', '{n} 条评价', '{n} 件の評価', '평가 {n}개', '{n} оценка', '{n} रेटिंग'],
    many: ['{n} reseñas', '{n} reviews', '{n} avaliações', '{n} avis', '{n} تقييمات', '{n} Bewertungen', '{n} valutazioni', '{n} 条评价', '{n} 件の評価', '평가 {n}개', 'оценок: {n}', '{n} रेटिंग'],
    none_yet: ['Aún no hay reseñas', 'No reviews yet', 'Ainda não há avaliações', "Pas encore d'avis", 'لا توجد تقييمات بعد', 'Noch keine Bewertungen', 'Ancora nessuna valutazione', '暂无评价', 'まだ評価はありません', '아직 평가가 없습니다', 'Пока нет оценок', 'अभी कोई रेटिंग नहीं'],
    none_sub: ['Sé la primera persona en calificar a este vendedor.', 'Be the first to rate this seller.', 'Seja a primeira pessoa a avaliar este vendedor.', 'Soyez la première personne à noter ce vendeur.', 'كن أول من يقيّم هذا البائع.', 'Sei der Erste, der diesen Verkäufer bewertet.', 'Sii il primo a valutare questo venditore.', '成为第一个评价该卖家的人。', 'この売主を最初に評価しましょう。', '이 판매자를 처음으로 평가해 보세요.', 'Станьте первым, кто оценит этого продавца.', 'इस विक्रेता को रेटिंग देने वाले पहले व्यक्ति बनें।'],
    line_none: ['Sin reseñas · Sé el primero en calificar', 'No reviews · Be the first to rate', 'Sem avaliações · Seja o primeiro', 'Aucun avis · Soyez le premier', 'لا توجد تقييمات · كن أول من يقيّم', 'Keine Bewertungen · Sei der Erste', 'Nessuna valutazione · Sii il primo', '暂无评价 · 抢先评价', '評価なし · 最初の評価者になろう', '평가 없음 · 첫 평가를 남겨 보세요', 'Нет оценок · Будьте первым', 'कोई रेटिंग नहीं · पहले बनें'],
    leave: ['Califica a este vendedor', 'Rate this seller', 'Avalie este vendedor', 'Notez ce vendeur', 'قيّم هذا البائع', 'Diesen Verkäufer bewerten', 'Valuta questo venditore', '评价该卖家', 'この売主を評価する', '이 판매자 평가하기', 'Оценить этого продавца', 'इस विक्रेता को रेटिंग दें'],
    yours: ['Tu reseña', 'Your review', 'Sua avaliação', 'Votre avis', 'تقييمك', 'Deine Bewertung', 'La tua valutazione', '你的评价', 'あなたの評価', '내 평가', 'Ваша оценка', 'आपकी रेटिंग'],
    edit_hint: ['Ya calificaste a este vendedor. Puedes actualizar tu reseña.', 'You already rated this seller. You can update your review.', 'Você já avaliou este vendedor. Pode atualizar sua avaliação.', 'Vous avez déjà noté ce vendeur. Vous pouvez mettre à jour votre avis.', 'لقد قيّمت هذا البائع بالفعل. يمكنك تحديث تقييمك.', 'Du hast diesen Verkäufer bereits bewertet. Du kannst deine Bewertung aktualisieren.', 'Hai già valutato questo venditore. Puoi aggiornare la tua valutazione.', '你已评价过该卖家，可以更新你的评价。', 'この売主はすでに評価済みです。評価を更新できます。', '이미 이 판매자를 평가했습니다. 평가를 수정할 수 있습니다.', 'Вы уже оценили этого продавца. Можно обновить оценку.', 'आप इस विक्रेता को पहले ही रेटिंग दे चुके हैं। आप अपनी रेटिंग अपडेट कर सकते हैं।'],
    your_rating: ['Tu calificación', 'Your rating', 'Sua avaliação', 'Votre note', 'تقييمك', 'Deine Bewertung', 'Il tuo voto', '你的评分', 'あなたの点数', '내 점수', 'Ваш балл', 'आपका स्कोर'],
    pick: ['Elige de 1 a 5 estrellas', 'Choose 1 to 5 stars', 'Escolha de 1 a 5 estrelas', 'Choisissez de 1 à 5 étoiles', 'اختر من 1 إلى 5 نجوم', 'Wähle 1 bis 5 Sterne', 'Scegli da 1 a 5 stelle', '选择 1 到 5 颗星', '星を 1〜5 個選んでください', '별 1~5개를 선택하세요', 'Выберите от 1 до 5 звёзд', '1 से 5 स्टार चुनें'],
    s1: ['Malo', 'Poor', 'Ruim', 'Mauvais', 'ضعيف', 'Schlecht', 'Scarso', '很差', '悪い', '나쁨', 'Плохо', 'खराब'],
    s2: ['Regular', 'Fair', 'Regular', 'Moyen', 'مقبول', 'Mittelmäßig', 'Mediocre', '一般', 'いまいち', '보통 이하', 'Посредственно', 'साधारण'],
    s3: ['Bueno', 'Good', 'Bom', 'Bien', 'جيد', 'Gut', 'Buono', '好', '良い', '좋음', 'Хорошо', 'अच्छा'],
    s4: ['Muy bueno', 'Very good', 'Muito bom', 'Très bien', 'جيد جدًا', 'Sehr gut', 'Molto buono', '很好', 'とても良い', '매우 좋음', 'Очень хорошо', 'बहुत अच्छा'],
    s5: ['Excelente', 'Excellent', 'Excelente', 'Excellent', 'ممتاز', 'Ausgezeichnet', 'Eccellente', '优秀', '最高', '훌륭함', 'Отлично', 'उत्कृष्ट'],
    name: ['Tu nombre', 'Your name', 'Seu nome', 'Votre nom', 'اسمك', 'Dein Name', 'Il tuo nome', '你的姓名', 'お名前', '이름', 'Ваше имя', 'आपका नाम'],
    comment: ['Tu comentario (opcional)', 'Your comment (optional)', 'Seu comentário (opcional)', 'Votre commentaire (facultatif)', 'تعليقك (اختياري)', 'Dein Kommentar (optional)', 'Il tuo commento (facoltativo)', '你的评论（可选）', 'コメント（任意）', '댓글 (선택)', 'Ваш комментарий (необязательно)', 'आपकी टिप्पणी (वैकल्पिक)'],
    comment_ph: ['Cuenta cómo fue tu experiencia con este vendedor…', 'Tell us about your experience with this seller…', 'Conte como foi sua experiência com este vendedor…', 'Racontez votre expérience avec ce vendeur…', 'أخبرنا عن تجربتك مع هذا البائع…', 'Erzähl von deiner Erfahrung mit diesem Verkäufer…', 'Racconta la tua esperienza con questo venditore…', '分享你与该卖家的经历…', 'この売主との体験を教えてください…', '이 판매자와의 경험을 알려 주세요…', 'Расскажите о своём опыте с этим продавцом…', 'इस विक्रेता के साथ अपना अनुभव बताएँ…'],
    publish: ['Publicar reseña', 'Post review', 'Publicar avaliação', "Publier l'avis", 'نشر التقييم', 'Bewertung veröffentlichen', 'Pubblica valutazione', '发布评价', '評価を投稿', '평가 게시', 'Опубликовать оценку', 'रेटिंग प्रकाशित करें'],
    update: ['Actualizar mi reseña', 'Update my review', 'Atualizar minha avaliação', 'Mettre à jour mon avis', 'تحديث تقييمي', 'Meine Bewertung aktualisieren', 'Aggiorna la mia valutazione', '更新我的评价', '評価を更新', '내 평가 수정', 'Обновить мою оценку', 'मेरी रेटिंग अपडेट करें'],
    sending: ['Enviando…', 'Sending…', 'Enviando…', 'Envoi…', 'جارٍ الإرسال…', 'Wird gesendet…', 'Invio in corso…', '发送中…', '送信中…', '보내는 중…', 'Отправка…', 'भेजा जा रहा है…'],
    need_stars: ['Elige cuántas estrellas das (1 a 5).', 'Choose how many stars to give (1 to 5).', 'Escolha quantas estrelas dar (1 a 5).', "Choisissez combien d'étoiles donner (1 à 5).", 'اختر عدد النجوم (من 1 إلى 5).', 'Wähle, wie viele Sterne du vergibst (1 bis 5).', 'Scegli quante stelle assegnare (da 1 a 5).', '请选择星级（1 到 5）。', '星の数を選んでください（1〜5）。', '별 개수를 선택하세요 (1~5).', 'Выберите количество звёзд (от 1 до 5).', 'कितने स्टार देने हैं चुनें (1 से 5)।'],
    need_name: ['Escribe tu nombre (mínimo 2 letras).', 'Enter your name (at least 2 letters).', 'Digite seu nome (mínimo 2 letras).', 'Saisissez votre nom (2 lettres minimum).', 'اكتب اسمك (حرفان على الأقل).', 'Gib deinen Namen ein (mindestens 2 Buchstaben).', 'Scrivi il tuo nome (almeno 2 lettere).', '请输入你的姓名（至少 2 个字符）。', 'お名前を入力してください（2文字以上）。', '이름을 입력하세요 (2자 이상).', 'Введите имя (не менее 2 букв).', 'अपना नाम लिखें (कम से कम 2 अक्षर)।'],
    thanks: ['¡Gracias! Tu reseña fue publicada.', 'Thanks! Your review was posted.', 'Obrigado! Sua avaliação foi publicada.', 'Merci ! Votre avis a été publié.', 'شكرًا! تم نشر تقييمك.', 'Danke! Deine Bewertung wurde veröffentlicht.', 'Grazie! La tua valutazione è stata pubblicata.', '谢谢！你的评价已发布。', 'ありがとうございます！評価が投稿されました。', '감사합니다! 평가가 게시되었습니다.', 'Спасибо! Ваша оценка опубликована.', 'धन्यवाद! आपकी रेटिंग प्रकाशित हो गई।'],
    updated: ['Tu reseña fue actualizada.', 'Your review was updated.', 'Sua avaliação foi atualizada.', 'Votre avis a été mis à jour.', 'تم تحديث تقييمك.', 'Deine Bewertung wurde aktualisiert.', 'La tua valutazione è stata aggiornata.', '你的评价已更新。', '評価を更新しました。', '평가가 수정되었습니다.', 'Ваша оценка обновлена.', 'आपकी रेटिंग अपडेट हो गई।'],
    err: ['No pudimos guardar tu reseña. Inténtalo de nuevo.', "We couldn't save your review. Please try again.", 'Não foi possível salvar sua avaliação. Tente novamente.', "Impossible d'enregistrer votre avis. Réessayez.", 'تعذّر حفظ تقييمك. حاول مرة أخرى.', 'Deine Bewertung konnte nicht gespeichert werden. Versuche es erneut.', 'Impossibile salvare la valutazione. Riprova.', '无法保存你的评价，请重试。', '評価を保存できませんでした。もう一度お試しください。', '평가를 저장하지 못했습니다. 다시 시도하세요.', 'Не удалось сохранить оценку. Попробуйте снова.', 'आपकी रेटिंग सहेजी नहीं जा सकी। फिर से कोशिश करें।'],
    wait: ['Has enviado muchas reseñas seguidas. Espera un minuto.', 'Too many reviews in a row. Please wait a minute.', 'Muitas avaliações seguidas. Aguarde um minuto.', "Trop d'avis à la suite. Patientez une minute.", 'تقييمات كثيرة متتالية. انتظر دقيقة.', 'Zu viele Bewertungen hintereinander. Warte eine Minute.', 'Troppe valutazioni di seguito. Attendi un minuto.', '评价过于频繁，请等待一分钟。', '評価が続きすぎています。1分お待ちください。', '평가를 너무 연속으로 남겼습니다. 1분 기다려 주세요.', 'Слишком много оценок подряд. Подождите минуту.', 'लगातार बहुत अधिक रेटिंग। एक मिनट प्रतीक्षा करें।'],
    load_err: ['No pudimos cargar las reseñas.', "We couldn't load the reviews.", 'Não foi possível carregar as avaliações.', 'Impossible de charger les avis.', 'تعذّر تحميل التقييمات.', 'Die Bewertungen konnten nicht geladen werden.', 'Impossibile caricare le valutazioni.', '无法加载评价。', '評価を読み込めませんでした。', '평가를 불러오지 못했습니다.', 'Не удалось загрузить оценки.', 'रेटिंग लोड नहीं हो सकीं।'],
    retry: ['Reintentar', 'Retry', 'Tentar novamente', 'Réessayer', 'إعادة المحاولة', 'Erneut versuchen', 'Riprova', '重试', '再試行', '다시 시도', 'Повторить', 'फिर कोशिश करें'],
    loading: ['Cargando reseñas…', 'Loading reviews…', 'Carregando avaliações…', 'Chargement des avis…', 'جارٍ تحميل التقييمات…', 'Bewertungen werden geladen…', 'Caricamento valutazioni…', '正在加载评价…', '評価を読み込み中…', '평가를 불러오는 중…', 'Загрузка оценок…', 'रेटिंग लोड हो रही हैं…'],
    comments: ['Comentarios', 'Comments', 'Comentários', 'Commentaires', 'التعليقات', 'Kommentare', 'Commenti', '评论', 'コメント', '댓글', 'Отзывы', 'टिप्पणियाँ'],
    no_text: ['Calificó sin comentario.', 'Rated without a comment.', 'Avaliou sem comentário.', 'A noté sans commentaire.', 'قيّم دون تعليق.', 'Ohne Kommentar bewertet.', 'Valutato senza commento.', '仅评分，未留评论。', 'コメントなしで評価されました。', '댓글 없이 평가함.', 'Оценка без комментария.', 'बिना टिप्पणी के रेटिंग दी गई।'],
    stars_word: ['estrellas', 'stars', 'estrelas', 'étoiles', 'نجوم', 'Sterne', 'stelle', '星', 'つ星', '점', 'звёзд', 'स्टार']
  };
  function L(k, v) {
    var i = Math.max(0, LANGS.indexOf(lang)), s = (TX[k] || [k])[i] || (TX[k] || [k])[0];
    if (v) Object.keys(v).forEach(function (n) { s = s.replace('{' + n + '}', v[n]); });
    return s;
  }
  function count(n) { return n === 1 ? L('one', { n: 1 }) : L('many', { n: n }); }

  /* ---------- utilidades ---------- */
  var token = '';
  function huella() { // identificador anónimo del dispositivo (una reseña por dispositivo y vendedor)
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
  function stars(avg, extra) {
    var h = '';
    for (var i = 1; i <= 5; i++) {
      h += '<i class="' + (avg >= i - 0.25 ? 'fa-solid fa-star' : avg >= i - 0.75 ? 'fa-solid fa-star-half-stroke' : 'fa-regular fa-star') + '"></i>';
    }
    return '<span class="rv-stars ' + (extra || '') + '" role="img" aria-label="' + Number(avg).toFixed(1) + ' / 5">' + h + '</span>';
  }
  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/).filter(function (w) { return !/^(de|del|la|las|el|los|y|e|&|of|the|and)$/i.test(w); });
    return ((p[0] || '?').charAt(0) + (p[1] || '').charAt(0)).toUpperCase();
  }
  function fecha(iso) {
    try { return new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' }).format(new Date(iso)); }
    catch (_) { return ''; }
  }
  function key(s) { return s.id != null ? 'id' + s.id : 'demo:' + s.name; }
  function sellerOf(p) { return SELLERS[p.seller]; }

  /* ---------- datos: API o, sin API, este navegador ---------- */
  function demoAll() { try { return JSON.parse(localStorage.getItem('umbral_demo_resenas') || '{}'); } catch (_) { return {}; } }
  function summarize(list) {
    var dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, sum = 0;
    list.forEach(function (c) { dist[c.estrellas]++; sum += c.estrellas; });
    return { promedio: list.length ? Math.round(sum / list.length * 10) / 10 : 0, total: list.length, distribucion: dist };
  }
  function load(s) {
    if (s.id != null) {
      return fetch(API + '/vendedores/' + s.id + '/calificaciones?huella=' + encodeURIComponent(huella()), { headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('API ' + r.status); return r.json(); });
    }
    var list = demoAll()[s.name] || [], me = huella(), out = summarize(list);
    out.data = list.slice().sort(function (a, b) { return b.id - a.id; }).map(function (c) {
      return { id: c.id, nombre: c.nombre, estrellas: c.estrellas, comentario: c.comentario, fecha: c.fecha, mia: c.huella === me };
    });
    return Promise.resolve(out);
  }
  function send(s, p, d) {
    if (s.id != null) {
      return fetch(API + '/vendedores/' + s.id + '/calificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ nombre: d.nombre, estrellas: d.estrellas, comentario: d.comentario, propiedad_id: p.id, huella: huella() })
      }).then(function (r) {
        if (!r.ok) { var e = new Error('API ' + r.status); e.status = r.status; throw e; }
        return r.json();
      });
    }
    var all = demoAll(), list = all[s.name] || [], me = huella(), prev = list.filter(function (c) { return c.huella === me; })[0];
    if (prev) { prev.nombre = d.nombre; prev.estrellas = d.estrellas; prev.comentario = d.comentario || null; }
    else list.push({ id: Date.now(), nombre: d.nombre, estrellas: d.estrellas, comentario: d.comentario || null, fecha: new Date().toISOString(), huella: me });
    all[s.name] = list;
    try { localStorage.setItem('umbral_demo_resenas', JSON.stringify(all)); } catch (_) { }
    return Promise.resolve({ ok: true, actualizada: !!prev });
  }
  /* El vendedor guarda su promedio para mostrarlo en tarjetas y en el detalle sin volver a pedirlo */
  function apply(s, sum) { s.rating = sum.promedio; s.reviews = sum.total; }
  /* Datos de ejemplo: las reseñas guardadas en este navegador también cuentan en tarjetas y estadísticas */
  function hydrateDemo() {
    var all = demoAll();
    (typeof SELLERS !== 'undefined' ? SELLERS : []).forEach(function (s) {
      if (s.id == null && all[s.name]) apply(s, summarize(all[s.name]));
    });
  }

  /* ---------- HTML ---------- */
  function tabsHTML() {
    return '<div class="dtabs" role="tablist" aria-label="' + L('tabs_aria') + '">' +
      '<button type="button" role="tab" class="dtab on" id="tabInfo" aria-selected="true" aria-controls="panelInfo" data-tab="info"><i class="fa-solid fa-house"></i><span>' + L('tab_info') + '</span></button>' +
      '<button type="button" role="tab" class="dtab" id="tabRv" aria-selected="false" aria-controls="panelReviews" data-tab="reviews"><i class="fa-solid fa-star"></i><span>' + L('tab_reviews') + '</span><em class="dtab-n" id="tabRvN">0</em></button>' +
      '</div>';
  }
  function panelHTML() {
    return '<section class="dpanel" id="panelReviews" role="tabpanel" aria-labelledby="tabRv" hidden><div id="rvBody"></div></section>';
  }
  function lineHTML(s) {
    if (!s.reviews) return '<button type="button" class="rv-line none" data-tab-go="reviews"><i class="fa-regular fa-star"></i><span>' + L('line_none') + '</span></button>';
    return '<button type="button" class="rv-line" data-tab-go="reviews">' + stars(s.rating, 'sm') + '<b>' + Number(s.rating).toFixed(1) + '</b><span>(' + s.reviews + ')</span></button>';
  }
  function mini(s) { // línea corta para la tarjeta
    return s && s.reviews > 0 ? ' · <span class="rv-mini"><i class="fa-solid fa-star"></i>' + Number(s.rating).toFixed(1) + ' <em>(' + s.reviews + ')</em></span>' : '';
  }

  function summaryHTML(s, sum) {
    var bars = [5, 4, 3, 2, 1].map(function (n) {
      var c = sum.distribucion[n] || 0, pct = sum.total ? Math.round(c / sum.total * 100) : 0;
      return '<div class="rv-bar"><span>' + n + ' <i class="fa-solid fa-star"></i></span><div class="rv-track"><i style="width:' + pct + '%"></i></div><em>' + c + '</em></div>';
    }).join('');
    return '<div class="rv-sum">' +
      '<div class="rv-who"><div class="avatar" translate="no">' + esc(s.ini || initials(s.name)) + '</div><div><small>' + L('reviews_of') + '</small><b>' + esc(s.name) + '</b></div></div>' +
      (sum.total
        ? '<div class="rv-score"><div class="rv-big">' + Number(sum.promedio).toFixed(1) + '</div><div>' + stars(sum.promedio) + '<small>' + L('based_on') + ' ' + count(sum.total) + '</small></div></div><div class="rv-bars">' + bars + '</div>'
        : '<div class="rv-empty-sum"><i class="fa-regular fa-star"></i><b>' + L('none_yet') + '</b><small>' + L('none_sub') + '</small></div>') +
      '</div>';
  }
  function formHTML(mine) {
    var pick = [1, 2, 3, 4, 5].map(function (n) {
      return '<button type="button" role="radio" aria-checked="false" class="rv-star" data-star="' + n + '" aria-label="' + n + ' ' + L('stars_word') + ' · ' + L('s' + n) + '"><i class="fa-solid fa-star"></i></button>';
    }).join('');
    return '<form class="rv-form" id="rvForm" novalidate>' +
      '<h4 class="rv-h">' + (mine ? L('yours') : L('leave')) + '</h4>' +
      (mine ? '<p class="rv-hint"><i class="fa-solid fa-circle-info"></i>' + L('edit_hint') + '</p>' : '') +
      '<div class="rv-pickwrap"><span class="rv-lbl">' + L('your_rating') + ' *</span>' +
      '<div class="rv-pick" role="radiogroup" aria-label="' + L('your_rating') + '">' + pick + '</div>' +
      '<div class="rv-picklbl" id="rvPickLbl">' + L('pick') + '</div></div>' +
      '<div class="field"><label for="rvName">' + L('name') + ' *</label><input id="rvName" name="n" maxlength="60" autocomplete="name"></div>' +
      '<div class="field"><label for="rvText">' + L('comment') + '</label><textarea id="rvText" name="c" rows="3" maxlength="600" placeholder="' + esc(L('comment_ph')) + '"></textarea><small class="rv-count" id="rvCount">0/600</small></div>' +
      '<p class="rv-err" id="rvErr" role="alert" hidden></p>' +
      '<button class="btn btn-primary" type="submit" id="rvSend"><i class="fa-solid fa-paper-plane"></i><span>' + (mine ? L('update') : L('publish')) + '</span></button>' +
      '</form>';
  }
  function listHTML(sum) {
    var head = '<h4 class="rv-h">' + L('comments') + ' <span class="rv-n">' + sum.total + '</span></h4>';
    if (!sum.data.length) return head + '<div class="rv-empty"><i class="fa-regular fa-comments"></i><b>' + L('none_yet') + '</b><small>' + L('none_sub') + '</small></div>';
    return head + sum.data.map(function (c) {
      return '<article class="rv-item' + (c.mia ? ' mine' : '') + '"><div class="rv-av">' + esc(initials(c.nombre)) + '</div><div class="rv-body">' +
        '<header><b>' + esc(c.nombre) + '</b>' + (c.mia ? '<span class="rv-chip">' + L('yours') + '</span>' : '') + '<time>' + fecha(c.fecha) + '</time></header>' +
        stars(c.estrellas, 'sm') +
        (c.comentario ? '<p>' + esc(c.comentario) + '</p>' : '<p class="rv-notext">' + L('no_text') + '</p>') +
        '</div></article>';
    }).join('');
  }

  /* ---------- estado del detalle abierto ---------- */
  var cur = { id: null, p: null, s: null, sum: null, tab: 'info', stars: 0, draft: null, seq: 0 };
  var cache = {};

  function modalAbierto() { var m = document.querySelector('#mDetail'); return !!(m && m.classList.contains('open')); }

  /* Antes de repintar el detalle (p. ej. al marcar favorito) se guarda lo que la persona iba escribiendo */
  function beforeRender(id) {
    var f = document.querySelector('#rvForm'), mismo = cur.id === id && modalAbierto();
    cur.draft = (f && mismo) ? { stars: cur.stars, n: f.n.value, c: f.c.value } : null;
    if (!mismo) { cur.tab = 'info'; cur.id = null; } // detalle nuevo (o reabierto): empieza en "Detalles" y vuelve a pedir las reseñas
  }

  function setTab(tab, scroll) {
    cur.tab = tab;
    var info = document.querySelector('#panelInfo'), rv = document.querySelector('#panelReviews');
    if (!info || !rv) return;
    info.hidden = tab !== 'info'; rv.hidden = tab !== 'reviews';
    [['tabInfo', 'info'], ['tabRv', 'reviews']].forEach(function (x) {
      var b = document.querySelector('#' + x[0]); if (!b) return;
      b.classList.toggle('on', x[1] === tab); b.setAttribute('aria-selected', String(x[1] === tab)); b.tabIndex = x[1] === tab ? 0 : -1;
    });
    if (tab === 'info' && typeof dmap !== 'undefined' && dmap) setTimeout(function () { dmap.invalidateSize(); }, 30); // el mapa estaba oculto
    if (tab === 'reviews') ensure();
    if (scroll) { var bar = document.querySelector('.dtabs'); if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' }); }
  }

  function refreshHeader() {
    var n = document.querySelector('#tabRvN'), l = document.querySelector('#rvLine');
    if (n) n.textContent = cur.s.reviews || 0;
    if (l) l.innerHTML = lineHTML(cur.s);
  }

  function ensure(force) {
    var s = cur.s, k = key(s), body = document.querySelector('#rvBody');
    if (!body) return;
    var seq = ++cur.seq;
    if (cache[k] && !force) { cur.sum = cache[k]; paint(); if (cur.fresh === false) return; }
    else body.innerHTML = '<div class="rv-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>' + L('loading') + '</div>';
    cur.fresh = false;
    load(s).then(function (sum) {
      if (seq !== cur.seq || cur.s !== s) return;
      cache[k] = sum; cur.sum = sum; apply(s, sum); refreshHeader(); paint();
    }).catch(function () {
      if (seq !== cur.seq || cur.s !== s) return;
      if (!cache[k]) body.innerHTML = '<div class="rv-fail"><i class="fa-solid fa-triangle-exclamation"></i><span>' + L('load_err') + '</span><button type="button" class="btn btn-ghost btn-sm" data-rv-retry>' + L('retry') + '</button></div>';
    });
  }

  function setStars(n) {
    cur.stars = n;
    var btns = document.querySelectorAll('.rv-star');
    btns.forEach(function (b, i) { b.classList.toggle('on', i < n); b.setAttribute('aria-checked', String(i + 1 === n)); b.tabIndex = (n ? i + 1 === n : i === 0) ? 0 : -1; });
    var lbl = document.querySelector('#rvPickLbl');
    if (lbl) { lbl.textContent = n ? n + ' · ' + L('s' + n) : L('pick'); lbl.classList.toggle('set', !!n); }
  }
  function showErr(msg) { var e = document.querySelector('#rvErr'); if (!e) return; e.textContent = msg; e.hidden = !msg; }

  function paint() {
    var body = document.querySelector('#rvBody'); if (!body || !cur.sum) return;
    var sum = cur.sum, mine = sum.data.filter(function (c) { return c.mia; })[0];
    body.innerHTML = '<div class="rv-grid"><div class="rv-side">' + summaryHTML(cur.s, sum) + formHTML(mine) + '</div><div class="rv-list">' + listHTML(sum) + '</div></div>';

    var f = document.querySelector('#rvForm'), saved = ''; try { saved = localStorage.getItem('umbral_rv_nombre') || ''; } catch (_) { }
    var d = cur.draft;
    f.n.value = d ? d.n : (mine ? mine.nombre : saved);
    f.c.value = d ? d.c : (mine && mine.comentario ? mine.comentario : '');
    setStars(d ? d.stars : (mine ? mine.estrellas : 0));
    cur.draft = null;
    var cnt = document.querySelector('#rvCount'); cnt.textContent = f.c.value.length + '/600';
    f.c.addEventListener('input', function () { cnt.textContent = f.c.value.length + '/600'; });

    var pick = f.querySelector('.rv-pick');
    pick.addEventListener('mouseover', function (e) { var b = e.target.closest('.rv-star'); if (b) pick.querySelectorAll('.rv-star').forEach(function (x, i) { x.classList.toggle('hv', i < +b.dataset.star); }); });
    pick.addEventListener('mouseleave', function () { pick.querySelectorAll('.rv-star').forEach(function (x) { x.classList.remove('hv'); }); });
    pick.addEventListener('keydown', function (e) { // flechas del teclado, como un grupo de radios
      var d2 = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (!d2) return; e.preventDefault();
      var n = Math.min(5, Math.max(1, (cur.stars || 0) + d2)); setStars(n); pick.querySelectorAll('.rv-star')[n - 1].focus();
    });
    f.addEventListener('submit', function (e) { e.preventDefault(); submit(f); });
  }

  function submit(f) {
    var nombre = f.n.value.trim(), comentario = f.c.value.trim(), btn = document.querySelector('#rvSend');
    if (!cur.stars) return showErr(L('need_stars'));
    if (nombre.length < 2) { f.n.focus(); return showErr(L('need_name')); }
    showErr(''); btn.disabled = true; btn.querySelector('span').textContent = L('sending');
    var s = cur.s, p = cur.p, k = key(s);
    send(s, p, { nombre: nombre, estrellas: cur.stars, comentario: comentario }).then(function (res) {
      try { localStorage.setItem('umbral_rv_nombre', nombre); } catch (_) { }
      toast(L(res.actualizada ? 'updated' : 'thanks'));
      return load(s);
    }).then(function (sum) {
      if (cur.s !== s) return;
      cache[k] = sum; cur.sum = sum; apply(s, sum); refreshHeader(); paint();
      render(); // actualiza las estrellas en las tarjetas del listado
    }).catch(function (err) {
      var b = document.querySelector('#rvSend'); if (b) { b.disabled = false; b.querySelector('span').textContent = L('publish'); }
      showErr(L(err && err.status === 429 ? 'wait' : 'err'));
    });
  }

  /* ---------- API para detalle.js / mejoras.js ---------- */
  function init(p, s) {
    var misma = cur.id === p.id && cur.s === s;
    cur.id = p.id; cur.p = p; cur.s = s; cur.fresh = !misma ? true : cur.fresh; if (!misma) { cur.sum = null; cur.stars = 0; }
    refreshHeader();
    setTab(cur.tab || 'info');
  }

  document.addEventListener('click', function (e) {
    var tb = e.target.closest('[data-tab]'), go = e.target.closest('[data-tab-go]'), rt = e.target.closest('[data-rv-retry]'), st = e.target.closest('.rv-star');
    if (tb) { setTab(tb.dataset.tab, true); return; }
    if (go) { setTab(go.dataset.tabGo, true); return; }
    if (rt) { ensure(true); return; }
    if (st) { setStars(+st.dataset.star); showErr(''); }
  });
  document.addEventListener('keydown', function (e) { // flechas entre pestañas
    var t0 = e.target.closest && e.target.closest('.dtab');
    if (!t0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var next = t0.dataset.tab === 'info' ? 'reviews' : 'info';
    setTab(next); var b = document.querySelector('#' + (next === 'info' ? 'tabInfo' : 'tabRv')); if (b) b.focus();
  });

  hydrateDemo();
  return { tabsHTML: tabsHTML, panelHTML: panelHTML, lineHTML: lineHTML, mini: mini, init: init, beforeRender: beforeRender, hydrateDemo: hydrateDemo, stars: stars };
})();
