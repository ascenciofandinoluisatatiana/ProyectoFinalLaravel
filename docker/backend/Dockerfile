# Imagen de desarrollo para Laravel 13 (requiere PHP >= 8.3).
# El código NO se copia a la imagen: docker-compose lo monta desde ./backend,
# así que esta imagen solo contiene PHP + extensiones + Composer.
FROM php:8.4-cli-bookworm

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/opt/composer \
    COMPOSER_CACHE_DIR=/opt/composer/cache \
    COMPOSER_MEMORY_LIMIT=-1 \
    HOME=/tmp

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && rm -rf /var/lib/apt/lists/*

# Extensiones que Fase 1 necesita: PostgreSQL, Redis (phpredis) y zip (Composer).
# El resto de extensiones que exige Laravel ya vienen en la imagen oficial de PHP.
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql redis zip

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Carpetas con permisos abiertos: al crear los volúmenes con nombre (vendor y caché
# de Composer) heredan estos permisos, y así el contenedor puede correr con el UID
# del usuario de tu máquina (ver HOST_UID en .env.example) sin errores de permisos.
RUN git config --system --add safe.directory '*' \
    && mkdir -p /var/www/html/vendor /opt/composer/cache \
    && chmod -R 777 /var/www/html /opt/composer

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
# sed: elimina finales de línea de Windows (CRLF) por si el archivo llegó así.
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www/html
EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
# --no-reload: obligatorio para que el servidor use las variables de entorno de
# Docker (DB, Redis) y respete PHP_CLI_SERVER_WORKERS.
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000", "--no-reload"]
