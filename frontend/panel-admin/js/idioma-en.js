/* =========================================================
   UMBRAL — Diccionario de inglés del panel Administrador
   Lo usa el motor común /assets/traductor-en.js. Solo se carga cuando el idioma es "en" (botones ES / EN).
   Los nombres, correos, documentos y datos de las cuentas no se traducen.
   ========================================================= */
(function () {
    'use strict';

    var DICT = {
        /* ---------- Filtros de notificaciones, perfil y avisos sueltos ---------- */
        'La imagen debe ser JPG, PNG o WEBP.': 'The image must be JPG, PNG or WEBP.', 'Filtrando por:': 'Filtering by:', 'Panel de administración (con código de verificación)': 'Admin panel (with verification code)', '2FA admin: cuenta bloqueada por códigos incorrectos': '2FA admin: account locked after incorrect codes', 'Inicio de sesión correcto.': 'Signed in successfully.', 'Cuenta desactivada: no se le puede enviar enlace': 'Account deactivated: a link cannot be sent to it', 'Sin rol': 'No role',
        'Pagos aprobados': 'Approved payments', 'Pagos no completados': 'Incomplete payments', 'Redirigiendo al portal oficial de UMBRAL...': 'Redirecting to the official UMBRAL portal...',
        /* ---------- Títulos, menú y barra ---------- */
        'Panel principal · UMBRAL': 'Dashboard · UMBRAL', 'Gestión de usuarios · UMBRAL': 'User management · UMBRAL', 'Verificaciones · UMBRAL': 'Verifications · UMBRAL',
        'Suscripciones y publicaciones gratis · UMBRAL': 'Subscriptions and free listings · UMBRAL', 'Movimientos · UMBRAL': 'Activity · UMBRAL',
        'Notificaciones · UMBRAL': 'Notifications · UMBRAL', 'Reportes · UMBRAL': 'Reports · UMBRAL', 'Ajustes de cuenta · UMBRAL': 'Account settings · UMBRAL', 'Mi perfil · UMBRAL': 'My profile · UMBRAL',
        'Panel': 'Dashboard', 'Panel principal': 'Dashboard', 'Panel de administración': 'Administration panel', 'Panel de administración · Colombia': 'Administration panel · Colombia',
        'Usuarios': 'Users', 'Gestión de usuarios': 'User management', 'Verificaciones': 'Verifications', 'Membresías': 'Memberships', 'Membresías y planes': 'Memberships and plans',
        'Suscripciones y publicaciones gratis': 'Subscriptions and free listings', 'Movimientos': 'Activity', 'Notificaciones': 'Notifications', 'Reportes': 'Reports',
        'Reportes y Rendimiento': 'Reports and Performance', 'Ajustes': 'Settings', 'Ajustes de cuenta': 'Account settings', 'Mi perfil': 'My profile', 'Sistema': 'System',
        'Configuración': 'Settings', 'Configuración general': 'General settings', 'Estado del sistema': 'System status', 'Operativo': 'Operational', 'Cerrar sesión': 'Log out',
        'Mostrar u ocultar el menú': 'Show or hide the menu', 'Cambiar entre modo claro y oscuro': 'Switch between light and dark mode', 'Idioma': 'Language',
        'Actividad reciente': 'Recent activity', 'Registros, pagos y errores del portal': 'Sign-ups, payments and errors on the portal', 'Ver todas las notificaciones': 'See all notifications',
        'Sin actividad por ahora.': 'No activity yet.', 'No se pudo cargar el panel': 'The panel could not be loaded',
        'Revisa tu conexión y que el servidor esté encendido, e inténtalo de nuevo.': 'Check your connection and that the server is on, then try again.',
        'Administrador': 'Administrator', 'Administradores': 'Administrators', 'Vendedor': 'Seller', 'Vendedores': 'Sellers', 'Inmobiliaria': 'Real estate agency',
        'Inmobiliarias': 'Real estate agencies', 'Invitados': 'Guests', 'Visitante': 'Visitor', 'Visitantes': 'Visitors', 'Usuario': 'User', 'Persona': 'Person',
        'Buenos días': 'Good morning', 'Buenas tardes': 'Good afternoon', 'Buenas noches': 'Good evening', 'pronto': 'soon',

        /* ---------- Panel principal ---------- */
        'Este es el estado del portal UMBRAL hoy,': 'This is the state of the UMBRAL portal today,', 'Cifras del portal': 'Portal figures', 'Usuarios del portal': 'Portal users',
        'Cuentas pendientes de verificación': 'Accounts pending verification', 'Membresías activas': 'Active memberships', 'Ingresos del mes (COP)': 'Revenue this month (COP)',
        'Distribución por rol': 'Distribution by role', 'Cómo se reparten las cuentas del portal': 'How portal accounts are distributed', 'Actividad mensual': 'Monthly activity',
        'Nuevos registros de usuarios en los últimos 12 meses': 'New user sign-ups in the last 12 months', 'Nuevos usuarios': 'New users', 'Últimas decisiones': 'Latest decisions',
        'Módulo de usuarios': 'Users module', 'Módulo de verificación': 'Verification module', 'Módulo de membresías': 'Memberships module', 'Módulo de analítica': 'Analytics module',
        'Crear, editar y verificar': 'Create, edit and verify', 'Planes y pagos': 'Plans and payments', 'Cuentas nuevas por país': 'New accounts by country', '12 meses': '12 months',

        /* ---------- Usuarios ---------- */
        'Crea, edita y administra las cuentas del portal UMBRAL.': 'Create, edit and manage the UMBRAL portal accounts.', 'Nuevo usuario': 'New user', 'Editar usuario': 'Edit user',
        'Buscar por nombre, correo o documento…': 'Search by name, email or ID…', 'Todos los roles': 'All roles', 'Rol: Todos': 'Role: All', 'Rol: vendedor': 'Role: seller', 'Estado: Todos': 'Status: All',
        'vendedor': 'seller', 'inmobiliaria': 'agency', 'administrador': 'administrator', 'agente': 'agent', 'Rol de la cuenta': 'Account role', 'Rol en el panel': 'Panel role',
        'No se encontraron usuarios': 'No users found', 'Prueba con otro nombre, correo o filtro.': 'Try another name, email or filter.', 'Usuario creado': 'User created',
        'Usuario actualizado': 'User updated', 'Usuario eliminado': 'User deleted', 'No se pudo guardar': 'It could not be saved', 'No se pudo eliminar': 'It could not be deleted',
        'Enlace enviado': 'Link sent', 'No se pudo enviar el enlace': 'The link could not be sent', 'Enviar enlace': 'Send link', 'Enviar enlace para cambiar contraseña': 'Send password change link',
        '¿Enviar enlace para cambiar la contraseña?': 'Send a link to change the password?', 'Le llegará a': 'It will be sent to', 'al correo': 'to the email',
        'El enlace vence en 60 minutos y solo sirve una vez. Su contraseña actual no cambia hasta que la persona elija una nueva.': 'The link expires in 60 minutes and works only once. Their current password does not change until the person chooses a new one.',
        '¿Eliminar esta cuenta?': 'Delete this account?', 'Vas a eliminar la cuenta de': 'You are about to delete the account of', 'Atención: esta acción es permanente.': 'Warning: this action is permanent.',
        'No podrás recuperar la información eliminada. Comprueba que estás seleccionando la cuenta correcta antes de continuar.': 'You will not be able to recover the deleted information. Check that you selected the right account before continuing.',
        'También se eliminarán las publicaciones de esta cuenta y los datos asociados, como sus fotos, contactos y visitas relacionadas.': 'This account’s listings and related data, such as photos, contacts and visits, will also be deleted.',
        '¿Confirmas que deseas asumir este riesgo?': 'Do you confirm you want to take this risk?', 'Sí, eliminar todo': 'Yes, delete everything',
        '(déjala vacía para no cambiarla)': '(leave it empty to keep it)', 'No se puede cambiar después de crear la cuenta': 'It cannot be changed after creating the account',
        '(solo se define al crear la cuenta)': '(only set when creating the account)', '(mínimo 8 caracteres)': '(at least 8 characters)', '(opcional)': '(optional)',
        '10 dígitos, empieza por 3.': '10 digits, starting with 3.', 'Solo números, entre 6 y 10 dígitos.': 'Numbers only, between 6 and 10 digits.', 'Ej: María Fernanda López': 'E.g.: María Fernanda López',
        'Repite la contraseña': 'Repeat the password', 'Mínimo 8 caracteres': 'At least 8 characters', 'Contraseña': 'Password', 'Tu sesión expiró': 'Your session expired',
        'Vuelve a iniciar sesión para continuar.': 'Log in again to continue.', 'Revisa los campos': 'Check the fields', 'Hay datos inválidos en el formulario.': 'There is invalid data in the form.',
        'Intenta de nuevo.': 'Try again.', 'Error de conexión': 'Connection error', 'No se pudo contactar al servidor.': 'The server could not be reached.',
        'No se pudo contactar al servidor. Revisa tu conexión.': 'The server could not be reached. Check your connection.', 'No se pudo cargar la lista de usuarios.': 'The user list could not be loaded.',
        'Gestión de usuarios:': 'User management:', 'El rol y el estado de esta cuenta solo se cambian desde': 'The role and status of this account can only be changed from',
        'El rol y el estado no se cambian aquí.': 'The role and status are not changed here.', 'Solo se cambia desde Gestión de usuarios': 'Only changed from User management',
        'Elegir…': 'Choose…', 'CC': 'CC', 'No registrado': 'Not registered',

        /* ---------- Verificaciones ---------- */
        'Aprueba o rechaza las cuentas pendientes. Cada decisión queda registrada.': 'Approve or reject pending accounts. Every decision is recorded.', 'Resumen de verificaciones': 'Verifications summary',
        'Pendientes': 'Pending', 'pendientes': 'pending', 'Aprobadas': 'Approved', 'Aprobados': 'Approved', 'Rechazadas': 'Rejected', 'Aprobada': 'Approved', 'Rechazada': 'Rejected',
        'Tasa de aprobación': 'Approval rate', 'Datos a verificar': 'Details to verify', 'Aprobar': 'Approve', 'Rechazar': 'Reject', 'Aprobar cuenta': 'Approve account', 'Rechazar cuenta': 'Reject account',
        'No hay cuentas pendientes': 'No pending accounts', 'Todo está al día. Las nuevas cuentas aparecerán aquí.': 'Everything is up to date. New accounts will appear here.',
        'Decisiones registradas': 'Recorded decisions', 'Decisiones tomadas por ti en el proceso de verificación.': 'Decisions you made in the verification process.', 'Todas las decisiones': 'All decisions',
        'Decidió': 'Decided by', 'Decisión': 'Decision', 'Motivo': 'Reason', 'Nota': 'Note', 'Sin nota': 'No note', 'Sin decisiones para mostrar': 'No decisions to show', 'Sin decisiones todavía': 'No decisions yet',
        'Todavía no hay decisiones registradas.': 'There are no recorded decisions yet.', 'Cuando realices una verificación, aparecerá aquí.': 'When you verify an account, it will appear here.',
        'Verificaciones aprobadas': 'Approved verifications', 'Verificaciones rechazadas': 'Rejected verifications', 'Verificaciones que aprobaste o rechazaste.': 'Verifications you approved or rejected.',
        'Cuando apruebes o rechaces cuentas, quedarán registradas aquí.': 'When you approve or reject accounts, they will be recorded here.', 'Sin teléfono': 'No phone',
        'Motivo del rechazo': 'Rejection reason', '(obligatorio, mínimo 5 caracteres)': '(required, at least 5 characters)', 'Ej: El documento no es legible, sube una foto clara.': 'E.g.: The document is not readable, upload a clear photo.',
        'Escribe el motivo del rechazo.': 'Enter the rejection reason.', 'El motivo debe tener al menos 5 caracteres.': 'The reason must be at least 5 characters.',
        'Cuenta rechazada': 'Account rejected', 'Cuenta aprobada': 'Account approved', 'Cuenta ya revisada': 'Account already reviewed', 'No se pudo guardar la decisión': 'The decision could not be saved',
        'No se pudo cargar la lista': 'The list could not be loaded', 'No se pudo cargar el historial': 'The history could not be loaded', 'Cuenta eliminada': 'Account deleted',

        /* ---------- Suscripciones ---------- */
        'Paquetes de inmobiliaria y de vendedor, publicaciones gratis de las cuentas nuevas, pagos y filtros.': 'Agency and seller packages, free listings for new accounts, payments and filters.',
        'Paquetes de inmobiliaria': 'Agency packages', 'Paquetes de vendedor': 'Seller packages', 'Nuevo paquete': 'New package', 'Nuevo paquete de vendedor': 'New seller package',
        'Nuevo paquete de inmobiliaria': 'New agency package', 'Editar paquete': 'Edit package', 'Precio del paquete': 'Package price', 'Precio en pesos': 'Price in pesos',
        'Publicaciones incluidas': 'Included listings', 'Propiedades incluidas': 'Included properties', 'Días de duración': 'Duration in days', 'Descuento (%)': 'Discount (%)', 'Descuento': 'Discount',
        'Zona del portal': 'Portal zone', 'Visible para inmobiliarias': 'Visible to agencies', 'Visible para vendedores': 'Visible to sellers', 'Oculto para inmobiliarias': 'Hidden from agencies',
        'Oculto para vendedores': 'Hidden from sellers', 'Plan base': 'Base plan', 'Creado por el administrador': 'Created by the administrator', 'Recalcular': 'Recalculate', 'Borrar': 'Delete',
        'Ej.: Bronce': 'E.g.: Bronze', 'Ej.: Express': 'E.g.: Express', 'Cupos': 'Slots', 'Vigencia': 'Validity', 'Vigente': 'Active', 'Vigentes': 'Active', 'Vencida': 'Expired', 'Vencidas': 'Expired',
        'Vencido': 'Expired', 'Canceladas': 'Canceled', 'Por vencer': 'Expiring', 'Cancelar membresía': 'Cancel membership', 'Sin referencia': 'No reference', 'Predeterminado': 'Default',
        'Dónde aparecen las propiedades de este paquete en el portal: Oro arriba, luego Plata y Bronce.': 'Where this package’s properties appear on the portal: Gold at the top, then Silver and Bronze.',
        'Este es un plan base: sus días, propiedades y zona no se pueden cambiar. Sí puedes cambiar el nombre y el precio.': 'This is a base plan: its days, properties and zone cannot be changed. You can change the name and price.',
        'Se calcula con los planes base según los días y las propiedades. Puedes cambiarlo.': 'It is calculated from the base plans by days and properties. You can change it.',
        'Publicaciones con descuento. El precio se calcula con el precio del plan: publicaciones × plan × (1 − descuento).': 'Listings with a discount. The price is calculated from the plan price: listings × plan × (1 − discount).',
        'Paquetes que han comprado las inmobiliarias: quién, cuándo, hasta cuándo y su estado.': 'Packages bought by agencies: who, when, until when and their status.',
        'Planes que han comprado los vendedores: quién, cuándo, hasta cuándo y su estado.': 'Plans bought by sellers: who, when, until when and their status.',
        'Compras de paquetes': 'Package purchases', 'Compras de paquetes de inmobiliaria': 'Agency package purchases', 'Compras de vendedores': 'Seller purchases',
        'Todavía no hay compras de paquetes': 'There are no package purchases yet', 'Todavía no hay compras de vendedores': 'There are no seller purchases yet',
        'Aún no hay paquetes. Crea el primero con «Nuevo paquete».': 'There are no packages yet. Create the first one with «New package».',
        'Propiedades gratuitas': 'Free properties', 'Propiedades gratuitas para cuentas nuevas': 'Free properties for new accounts', 'Publicaciones gratis': 'Free listings',
        'Las cuentas que ya existen no cambian.': 'Existing accounts do not change.', 'Sin límite': 'No limit',
        '(0 a 5 · vendedor e inmobiliaria · vacío = el número de cuentas nuevas)': '(0 to 5 · seller and agency · empty = the number for new accounts)',
        'Posicionamiento de normales': 'Boosting standard listings', 'La propiedad normal sale antes en el portal durante el plazo.': 'The standard property shows earlier on the portal during the period.',
        'Pasado el plazo, la propiedad vuelve a borrador.': 'After the period, the property goes back to draft.', 'Mensual (30 días)': 'Monthly (30 days)', 'Quincenal (15 días)': 'Biweekly (15 days)',
        'Semanal (7 días)': 'Weekly (7 days)', 'Pagos de membresías': 'Membership payments', 'Pagos y filtros': 'Payments and filters', 'Estado del pago': 'Payment status', 'Todos los pagos': 'All payments',
        'Pagos registrados en el periodo de arriba (Desde / Hasta). Puedes combinar los filtros.': 'Payments recorded in the period above (From / To). You can combine the filters.',
        'Pago desde': 'Payment from', 'Monto': 'Amount', 'Monto desde $': 'Amount from $', 'Monto máximo': 'Maximum amount', 'Monto mínimo': 'Minimum amount', 'hasta $': 'up to $', 'hasta': 'to',
        'Plan: Todos': 'Plan: All', 'No completados': 'Not completed', 'Pago': 'Payment', 'No hay membresías para mostrar': 'No memberships to show',
        'Cuentas con membresía vigente': 'Accounts with an active membership', 'Cuentas con membresía vencida': 'Accounts with an expired membership', 'Vencen en los próximos 7 días': 'Expiring in the next 7 days',
        'No se pudieron cargar las membresías.': 'The memberships could not be loaded.', 'No se pudieron cargar los paquetes.': 'The packages could not be loaded.',
        'No se pudieron cargar las compras de paquetes.': 'The package purchases could not be loaded.', 'No se pudo cargar el número de publicaciones gratis.': 'The number of free listings could not be loaded.',
        'No se pudo guardar.': 'It could not be saved.', 'No se pudieron cargar los planes de publicación.': 'The listing plans could not be loaded.',
        '¿Cancelar esta membresía? La cuenta dejará de tener posicionamiento. Esta acción no se puede deshacer.': 'Cancel this membership? The account will lose its boost. This action cannot be undone.',
        'Zona Oro · Plan base': 'Gold zone · Base plan', 'Zona Plata · Plan base': 'Silver zone · Base plan', 'Zona Bronce · Plan base': 'Bronze zone · Base plan',

        /* ---------- Movimientos ---------- */
        'Seguridad': 'Security', 'Inicios de sesión': 'Logins', 'Acciones en su panel': 'Actions in their panel', 'Cambios de contraseña y bloqueos': 'Password changes and lockouts',
        'Intentos fallidos, bloqueos y recuperaciones de contraseña.': 'Failed attempts, lockouts and password recoveries.', 'Cada vez que alguien entra a su panel.': 'Every time someone logs into their panel.',
        'Lo que hacen dentro de su panel.': 'What they do inside their panel.', 'Aquí aparecerá cada inicio de sesión (se guardan desde ahora en adelante).': 'Every login will appear here (saved from now on).',
        'Aquí aparecerán los intentos fallidos, los bloqueos y los cambios de contraseña.': 'Failed attempts, lockouts and password changes will appear here.',
        'Aparecerán aquí cuando este panel empiece a registrar sus acciones.': 'They will appear here when this panel starts recording its actions.',
        'Intento de acceso fallido': 'Failed login attempt', 'Cuenta bloqueada': 'Account locked', 'Pidió recuperar su contraseña': 'Requested password recovery', 'Cambió su contraseña': 'Changed their password',
        'Se le envió enlace de contraseña': 'A password link was sent to them', 'Inicio de sesión': 'Login', 'Creó una cuenta': 'Created an account', 'Editó una cuenta': 'Edited an account',
        'Eliminó una cuenta': 'Deleted an account', 'Aprobó una verificación': 'Approved a verification', 'Rechazó una verificación': 'Rejected a verification', 'Envió enlace de contraseña': 'Sent a password link',
        'Editó su perfil': 'Edited their profile', 'Cambió las publicaciones gratis de cuentas nuevas': 'Changed the free listings for new accounts',
        'Acción': 'Action', 'Acciones': 'Actions', 'Acción: Todas': 'Action: All', 'Detalle': 'Details', 'Dirección IP': 'IP address', 'IP (ej: 190.25.)': 'IP (e.g.: 190.25.)', 'Dispositivo': 'Device',
        'Navegador': 'Browser', 'Hora': 'Time', 'Orden': 'Order', 'Sin fecha': 'No date', 'Revisa los filtros': 'Check the filters', 'Cuenta eliminada o desconocida': 'Deleted or unknown account',
        'Ningún movimiento coincide con estos filtros': 'No activity matches these filters', 'Prueba quitando algún filtro o con “Limpiar”.': 'Try removing a filter or use “Clear”.',
        'Todavía no hay movimientos aquí': 'There is no activity here yet', 'Todavía no hay registros aquí': 'There are no records here yet', 'Sin registros': 'No records', 'Registros': 'Records', 'Registro': 'Sign-up',
        'Nombre, contacto o IP…': 'Name, contact or IP…', 'Todos los visitantes': 'All visitors', 'Solo los que dejaron sus datos': 'Only those who left their details', 'Dejaron datos': 'Left details',
        'No dejó datos de contacto': 'Left no contact details', 'Ningún visitante coincide con estos filtros': 'No visitor matches these filters', 'Ningún contacto coincide con estos filtros': 'No contact matches these filters',
        'Aquí aparecerán las personas que dejen su nombre y contacto en “Contactar al vendedor”.': 'People who leave their name and contact in “Contact the seller” will appear here.',
        'Aquí aparecerá cada visitante que entre al portal sin cuenta (se guardan desde que el panel de invitado empiece a enviarlos).': 'Every visitor who enters the portal without an account will appear here (saved once the guest panel starts sending them).',
        'Favoritos': 'Favorites', 'No tiene publicaciones en favoritos.': 'They have no favorite listings.', 'Publicaciones': 'Listings', 'Publicaciones vistas': 'Listings viewed',
        'Todavía no abrió ninguna publicación.': 'They have not opened any listing yet.', 'No ha dejado sus datos.': 'They have not left their details.', 'Sin entradas registradas.': 'No visits recorded.',
        'Nada coincide con la búsqueda.': 'Nothing matches the search.', 'Primera visita': 'First visit', 'Última visita': 'Last visit', 'Visita más reciente': 'Most recent visit', 'Visita más antigua': 'Oldest visit',
        'Más entradas primero': 'Most visits first', 'Más antiguas primero': 'Oldest first', 'Más antiguos primero': 'Oldest first', 'Más recientes primero': 'Newest first', 'Entradas': 'Visits',
        'Contactos dejados': 'Contacts left', 'Visitas agendadas': 'Visits scheduled', 'No se pudo cargar el visitante': 'The visitor could not be loaded', 'Errores': 'Errors', 'Fallos graves': 'Serious failures',
        'Qué pasó en el portal: seguridad de las cuentas, inicios de sesión, lo que hacen inmobiliarias, agentes y vendedores, y los visitantes.': 'What happened on the portal: account security, logins, what agencies, agents and sellers do, and visitors.',
        'miércoles': 'Wednesday', 'sábado': 'Saturday',
        'activo': 'active', 'inactivo': 'inactive', 'pendiente': 'pending', 'rechazado': 'rejected',
        'Aquí aparecerá cada visitante que entre al portal sin cuenta (se guardan desde que el panel de invitado empiece a enviar su actividad).': 'Every visitor who enters the portal without an account will appear here (saved once the guest panel starts sending their activity).',
        'Qué pasó en el portal: seguridad de las cuentas, inicios de sesión, lo que hacen inmobiliarias, agentes y vendedores, y los visitantes sin cuenta.': 'What happened on the portal: account security, logins, what agencies, agents and sellers do, and visitors without an account.',
        'Todo lo que pasa en el portal: cuentas nuevas, pagos de membresías y planes, y errores graves del sistema. Toca una tarjeta para ver solo ese tipo.': 'Everything that happens on the portal: new accounts, membership and plan payments, and serious system errors. Tap a card to see only that type.',

        /* ---------- Notificaciones ---------- */
        'Todo lo que pasa en el portal: cuentas nuevas, pagos de membresías y planes, y errores graves del sistema. Toca una tarjeta para filtrar.': 'Everything that happens on the portal: new accounts, membership and plan payments, and serious system errors. Tap a card to filter.',
        'Cuentas nuevas': 'New accounts', 'Campana': 'Bell', 'Filtrar por tipo': 'Filter by type', 'No hay notificaciones para mostrar': 'No notifications to show',
        'No se pudieron cargar las notificaciones': 'The notifications could not be loaded', 'Buscar por nombre o correo…': 'Search by name or email…',
        'Buscar por nombre o correo de la cuenta…': 'Search by account name or email…', 'Nombre, correo, plan o referencia…': 'Name, email, plan or reference…', 'Nombre, correo, referencia o ID…': 'Name, email, reference or ID…',

        /* ---------- Reportes ---------- */
        'Indicadores clave, membresías y movimiento del portal en el periodo elegido.': 'Key indicators, memberships and portal activity in the chosen period.', 'Atajos de fecha': 'Date shortcuts',
        'Este mes': 'This month', 'Hoy': 'Today', 'Aplicar filtro': 'Apply filter', 'Exportar Inmuebles CSV': 'Export Properties CSV', 'Exportar Transacciones CSV': 'Export Transactions CSV',
        'Ingresos por membresías': 'Membership revenue', 'Ingresos por membresías (COP)': 'Membership revenue (COP)', 'Por estado, en el periodo.': 'By status, in the period.',
        'País de residencia, en el periodo.': 'Country of residence, in the period.', 'Sin visitas en el periodo.': 'No visits in the period.', 'Sin cuentas nuevas en el periodo.': 'No new accounts in the period.',
        'Ningún pago coincide con estos filtros. Prueba quitando alguno o con «Limpiar».': 'No payment matches these filters. Try removing one or use «Clear».',
        'No hay pagos en el periodo seleccionado. Prueba ampliando el rango de fechas.': 'There are no payments in the selected period. Try widening the date range.',
        'Elige las dos fechas para consultar el periodo.': 'Choose both dates to query the period.', 'La fecha de inicio no puede ser posterior a la fecha final.': 'The start date cannot be after the end date.',
        'No fue posible exportar el reporte. Inténtalo de nuevo.': 'The report could not be exported. Try again.', 'La fecha "Desde" no puede ser después de la fecha "Hasta".': 'The "From" date cannot be after the "To" date.',
        'Prueba quitando algún filtro.': 'Try removing a filter.', 'Sin resultados': 'No results',

        /* ---------- Ajustes y perfil ---------- */
        'Mira cuándo entraste a tu cuenta y actualiza la contraseña con la que entras al panel.': 'See when you logged into your account and update the password you use for the panel.',
        'Historial de mis accesos': 'My login history', 'Cada vez que entraste al panel de administración con esta cuenta.': 'Every time you logged into the administration panel with this account.',
        'Todavía no hay accesos guardados': 'There are no saved logins yet', 'Tus próximos inicios de sesión aparecerán aquí.': 'Your next logins will appear here.', 'Último acceso': 'Last login',
        'Accesos en los últimos 30 días': 'Logins in the last 30 days', 'Intentos fallidos a tu cuenta (30 días)': 'Failed attempts on your account (30 days)', 'Contraseña nueva': 'New password',
        'Confirmar contraseña nueva': 'Confirm new password', 'Usa una de al menos 8 caracteres y no la compartas con nadie del equipo.': 'Use one with at least 8 characters and do not share it with anyone on the team.',
        'Contraseña actualizada correctamente.': 'Password updated successfully.', 'No se pudo cargar tus accesos.': 'Your logins could not be loaded.',
        'Tus datos y tu acceso al panel': 'Your details and your panel access', 'Editar mis datos': 'Edit my details', 'Cambiar foto': 'Change photo', 'Cambiar foto de perfil': 'Change profile photo',
        'Guardar foto': 'Save photo', 'Vista previa de la nueva foto': 'Preview of the new photo', 'así se verá tu foto': 'this is how your photo will look', 'Miembro desde': 'Member since',
        'Mis acciones recientes': 'My recent actions', 'Lo último que hiciste en el panel.': 'The last things you did in the panel.', 'Dato fijo': 'Fixed data',
        'Te la pedimos porque cambiaste el correo con el que inicias sesión.': 'We ask for it because you changed the email you log in with.', 'Cuenta no disponible': 'Account not available',
        'Correo no disponible': 'Email not available', 'Selecciona una imagen.': 'Select an image.', 'Foto de perfil actualizada correctamente.': 'Profile photo updated successfully.',
        'No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.': 'The photo could not be uploaded. Check your connection and try again.', 'El nombre debe tener al menos 3 letras.': 'The name must have at least 3 letters.',
        'Escribe un correo válido (ejemplo: nombre@correo.com).': 'Enter a valid email (example: name@email.com).', 'Debe tener 10 dígitos y empezar por 3 (ejemplo: 3001234567).': 'It must have 10 digits and start with 3 (example: 3001234567).',
        'La cédula debe tener entre 6 y 10 dígitos.': 'The ID must have between 6 and 10 digits.', 'Escribe tu contraseña actual para cambiar el correo.': 'Enter your current password to change the email.',
        'Tus datos se guardaron correctamente.': 'Your details were saved successfully.', 'No se pudieron guardar los datos.': 'The details could not be saved.', 'Esta cuenta no tiene acceso al panel de administración.': 'This account has no access to the administration panel.'
    };

    var CONTEOS = { 'inmobiliarias': 'agencies', 'por vencer': 'expiring', 'en otro estado': 'in another status', 'propiedad': 'property', 'propiedades': 'properties', 'meses': 'months' };

    function reglas(h) {
        var t = h.t;
        /* traduce una palabra que el servidor escribe en minúscula (nombre, semanal…) */
        function minus(x) { var c = x.charAt(0).toUpperCase() + x.slice(1), r = t(c); return r === c ? x : r.toLowerCase(); }
        return [
            [/^Mostrando (\d+)[–-](\d+) de (\d+) (accesos|membresías|notificaciones|pagos|registros|usuarios|movimientos|visitantes|contactos|decisiones|compras)$/, function (m) {
                var en = { accesos: 'logins', 'membresías': 'memberships', notificaciones: 'notifications', pagos: 'payments', registros: 'records', usuarios: 'users', movimientos: 'activities', visitantes: 'visitors', contactos: 'contacts', decisiones: 'decisions', compras: 'purchases' }[m[4]];
                return 'Showing ' + m[1] + '–' + m[2] + ' of ' + m[3] + ' ' + en;
            }],
            [/^(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Sept|Oct|Nov|Dic) (\d{2})$/, function (m) { return { Ene: 'Jan', Feb: 'Feb', Mar: 'Mar', Abr: 'Apr', May: 'May', Jun: 'Jun', Jul: 'Jul', Ago: 'Aug', Sep: 'Sep', Sept: 'Sep', Oct: 'Oct', Nov: 'Nov', Dic: 'Dec' }[m[1]] + ' ' + m[2]; }],
            [/^Nuevo registro: (.+)$/, function (m) { return 'New sign-up: ' + m[1]; }],
            [/^Pago aprobado: (.+)$/, function (m) { return 'Payment approved: ' + t(m[1]); }],
            [/^Posic\. (\d+) días$/, function (m) { return 'Boost ' + m[1] + ' days'; }],
            [/^Descuento (\d+) %$/, function (m) { return m[1] + '% discount'; }],
            [/^(\d+) publicaciones$/, function (m) { return m[1] + ' listings'; }],
            [/^faltan (\d+) d$/, function (m) { return m[1] + ' d left'; }],
            [/^ID (\d+)$/, function (m) { return 'ID ' + m[1]; }],
            [/^Último acceso · IP (.+)$/, function (m) { return 'Last login · IP ' + m[1]; }],
            [/^(.+) · \$([\d.]+) COP$/, function (m) { return m[1] + ' · $' + m[2] + ' COP'; }],
            [/^¿Borrar el paquete «(.+)»\? Esta acción no se puede deshacer\.$/, function (m) { return 'Delete the package «' + m[1] + '»? This action cannot be undone.'; }],
            [/^Vas a rechazar la cuenta de (.+)\. Quedará inactiva y el motivo se guardará en el historial\.$/, function (m) { return 'You are about to reject the account of ' + m[1] + '. It will become inactive and the reason will be saved in the history.'; }],
            [/^Vas a aprobar la cuenta de (.+)\. Quedará activa y la decisión se guardará en el historial\.$/, function (m) { return 'You are about to approve the account of ' + m[1] + '. It will become active and the decision will be saved in the history.'; }],
            [/^La imagen pesa (.+) y no puede superar (\d+) MB\.$/, function (m) { return 'The image weighs ' + m[1] + ' and cannot exceed ' + m[2] + ' MB.'; }],
            /* detalles de movimientos que escribe el servidor (en español) */
            [/^Contraseña incorrecta \(intento (\d+) de (\d+)\)$/, function (m) { return 'Wrong password (attempt ' + m[1] + ' of ' + m[2] + ')'; }],
            [/^Contraseña incorrecta en el panel de administración \(intento (\d+) de (\d+)\)$/, function (m) { return 'Wrong password in the admin panel (attempt ' + m[1] + ' of ' + m[2] + ')'; }],
            [/^Correo no registrado: (.+)$/, function (m) { return 'Email not registered: ' + m[1]; }],
            [/^Bloqueada (\d+) minutos tras (\d+) (intentos fallidos|contraseñas incorrectas en el panel de administración|códigos de verificación incorrectos)$/, function (m) {
                var que = { 'intentos fallidos': 'failed attempts', 'contraseñas incorrectas en el panel de administración': 'wrong passwords in the admin panel', 'códigos de verificación incorrectos': 'wrong verification codes' }[m[3]];
                return 'Locked for ' + m[1] + ' minutes after ' + m[2] + ' ' + que;
            }],
            [/^Cuentas nuevas: de (\d+) a (\d+) publicaciones gratis$/, function (m) { return 'New accounts: from ' + m[1] + ' to ' + m[2] + ' free listings'; }],
            [/^Cambió: (.+)$/, function (m) { return 'Changed: ' + m[1].split(/,\s*/).map(minus).join(', '); }],
            [/^Enviamos el enlace a (.+)$/, function (m) { return 'We sent the link to ' + m[1]; }],
            [/^Plan actualizado: (.+)$/, function (m) { return 'Plan updated: ' + minus(m[1]); }],
            [/^Tipo: (.+)$/, function (m) { return 'Type: ' + t(m[1]); }],
            [/^Rol: (.+)$/, function (m) { return 'Role: ' + t(m[1]); }],
            [/^Búsqueda: "(.*)"$/, function (m) { return 'Search: "' + m[1] + '"'; }],
            [/^Desde (\d{2}\/\d{2}\/\d{4})$/, function (m) { return 'From ' + m[1]; }],
            [/^Hasta (\d{2}\/\d{2}\/\d{4})$/, function (m) { return 'To ' + m[1]; }],
            [/^No se pudo cargar el perfil: (.*)$/, function (m) { return 'The profile could not be loaded: ' + m[1]; }],
            [/^No se pudieron cargar los (pagos|reportes): (.*)$/, function (m) { return 'The ' + (m[1] === 'pagos' ? 'payments' : 'reports') + ' could not be loaded: ' + m[2]; }],
            [/^Cuántas propiedades puede tener publicadas.*$/, function () { return 'How many properties each seller or agency that signs up from now on can have published without paying. After that, they must buy a plan.'; }],
            [/^Propiedades destacadas durante unos días por un precio fijo\..*$/, function () { return 'Properties featured for a few days for a fixed price. Weekly, Biweekly and Monthly are the base plans: they keep their days, properties and zone.'; }],
            [/^Son 3 plazos fijos: semanal \(7 días\), quincenal \(15 días\) y mensual \(30 días\)\..*$/, function () { return 'There are 3 fixed periods: weekly (7 days), biweekly (15 days) and monthly (30 days). Here you only change the price and whether the plan is active.'; }]
        ];
    }

    window.UMBRAL_EN = (window.UMBRAL_EN || []).concat([{ dict: DICT, conteos: CONTEOS, reglas: reglas }]);
})();
