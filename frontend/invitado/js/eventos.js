    /* ============ eventos ============ */
    document.addEventListener('click', e => {
      const g = s => e.target.closest(s);
      let el;
      if (g('[data-fav]')) {
        e.stopPropagation(); const id = +g('[data-fav]').dataset.fav;
        favs = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
        toast(t(favs.includes(id) ? 'fav_add' : 'fav_del'));
        try { localStorage.setItem('umbral_favs', JSON.stringify(favs)) } catch (_) { }
        render(); if ($('#mDetail').classList.contains('open')) openDetail(id); return
      }
      if ((el = g('[data-pay]'))) { closeModals(); openPse(+el.dataset.pay); return }
      if ((el = g('[data-open]'))) { e.preventDefault(); closeModals(); openDetail(+el.dataset.open); return }
      if ((el = g('[data-seller]'))) { S.seller = +el.dataset.seller; setView('cards'); $('#filters').scrollIntoView({ behavior: 'smooth' }); return }
      if ((el = g('[data-prem]'))) { const tr = $('.prem-track'); if (tr) tr.scrollBy({ left: +el.dataset.prem * tr.clientWidth * .8, behavior: 'smooth' }); return }
      if (g('[data-showprem]')) { S.showPrem = true; S._anim = true; render(); S._anim = false; const rp = $('.rest-head'); if (rp) rp.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
      if (g('[data-showall]')) { S.showAll = true; S._anim = true; render(); S._anim = false; const rh = $$('.rest-head').pop(); if (rh) rh.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
      if (g('#chipX')) { S.seller = null; render(); return }
      if ((el = g('[data-op]'))) { S.op = el.dataset.op; $$('.op').forEach(b => b.classList.toggle('active', b === el)); render(); return }
      if ((el = g('[data-view]'))) { setView(el.dataset.view); return }
      if (g('[data-close]') || e.target.classList.contains('mbg')) { closeModals(); return }
      if ((el = g('[data-nav]'))) {
        const n = el.dataset.nav; $$('[data-nav]').forEach(a => a.classList.toggle('active', a === el));
        $('#sidebar').classList.remove('open'); $('#shade').classList.remove('open');
        if (n === 'calc') { openModal('#mCalc'); calc(); return }
        if (n === 'sellers') { $('#sellersAnchor').scrollIntoView({ behavior: 'smooth' }); return }
        S.favOnly = n === 'favs'; S.seller = null;
        if (n === 'map') { setView('map'); $('#filters').scrollIntoView({ behavior: 'smooth' }); return }
        if (n === 'venta' || n === 'arriendo' || n === 'all') { S.op = n; $$('.op').forEach(b => b.classList.toggle('active', b.dataset.op === n)) }
        setView('cards'); return
      }
      if (g('#clearBtn')) {
        Object.assign(S, { op: 'all', type: '', dept: '', city: '', barrio: '', max: '', beds: '', q: '', sort: 'rel', favOnly: false, seller: null, showAll: false, showPrem: false });
        $('#q').value = ''; $('#fMax').value = ''; $$('.op').forEach(b => b.classList.toggle('active', b.dataset.op === 'all')); buildFilters(); render(); return
      }
      if (g('#goExplore')) { $('#filters').scrollIntoView({ behavior: 'smooth' }); return }
      if (g('#menuBtn')) { $('#sidebar').classList.toggle('open'); $('#shade').classList.toggle('open'); return }
      if (g('#shade')) { $('#sidebar').classList.remove('open'); $('#shade').classList.remove('open') }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals() });
    $('#fType').onchange = e => { S.type = e.target.value; render() };
    $('#fDept').onchange = e => { S.dept = e.target.value; S.city = ''; S.barrio = ''; buildFilters(); render() };
    $('#fCity').onchange = e => { S.city = e.target.value; S.barrio = ''; buildFilters(); render() };
    $('#fBarrio').onchange = e => { S.barrio = e.target.value; render() };
    $('#fBeds').onchange = e => { S.beds = e.target.value; render() };
    $('#fSort').onchange = e => { S.sort = e.target.value; render() };
    $('#fMax').oninput = e => { S.max = e.target.value; render() };
    $('#q').oninput = e => { S.q = e.target.value; render() };
    $('#lang').onchange = e => { lang = e.target.value; try { localStorage.setItem('umbral_lang', lang) } catch (_) { } applyI18n() };
    ['cPrice', 'cDown', 'cRate', 'cYears'].forEach(i => $('#' + i).oninput = calc);

    /* tema claro / oscuro */
    function setTheme(th) {
      document.documentElement.dataset.theme = th;
      $('#themeBtn').innerHTML = `<i class="fa-solid ${th === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
      try { localStorage.setItem('umbral_theme', th) } catch (_) { }
    }
    $('#themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    setTheme(localStorage.getItem('umbral_theme') || 'dark');

    applyI18n();
    loadData().then(applyI18n).catch(() => toast('No se pudo conectar con el servidor; se muestran datos de ejemplo')).finally(() => { window.__loadDone = true; window.__loading = false; LOADING = false; applyI18n() });
  
