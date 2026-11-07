document.documentElement.classList.add('js-hero'); setTimeout(function () { if (!document.getElementById('fBackdrop')) document.documentElement.classList.remove('js-hero') }, 4000)
/* menú lateral: recuerda si el usuario lo dejó oculto (se aplica aquí, antes de pintar, para evitar parpadeo) */
try { if (localStorage.getItem('umbral_sidebar') === 'hidden') document.documentElement.classList.add('sb-hidden') } catch (e) { }
