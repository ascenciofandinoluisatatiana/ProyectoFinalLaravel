    /* ============ filtros ============ */
    const uniq = a => [...new Set(a)].sort((x, y) => x.localeCompare(y, 'es'));
    function fill(sel, opts, val, allLabel) {
      sel.innerHTML = `<option value="">${allLabel}</option>` + opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('');
      sel.value = opts.some(o => String(o[0]) === String(val)) ? val : '';
    }
    function buildFilters() {
      fill($('#fType'), Object.keys(TYPE_ICON).map(k => [k, t('t_' + k)]), S.type, t('any'));
      const depts = UBIC ? UBIC.map(d => d.nombre) : uniq(P.map(p => p.dept));
      fill($('#fDept'), depts.map(d => [d, d]), S.dept, t('any'));
      const byD = P.filter(p => !S.dept || p.dept === S.dept);
      const cities = UBIC
        ? uniq(UBIC.filter(d => !S.dept || d.nombre === S.dept).flatMap(d => d.municipios))
        : uniq(byD.map(p => p.city));
      fill($('#fCity'), cities.map(d => [d, d]), S.city, t('anyf'));
      if (!cities.includes(S.city)) S.city = '';
      const byC = byD.filter(p => !S.city || p.city === S.city);
      fill($('#fBarrio'), uniq(byC.map(p => p.barrio)).map(d => [d, d]), S.barrio, t('any'));
      if (!byC.some(p => p.barrio === S.barrio)) S.barrio = '';
      fill($('#fBeds'), [1, 2, 3, 4].map(n => [n, n + '+']), S.beds, t('any'));
      $('#fSort').innerHTML = [['rel', 's_rel'], ['low', 's_low'], ['high', 's_high']].map(o => `<option value="${o[0]}">${t(o[1])}</option>`).join('');
      $('#fSort').value = S.sort;
    }
    function filtered() {
      let r = P.filter(p =>
        (S.op === 'all' || p.op === S.op) && (!S.type || p.type === S.type) && (!S.dept || p.dept === S.dept) &&
        (!S.city || p.city === S.city) && (!S.barrio || p.barrio === S.barrio) && (!S.max || p.price <= +S.max) &&
        (!S.beds || p.beds >= +S.beds) && (!S.favOnly || favs.includes(p.id)) && (S.seller === null || p.seller === S.seller) &&
        (!S.q || (`${t('t_' + p.type)} ${p.type} ${p.city} ${p.barrio} ${p.dept}`).toLowerCase().includes(S.q.toLowerCase())));
      if (S.sort === 'low') r.sort((a, b) => a.price - b.price);
      else if (S.sort === 'high') r.sort((a, b) => b.price - a.price);
      else r = premRotar(r.sort((a, b) => (tierN(b) - tierN(a)) || ((b.score || 0) - (a.score || 0)) || (b.ver - a.ver))); // RF-053 + rotación semanal dentro de cada nivel
      return r;
    }
