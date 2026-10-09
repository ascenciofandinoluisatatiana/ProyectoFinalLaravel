<?php

/*
| CORS — qué páginas pueden llamar a la API desde el navegador.
| El frontend (localhost:3000) y la API (localhost:8010) están en puertos
| distintos, así que el navegador exige este permiso.
*/

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];