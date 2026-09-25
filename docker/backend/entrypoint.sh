#!/usr/bin/env bash
# Entrypoint del contenedor "app" (Laravel).
#
# Es IDEMPOTENTE: se puede ejecutar cuantas veces sea y siempre deja el
# proyecto listo, sin importar si es la primera vez, un clon nuevo o si
# alguien agregó paquetes con Composer.
set -euo pipefail

cd /var/www/html

log() { echo ">> $*"; }

prepare_project() {
    # 1) Carpetas que Laravel necesita escribir (git no versiona carpetas vacías).
    mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions \
             storage/framework/views storage/framework/testing storage/logs bootstrap/cache

    # 2) .env de Laravel: se crea solo a partir de .env.example.
    if [ ! -f .env ]; then
        log "Creando .env desde .env.example"
        cp .env.example .env
    fi

    # 3) APP_KEY: se genera una sola vez y queda guardada en .env.
    local key
    key="$(grep -E '^APP_KEY=' .env | head -n1 | cut -d= -f2- | tr -d '\r"' || true)"
    if [ -z "$key" ]; then
        log "Generando APP_KEY"
        key="base64:$(head -c 32 /dev/urandom | base64)"
        if grep -qE '^APP_KEY=' .env; then
            sed -i "s|^APP_KEY=.*|APP_KEY=${key}|" .env
        else
            printf '\nAPP_KEY=%s\n' "$key" >> .env
        fi
    fi

    # 4) Dependencias PHP. vendor/ vive en un volumen de Docker (no en tu disco).
    #    Se reinstala solo si falta o si composer.json / composer.lock cambiaron.
    local stamp_now
    stamp_now="$(cat composer.json composer.lock 2>/dev/null | md5sum | cut -d' ' -f1)"
    if [ ! -f vendor/autoload.php ] || [ "$(cat vendor/.composer-stamp 2>/dev/null || true)" != "$stamp_now" ]; then
        log "Instalando dependencias con Composer (la primera vez tarda unos minutos)..."
        if ! composer install --no-interaction --no-progress --prefer-dist; then
            echo "!! Composer no pudo instalar las dependencias. Revisa tu conexión a internet y vuelve a intentar: docker compose up -d" >&2
            exit 1
        fi
        # composer.lock puede haberse creado/actualizado en la instalación: recalculamos.
        cat composer.json composer.lock 2>/dev/null | md5sum | cut -d' ' -f1 > vendor/.composer-stamp
    fi

    # 5) Migraciones (se pueden desactivar con RUN_MIGRATIONS=false en .env).
    if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
        log "Aplicando migraciones..."
        local ok=0 attempt
        for attempt in 1 2 3 4 5 6; do
            if php artisan migrate --force --no-interaction; then
                ok=1
                break
            fi
            log "Las migraciones fallaron (intento ${attempt}/6). Reintentando en 5 s..."
            sleep 5
        done
        if [ "$ok" != "1" ]; then
            echo "!! No se pudieron aplicar las migraciones. El servidor arranca igual." >&2
            echo "!! Corrige el error de arriba y ejecuta: docker compose exec app php artisan migrate" >&2
        fi
    fi

    log "Backend listo."
}

# La preparación solo se hace al arrancar el servidor. Si ejecutas otra cosa
# (por ejemplo: docker compose run --rm app bash) se salta y va directo al comando.
if [ "${1:-}" = "php" ] && [ "${2:-}" = "artisan" ] && [ "${3:-}" = "serve" ]; then
    prepare_project
fi

exec "$@"
