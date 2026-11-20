<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => base_path('objects'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        'documentos' => [
            'driver' => 's3',
            'key' => env('OBJECT_STORAGE_ACCESS_KEY'),
            'secret' => env('OBJECT_STORAGE_SECRET_KEY'),
            'region' => env('OBJECT_STORAGE_REGION', 'default'),
            'bucket' => env('OBJECT_STORAGE_BUCKET'),
            'endpoint' => env('OBJECT_STORAGE_ENDPOINT'),
            'use_path_style_endpoint' => env('OBJECT_STORAGE_USE_PATH_STYLE_ENDPOINT', true),
            'visibility' => 'private',
            'request_checksum_calculation' => 'when_required',
            'response_checksum_validation' => 'when_required',
            'throw' => true,
            'report' => false,
        ],

        'imagenes' => [
            'driver' => 's3',
            'key' => env('OBJECT_STORAGE_ACCESS_KEY'),
            'secret' => env('OBJECT_STORAGE_SECRET_KEY'),
            'region' => env('OBJECT_STORAGE_REGION', 'default'),
            'bucket' => env('OBJECT_STORAGE_BUCKET'),
            'endpoint' => env('OBJECT_STORAGE_ENDPOINT'),
            'use_path_style_endpoint' => env('OBJECT_STORAGE_USE_PATH_STYLE_ENDPOINT', true),
            // Prefijo del proyecto dentro del bucket: en la BD se guarda la clave sin el prefijo
            'root' => env('OBJECT_STORAGE_PREFIX', 'umbral'),
            'visibility' => 'private',
            'request_checksum_calculation' => 'when_required',
            'response_checksum_validation' => 'when_required',
            // El bucket a veces se queda "pensando" (hasta 30 s). Si no responde en 12 s se cancela
            // y se reintenta (hasta 4 intentos, en total menos de 60 s) en vez de dejar la página colgada.
            'http' => ['connect_timeout' => 4, 'timeout' => 12],
            'retries' => ['mode' => 'standard', 'max_attempts' => 4],
            'throw' => true,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => base_path('objects'),
    ],

];