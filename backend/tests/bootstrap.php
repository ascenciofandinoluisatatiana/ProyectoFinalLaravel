<?php

/*
 * Arranque de las pruebas automáticas.
 *
 * Las pruebas usan RefreshDatabase: BORRAN y recrean todas las tablas de la base a la que se conecten.
 * Por eso aquí se fuerza la base de pruebas ANTES de que Laravel arranque, y se detiene todo si
 * por cualquier motivo no es una base de pruebas. Así jamás se tocan los datos de desarrollo.
 *
 * Se fijan los tres lugares donde Laravel puede leer una variable de entorno
 * ($_SERVER, $_ENV y getenv), porque el contenedor ya trae DB_DATABASE=portal_inmobiliario
 * y, si alguno de los tres quedara con ese valor, ganaría sobre phpunit.xml.
 */

require __DIR__ . '/../vendor/autoload.php';

$baseDePruebas = [
    'DB_CONNECTION' => 'pgsql',
    'DB_DATABASE' => 'portal_inmobiliario_test',
    'DB_URL' => '',
];

foreach ($baseDePruebas as $nombre => $valor) {
    putenv("{$nombre}={$valor}");
    $_ENV[$nombre] = $valor;
    $_SERVER[$nombre] = $valor;
}

if (! str_ends_with((string) getenv('DB_DATABASE'), '_test')) {
    fwrite(STDERR, "\nPRUEBAS DETENIDAS: la base de datos no termina en _test.\n");
    exit(1);
}
