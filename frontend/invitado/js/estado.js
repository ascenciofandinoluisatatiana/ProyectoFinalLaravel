    /* ============ ESTADO ============ */
    let lang = localStorage.getItem('umbral_lang');
    if (!LANGS.includes(lang)) { // GeoIP real: lo resuelve el backend (mapeo país–idioma); aquí se usa el navegador
      const nav = (navigator.language || 'es').slice(0, 2); lang = LANGS.includes(nav) ? nav : 'en';
    }
    let LOADING = true; setTimeout(() => { if (LOADING) { LOADING = false; try { render() } catch (_) { } } }, 6000);
    const S = { op: 'all', type: '', dept: '', city: '', barrio: '', max: '', beds: '', q: '', sort: 'rel', view: 'cards', favOnly: false, seller: null, showAll: false };
    let favs = []; try { favs = JSON.parse(localStorage.getItem('umbral_favs') || '[]') } catch (e) { }
    let map = null, mapLayer = null, dmap = null;

    const t = k => (T[k] || [k])[LANGS.indexOf(lang)] || k;
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const cop = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
    const title = p => `${t('t_' + p.type)} ${p.op === 'venta' ? '' : ''}${t('in_')} ${p.barrio}`;
    const hue = id => (id * 47) % 360;
    const art = p => `linear-gradient(135deg,hsl(${260 + hue(p.id) % 50},65%,52%),hsl(${200 + hue(p.id) % 60},70%,48%))`;
    const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('show'), 3200) };
    const imgStyle = p => p.img ? `background-image:url('${p.img}')` : `background:${art(p)}`;
    const icon = p => p.img ? '' : `<i class="fa-solid ${TYPE_ICON[p.type]}"></i>`;
