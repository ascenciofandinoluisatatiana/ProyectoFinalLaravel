<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
     | Pasarela de pagos Wompi (Bancolombia). Las llaves salen del panel de comercios:
     | comercios.wompi.co → Desarrolladores. Con llaves de PRUEBAS (pub_test_..., prv_test_...)
     | no se cobra dinero real. Si no hay llaves, los pagos quedan en modo SIMULADO.
     */
    'wompi' => [
        'public_key' => env('WOMPI_PUBLIC_KEY'),
        'private_key' => env('WOMPI_PRIVATE_KEY'),
        'integrity_secret' => env('WOMPI_INTEGRITY_SECRET'),
        'events_secret' => env('WOMPI_EVENTS_SECRET'),
        // sandbox (pruebas) o production
        'api_url' => env('WOMPI_API_URL', 'https://sandbox.wompi.co/v1'),
        'checkout_url' => env('WOMPI_CHECKOUT_URL', 'https://checkout.wompi.co/p/'),
    ],

    /*
     | Captcha Cloudflare Turnstile para el formulario "Registrar inmueble" de la inmobiliaria.
     | Claves gratis en dash.cloudflare.com → Turnstile. Sin claves, el captcha no se pide.
     */
    'turnstile' => [
        'site_key' => env('TURNSTILE_SITE_KEY'),
        'secret_key' => env('TURNSTILE_SECRET_KEY'),
    ],

    /*
     | DeepSeek: lee la foto del documento de identidad que se sube al registrarse.
     | La clave se crea en platform.deepseek.com → API keys y va SOLO en el .env del backend.
     | Sin clave, la IA "no está disponible" y las cuentas quedan pendientes para el administrador.
     */
    'deepseek' => [
        'key' => env('DEEPSEEK_API_KEY'),
        'url' => env('DEEPSEEK_URL', 'https://api.deepseek.com/chat/completions'),
        'model' => env('DEEPSEEK_MODEL', 'deepseek-flash'),
        'timeout' => env('DEEPSEEK_TIMEOUT', 30),
        // Puntaje (0 a 100): desde 'puntaje_aprobar' la IA aprueba sola; entre 'puntaje_revision' y
        // 'puntaje_aprobar' menos uno la cuenta queda pendiente para el administrador; menos de
        // 'puntaje_revision' la IA la rechaza sola.
        'puntaje_aprobar' => (int) env('DEEPSEEK_PUNTAJE_APROBAR', 90),
        'puntaje_revision' => (int) env('DEEPSEEK_PUNTAJE_REVISION', 70),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
