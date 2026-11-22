/* Antes estaba escrito dentro de las páginas HTML (la política de seguridad ya no permite scripts en línea). */
(function () {
    var tema = 'light';
    try {
        var guardado = localStorage.getItem('umbral-tema');
        if (guardado === 'dark' || guardado === 'light') tema = guardado;
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', tema);
})();
