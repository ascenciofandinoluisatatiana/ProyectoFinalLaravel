/* Antes estaba escrito dentro de las páginas HTML (la política de seguridad ya no permite scripts en línea). */
try {
    var t = localStorage.getItem('umbral-tema');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
