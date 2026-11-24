    /* ============ i18n aplicar ============ */
    function applyI18n() {
      document.documentElement.lang = lang;
      $$('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n));
      $$('[data-i18n-ph]').forEach(e => e.placeholder = t(e.dataset.i18nPh));
      /* IV7 · nombre accesible de los enlaces e iconos que en celular quedan sin texto visible */
      $$('[data-i18n-aria]').forEach(e => { const n = t(e.dataset.i18nAria); e.setAttribute('aria-label', n); if (e.tagName === 'A') e.title = n; });
      const fp = $('#filters'); if (fp) fp.setAttribute('aria-label', t('f_btn'));
      $('#lang').value = lang;
      $('#langPill').textContent = LANG_NAMES[lang];
      buildFilters(); updateBanner(); renderSellers(); render();
    }
    function updateBanner() {
      const now = new Date(), h = +new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' }).format(now) % 24;
      $('#greet').textContent = t(h < 12 ? 'g_morning' : h < 19 ? 'g_afternoon' : 'g_evening');
      const d = new Intl.DateTimeFormat(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' }).format(now);
      $('#bannerText').textContent = `${t('banner_text')} ${d}.`;
      $('#clock').textContent = new Intl.DateTimeFormat(LOCALES[lang], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }).format(now);
    }
    setInterval(updateBanner, 30000);
