/* =========================================================
   UMBRAL — Diccionario de inglés del panel Vendedor
   Se suma al de Inmobiliaria/Agente (/inmobiliaria/js/idioma-en.js), que trae lo común
   (formulario del inmueble, estados, fechas). El motor está en /assets/traductor-en.js.
   Solo se carga cuando el idioma es "en" (botones ES / EN).
   ========================================================= */
(function () {
    'use strict';

    var DICT = {
        /* ---------- Títulos y menú ---------- */
        'Inicio · Umbral': 'Home · Umbral', 'Vender · Umbral': 'Sell · Umbral', 'Arrendar · Umbral': 'Rent out · Umbral',
        'Contactos · Umbral': 'Contacts · Umbral', 'Historial · Umbral': 'History · Umbral', 'Mi perfil · Umbral': 'My profile · Umbral',
        'Inicio': 'Home', 'Vender': 'Sell', 'Arrendar': 'Rent out', 'Mi perfil': 'My profile', 'Mis operaciones': 'My operations',
        'Panel del vendedor': 'Seller panel', 'Vendedor · Persona': 'Seller · Individual', 'Secciones de la página': 'Page sections',
        'Mira cómo ven los visitantes tus inmuebles.': 'See how visitors see your properties.',

        /* ---------- Inicio ---------- */
        'Hola,': 'Hello,', '¿Qué quieres hacer hoy?': 'What do you want to do today?',
        'Desde aquí administras todo lo que publicas en Umbral. Elige qué quieres hacer hoy y entra a tu panel.': 'From here you manage everything you publish on Umbral. Choose what you want to do today and go to your panel.',
        'Opciones del vendedor': 'Seller options', 'Cada opción tiene su propio panel con inmuebles, contactos y visitas.': 'Each option has its own panel with properties, contacts and visits.',
        'Panel de ventas': 'Sales panel', 'Panel de arriendos': 'Rentals panel', 'Ir al panel de ventas': 'Go to the sales panel', 'Ir al panel de arriendos': 'Go to the rentals panel',
        'Publica tu inmueble, recibe ofertas de compradores reales y cierra la venta con acompañamiento.': 'Publish your property, get offers from real buyers and close the sale with support.',
        'Encuentra inquilinos, coordina visitas y administra tus arriendos desde un solo lugar.': 'Find tenants, coordinate visits and manage your rentals from one place.',
        'Lo que puedes hacer como vendedor': 'What you can do as a seller', 'Registrar inmuebles': 'Register properties', 'Carga los datos de cada propiedad.': 'Enter each property’s details.',
        'Gestionar contactos': 'Manage contacts', 'Responde a cada interesado.': 'Reply to each interested person.', 'Gestionar visitas': 'Manage visits',
        'Confirma y organiza tu agenda.': 'Confirm and organize your schedule.', 'Contratar membresía': 'Buy a membership', 'Semanal, quincenal o mensual.': 'Weekly, biweekly or monthly.',
        'Cerrar ventas y arriendos': 'Close sales and rentals', 'Lleva el control de cada negocio.': 'Keep track of each deal.', 'No se pudo cargar el resumen.': 'The summary could not be loaded.',
        'Inmuebles en venta': 'Properties for sale', 'Inmuebles en arriendo': 'Properties for rent', 'Ventas cerradas': 'Sales closed', 'Arriendos cerrados': 'Rentals closed',
        'Contactos en total': 'Total contacts', 'Visitas próximas': 'Upcoming visits', 'Hoy': 'Today', 'Ver más': 'See more',

        /* ---------- Vender / Arrendar ---------- */
        'Tus inmuebles en venta': 'Your properties for sale', 'Tus inmuebles en arriendo': 'Your properties for rent',
        'Publica, destaca y haz seguimiento a cada comprador interesado.': 'Publish, feature and follow up with every interested buyer.',
        'Gestiona tus arriendos y coordina las visitas de posibles inquilinos.': 'Manage your rentals and coordinate visits from potential tenants.',
        'Mis inmuebles': 'My properties', 'Tus inmuebles visibles en el portal.': 'Your properties visible on the portal.', 'Publicados': 'Published',
        'Aún no tienes inmuebles en venta.': 'You have no properties for sale yet.', 'Aún no tienes inmuebles en arriendo.': 'You have no properties for rent yet.',
        'Aún no tienes inmuebles en venta': 'You have no properties for sale yet', 'Aún no tienes inmuebles en arriendo': 'You have no properties for rent yet',
        'Precio de venta (COP)': 'Sale price (COP)', 'Ciudad': 'City', 'Elige un departamento': 'Choose a department', 'Elige primero el departamento': 'Choose the department first',
        'Elige un municipio': 'Choose a municipality', 'Sin estrato': 'No stratum', 'Estrato 1': 'Stratum 1', 'Estrato 2': 'Stratum 2', 'Estrato 3': 'Stratum 3',
        'Estrato 4': 'Stratum 4', 'Estrato 5': 'Stratum 5', 'Estrato 6': 'Stratum 6', 'Fotos del inmueble': 'Property photos', 'Portada': 'Cover', 'Guardada': 'Saved',
        'Posiciona tu inmueble': 'Boost your property', 'Propiedad destacada': 'Featured property', 'Normal por tiempo': 'Standard for a period',
        'Oro, Plata o Bronce': 'Gold, Silver or Bronze', '7, 15 o 30 días': '7, 15 or 30 days', 'Pagar': 'Pay', 'Zona': 'Zone', 'Listo.': 'Done.',
        'Modo de prueba: el pago es simulado y no se cobra dinero.': 'Test mode: payment is simulated and no money is charged.',
        'Todos tus inmuebles publicados aparecen en la zona normal. Usa “Posicionar” en cada uno para subirlo a las zonas destacadas.': 'All your published properties appear in the standard zone. Use “Boost” on each one to move it up to the featured zones.',
        'Publica gratis según tu cupo · la membresía se paga por inmueble': 'Publish for free within your quota · membership is paid per property',
        'en las zonas destacadas. Los demás aparecen en la zona normal.': 'in the featured zones. The rest appear in the standard zone.',
        'Renovar posición': 'Renew position', 'Editar inmueble': 'Edit property', 'Eliminar inmueble': 'Delete property', 'Escribir': 'Write', 'Llamar': 'Call',
        '· ya pasó': '· already passed', 'ya pasó': 'already passed', 'Vendidas': 'Sold', 'Arrendadas': 'Rented', 'Marcar como vendido': 'Mark as sold', 'Marcar como arrendado': 'Mark as rented',
        'Inmueble marcado como vendido.': 'Property marked as sold.', 'Inmueble marcado como arrendado.': 'Property marked as rented.',
        'No se pudieron cargar tus datos.': 'Your data could not be loaded.', 'Inmueble eliminado': 'Property deleted', 'Inmueble eliminado.': 'Property deleted.',
        'No se pudo cargar la lista de departamentos. Recarga la página.': 'The department list could not be loaded. Reload the page.',
        'La lista de departamentos está vacía: hay que cargar los municipios en la base de datos.': 'The department list is empty: the municipalities must be loaded in the database.',
        'Escribe al menos la ciudad para buscar.': 'Enter at least the city to search.',
        'Ubicación aproximada: no encontramos la calle exacta. Arrastra el pin hasta tu inmueble.': 'Approximate location: we could not find the exact street. Drag the pin to your property.',
        'Si ya las usaste, el inmueble se guarda como borrador hasta que contrates un plan.': 'If you already used them, the property is saved as a draft until you buy a plan.',
        'La portada no puede ser un GIF: agrega al menos una foto JPG, PNG o WebP.': 'The cover cannot be a GIF: add at least one JPG, PNG or WebP photo.',
        'Subiendo fotos': 'Uploading photos', 'Inmueble actualizado.': 'Property updated.', 'Guardado como borrador. Publícalo desde su tarjeta.': 'Saved as a draft. Publish it from its card.',
        'Tu inmueble aparece destacado arriba, en la zona del paquete (Oro, Plata o Bronce), mientras dure. Elige el paquete:': 'Your property appears featured at the top, in the package zone (Gold, Silver or Bronze), while it lasts. Choose the package:',
        'Tu inmueble publicado sale de primeras en "Ver más propiedades" durante los días que elijas.': 'Your published property shows first in "See more properties" for the days you choose.',
        'Tu inmueble queda visible durante los días que elijas; al vencer vuelve a borrador.': 'Your property stays visible for the days you choose; when it expires it goes back to draft.',
        'No hay planes disponibles por ahora. Vuelve a intentarlo más tarde.': 'There are no plans available right now. Try again later.',
        '¿Eliminar este inmueble? También se quitarán sus contactos y visitas.': 'Delete this property? Its contacts and visits will also be removed.',
        'Inmueble publicado.': 'Property published.', 'Publicación pausada.': 'Listing paused.', 'Publicación reanudada.': 'Listing resumed.',
        'Contacto marcado como atendido.': 'Contact marked as attended.', 'Visita confirmada.': 'Visit confirmed.',
        'Primero registra un inmueble para poder programar visitas.': 'Register a property first to schedule visits.',
        'No tienes visitas programadas. Usa “Programar visita” o agéndalas desde tus contactos.': 'You have no scheduled visits. Use “Schedule visit” or book them from your contacts.',
        'Usa “Programar visita” o agéndalas desde tus contactos.': 'Use “Schedule visit” or book them from your contacts.',
        'Ej.: llegar por la portería principal.': 'E.g.: come in through the main entrance.', 'Nueva fecha y hora (hora de Colombia)': 'New date and time (Colombia time)',
        'Escribe los datos de quien va a visitar el inmueble.': 'Enter the details of the person visiting the property.', 'Elige la fecha y la hora de la visita.': 'Choose the date and time of the visit.',
        'Elige el inmueble.': 'Choose the property.', 'Elige la nueva fecha y hora.': 'Choose the new date and time.', 'Visita reprogramada. Queda pendiente de confirmar.': 'Visit rescheduled. It needs to be confirmed.',
        'Visita cancelada.': 'Visit canceled.', 'Visita marcada como realizada.': 'Visit marked as done.', 'Acciones': 'Actions', 'Inmueble': 'Property',
        'Falta actualizar vender.html y arrendar.html y subir js/carrusel.js: el formulario de fotos está incompleto.': 'vender.html and arrendar.html must be updated and js/carrusel.js uploaded: the photo form is incomplete.',

        /* ---------- Contactos ---------- */
        'Tus contactos': 'Your contacts', 'Lista de contactos': 'Contact list', 'Resumen de contactos': 'Contacts summary', 'Buscar contactos': 'Search contacts',
        'Buscar contacto o mensaje': 'Search contact or message', 'Contacto': 'Contact', 'Mensaje': 'Message', 'Recibido': 'Received', 'Sin atender': 'Not attended',
        'Ordenar por': 'Sort by', 'Más recientes primero': 'Newest first', 'Más antiguos primero': 'Oldest first', 'Nombre (A–Z)': 'Name (A–Z)', 'Por inmueble': 'By property',
        'Todos los inmuebles': 'All properties', 'Todo el tiempo': 'All time', 'Últimos 7 días': 'Last 7 days', 'Últimos 30 días': 'Last 30 days', 'Período': 'Period',
        'Solo venta': 'Sale only', 'Solo arriendo': 'Rent only', 'Contactos en total': 'Total contacts', 'Ayer': 'Yesterday', 'Anteriores': 'Earlier',
        'Cuando alguien se interese en tus inmuebles, lo verás aquí.': 'When someone is interested in your properties, you will see it here.',
        'Todas las personas interesadas en tus inmuebles, en un solo lugar. Filtra, responde y lleva el seguimiento de cada una.': 'All the people interested in your properties, in one place. Filter, reply and follow up with each one.',
        'Escribir un correo': 'Write an email', 'Escribir por WhatsApp': 'Write on WhatsApp', 'Sin mensaje.': 'No message.', 'Sin resultados': 'No results',
        'Ningún contacto coincide con estos filtros.': 'No contacts match these filters.', 'No se pudieron actualizar los contactos.': 'The contacts could not be updated.',
        'No se pudieron cargar tus contactos.': 'Your contacts could not be loaded.', 'Reintentar': 'Retry',

        /* ---------- Historial y avisos ---------- */
        'Tu historial': 'Your history', 'Resumen del historial': 'History summary', 'Buscar en el historial': 'Search the history', 'Ver todo el historial': 'See the whole history',
        'Todas tus notificaciones guardadas: contactos, visitas y membresías, leídas y sin leer. Filtra por tipo, fecha o estado.': 'All your saved notifications: contacts, visits and memberships, read and unread. Filter by type, date or status.',
        'Notificaciones en total': 'Total notifications', 'Notificaciones y alertas': 'Notifications and alerts', 'Alertas': 'Alerts', 'Membresías': 'Memberships', 'Todos los tipos': 'All types',
        'Marcar todo como leído': 'Mark all as read', 'Estás al día: no hay avisos por ahora.': 'You are up to date: no notices for now.',
        'Aún no tienes notificaciones. Aquí aparecerán tus contactos, visitas y avisos de membresía.': 'You have no notifications yet. Your contacts, visits and membership notices will appear here.',
        'No hay notificaciones con estos filtros.': 'No notifications match these filters.', 'No se pudo cargar tu historial.': 'Your history could not be loaded.',
        'Cargando tu historial…': 'Loading your history…', 'Cargando tus contactos…': 'Loading your contacts…',
        'Todas tus notificaciones guardadas: contactos, visitas y membresías, leídas y sin leer. Filtra por tipo, fecha o texto.': 'All your saved notifications: contacts, visits and memberships, read and unread. Filter by type, date or text.', 'No se pudo marcar como leídas.': 'They could not be marked as read.',
        'Lleva más de 24 horas esperando respuesta.': 'It has been waiting for a reply for over 24 hours.',

        /* ---------- Perfil ---------- */
        'Perfil de vendedor': 'Seller profile', 'Tu cuenta': 'Your account', 'Editar perfil': 'Edit profile', 'Tipo de cuenta': 'Account type', 'Cuenta persona': 'Individual account',
        'País de residencia': 'Country of residence', 'Repite la nueva contraseña': 'Repeat the new password', 'Mínimo 8 caracteres y diferente a la actual.': 'At least 8 characters and different from the current one.',
        'Aquí ves los datos de tu cuenta y puedes actualizarlos o cambiar tu contraseña.': 'Here you see your account details and can update them or change your password.',
        'El correo es tu usuario para iniciar sesión y tu documento ya fue verificado, por eso no se cambian aquí.': 'Your email is your username to log in and your ID was already verified, so they cannot be changed here.',
        'Escribe tu nombre.': 'Enter your name.', 'Perfil actualizado.': 'Profile updated.', 'No se pudo guardar el perfil.': 'The profile could not be saved.',
        'Completa los tres campos de contraseña.': 'Fill in the three password fields.', 'La nueva contraseña debe tener al menos 8 caracteres.': 'The new password must be at least 8 characters.',
        'No se pudo cambiar la contraseña.': 'The password could not be changed.', 'Escribe la nueva contraseña.': 'Enter the new password.', 'Escribe tu contraseña actual.': 'Enter your current password.',
        'Escribe un teléfono válido (solo números, +, espacios o guiones).': 'Enter a valid phone (only numbers, +, spaces or hyphens).',
        'Esta cuenta no tiene acceso al panel del vendedor.': 'This account has no access to the seller panel.',
        'Elige el inmueble que quieres posicionar.': 'Choose the property you want to boost.', 'Elige un inmueble.': 'Choose a property.',
        'Ese inmueble no está en ningún paquete.': 'That property is not in any package.', 'Este inmueble ya salió del portal; no se puede posicionar.': 'This property already left the portal; it cannot be boosted.'
    };

    var CONTEOS = { 'inmuebles': 'properties', 'inmueble': 'property', 'contactos sin responder': 'unanswered contacts' };

    function reglas(h) {
        var t = h.t, fecha = h.fecha;
        return [
            [/^Tienes (\d+) publicaci(?:ón|ones) gratis · para publicar más, contrata un plan$/, function (m) { return 'You have ' + m[1] + ' free listing' + (m[1] === '1' ? '' : 's') + ' · to publish more, buy a plan'; }],
            [/^(\d+) inmuebles? (?:está|están) posicionados?$/, function (m) { return m[1] + (m[1] === '1' ? ' property is' : ' properties are') + ' boosted'; }],
            [/^Te quedan (\d+) publicaci(?:ón|ones) gratis?\. Publica otro inmueble para usarlo\.$/, function (m) { return 'You have ' + m[1] + ' free listing(s) left. Publish another property to use it.'; }],
            [/^Usar un cupo \((\d+)\)$/, function (m) { return 'Use a slot (' + m[1] + ')'; }],
            [/^Posicionada · (\d+) d$/, function (m) { return 'Boosted · ' + m[1] + ' d'; }],
            [/^Vence el (.+)$/, function (m) { return 'Expires ' + fecha(m[1]); }],
            [/^Mostrar más \((\d+)\)$/, function (m) { return 'Show more (' + m[1] + ')'; }],
            [/^Escribir un correo a (.+)$/, function (m) { return 'Write an email to ' + m[1]; }],
            [/^Escribir por WhatsApp a (.+)$/, function (m) { return 'Write on WhatsApp to ' + m[1]; }],
            [/^leída el (.+)$/, function (m) { return 'read on ' + fecha(m[1]); }],
            [/^Contacto sin responder: (.+)$/, function (m) { return 'Unanswered contact: ' + m[1]; }],
            [/^Contactos sin responder: (\d+)$/, function (m) { return 'Unanswered contacts: ' + m[1]; }],
            [/^Este inmueble ya está posicionado hasta el (.+)$/, function (m) { return 'This property is already boosted until ' + fecha(m[1]); }],
            [/^Un inmueble admite máximo (\d+) fotos\.?$/, function (m) { return 'A property allows up to ' + m[1] + ' photos.'; }],
            [/^Sube al menos (\d+) fotos?\.?$/, function (m) { return 'Upload at least ' + m[1] + ' photo(s).'; }],
            [/^Máximo (\d+) fotos?\.?$/, function (m) { return 'Up to ' + m[1] + ' photo(s).'; }],
            [/^Ya tienes las (\d+) fotos.*$/, function (m) { return 'You already have the ' + m[1] + ' photos allowed.'; }],
            [/^(\d+) foto\(s\) no se pudieron guardar\. El inmueble quedó guardado; ábrelo con “Editar” y agrega las que faltan\.$/, function (m) { return m[1] + ' photo(s) could not be saved. The property was saved; open it with “Edit” and add the missing ones.'; }]
        ];
    }

    window.UMBRAL_EN = (window.UMBRAL_EN || []).concat([{ dict: DICT, conteos: CONTEOS, reglas: reglas }]);
})();
