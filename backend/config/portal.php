<?php

return [
    // URL del portal público (landing servida por nginx en :3000).
    // El cierre de sesión del panel devuelve al usuario ahí.
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
];
