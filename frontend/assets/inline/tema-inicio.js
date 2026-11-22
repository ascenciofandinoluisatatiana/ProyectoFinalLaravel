/* Antes estaba escrito dentro de las páginas HTML (la política de seguridad ya no permite scripts en línea). */
try {
    var tema = localStorage.getItem('umbral-tema');
    if (tema === 'dark' || tema === 'light') {
        document.documentElement.setAttribute('data-theme', tema);
    }
} catch (e) {}
