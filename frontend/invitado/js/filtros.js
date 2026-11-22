    /* ============ filtros ============ */
    const uniq = a => [...new Set(a)].sort((x, y) => x.localeCompare(y, 'es'));
    const normB = x => String(x == null ? '' : x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    function fill(sel, opts, val, allLabel) {
      sel.innerHTML = `<option value="">${allLabel}</option>` + opts.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('');
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
      // Barrio: se escribe (sirve en cualquier municipio) y se sugieren los barrios que ya tienen inmuebles
      $('#dlBarrios').innerHTML = uniq(byC.map(p => p.barrio).filter(Boolean)).slice(0, 300).map(b => `<option value="${esc(b)}"></option>`).join('');
      $('#fBarrio').value = S.barrio || '';
      $('#fBarrio').setAttribute('placeholder', t('f_barrio_ph'));
      fill($('#fBeds'), [1, 2, 3, 4].map(n => [n, n + '+']), S.beds, t('any'));
      $('#fSort').innerHTML = [['rel', 's_rel'], ['low', 's_low'], ['high', 's_high']].map(o => `<option value="${o[0]}">${t(o[1])}</option>`).join('');
      $('#fSort').value = S.sort;
    }
    /* Buscador de texto: sin importar mayúsculas ni tildes ("ibague" encuentra "Ibagué"); cada palabra escrita debe aparecer */
    function cumpleBusqueda(p) {
      const texto = normB(`${t('t_' + p.type)} ${p.type} ${p.city} ${p.barrio} ${p.dept} ${p.addr || ''}`);
      return normB(S.q).split(/\s+/).filter(Boolean).every(w => texto.includes(w));
    }
    function filtered() {
      let r = P.filter(p =>
        (S.op === 'all' || p.op === S.op) && (!S.type || p.type === S.type) && (!S.dept || p.dept === S.dept) &&
        (!S.city || p.city === S.city) && (!S.barrio || normB(p.barrio).includes(normB(S.barrio))) && (!S.max || p.price <= +S.max) &&
        (!S.beds || p.beds >= +S.beds) && (!S.favOnly || favs.includes(p.id)) && (S.seller === null || p.seller === S.seller) &&
        (!S.q || cumpleBusqueda(p)));
      if (S.sort === 'low') r.sort((a, b) => a.price - b.price);
      else if (S.sort === 'high') r.sort((a, b) => b.price - a.price);
      else r = premRotar(r.sort((a, b) => (tierN(b) - tierN(a)) || ((b.pos ? 1 : 0) - (a.pos ? 1 : 0)) || (new Date(b.created || 0) - new Date(a.created || 0)))); // RF-053 + rotación semanal dentro de cada nivel
      return r;
    }
