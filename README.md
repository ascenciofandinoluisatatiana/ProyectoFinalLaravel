# Portal Inmobiliario Global — Fase 1

Fundación técnica del proyecto: **Laravel 13 + API REST + PostgreSQL + Redis**, corriendo
en Docker. Esta es la carpeta base que usamos **todos los del equipo**, sin importar el
sistema operativo o cómo tenga cada quien configurado Docker.

## Por qué esta carpeta está armada así

La versión anterior fallaba al clonarse en otras máquinas por tres motivos, y esta
versión los evita desde la raíz:

1. **Saltos de línea (CRLF vs LF).** En Windows, Git puede guardar los archivos con
   saltos de línea distintos a Linux. Un script de shell (`entrypoint.sh`) con ese
   problema no corre dentro del contenedor. Por eso el archivo `.gitattributes` obliga
   a que todo el texto del repositorio se guarde siempre en formato Linux (LF),
   sin importar quién haga el commit o desde qué sistema operativo.
2. **Nada pesado ni generado se sube a Git.** `vendor/` (dependencias de PHP) vive en
   un volumen de Docker, no en tu disco ni en el repositorio. Cada quien lo genera
   solo, la primera vez que levanta el proyecto, con la versión exacta de PHP que usa
   el contenedor. Así se evita el clásico error de "en mi máquina sí funciona".
3. **Nada de contraseñas ni puertos fijos en Git.** `docker-compose.yml` no tiene ni un
   solo valor "quemado": todo sale de un archivo `.env` que cada quien crea localmente
   a partir de `.env.example`. Si a alguien ya le ocupa el puerto 5432 otro programa,
   simplemente cambia `DB_PORT` en su `.env` y no en el `docker-compose.yml` compartido.

## Requisitos

- Docker y Docker Compose instalados.
- Git.

## Puesta en marcha

```bash
git clone <url-del-repositorio>
cd portal-inmobiliario
cp .env.example .env
docker compose up -d --build
```

La primera vez tarda unos minutos: Composer instala Laravel completo dentro del
contenedor. Las siguientes veces arranca en segundos.

Cuando termine, revisa que todo esté bien:

```
http://localhost:8000/api/v1/health
```

Debe responder algo como:

```json
{"status":"ok","checks":{"database":"ok","redis":"ok"},"timestamp":"..."}
```

Si ves `"status":"degraded"`, espera unos segundos (Postgres/Redis a veces tardan un
poco más en el primer arranque) y vuelve a consultar el endpoint.

## Comandos del día a día

```bash
make up        # construir y levantar todo
make down      # apagar todo (los datos de la base quedan guardados)
make logs      # ver logs en vivo del backend
make shell     # entrar a una terminal dentro del contenedor de Laravel
make migrate   # correr migraciones nuevas
make fresh     # reiniciar la base de datos desde cero (borra los datos)
make test      # correr las pruebas automatizadas
```

También puedes usar `docker compose ...` directamente si prefieres no usar `make`.

## Estructura de la carpeta

```
portal-inmobiliario/
├── docker-compose.yml       # Orquesta postgres + redis + app
├── .env.example             # Variables para docker-compose (copiar a .env)
├── .gitattributes           # Fuerza saltos de línea LF en todo el repo
├── Makefile                 # Atajos de los comandos más usados
├── docker/
│   ├── backend/
│   │   ├── Dockerfile       # Imagen de PHP 8.4 + Composer para Laravel
│   │   └── entrypoint.sh    # Prepara el proyecto cada vez que arranca
│   ├── postgres/init.sql    # Se ejecuta una sola vez al crear la base
│   └── redis/redis.conf
└── backend/                 # Proyecto Laravel (código de la API)
    ├── app/Http/Controllers/Api/V1/   # Controladores de la API versionada
    ├── routes/api.php                 # Rutas bajo /api/v1/
    └── .env.example                   # Variables propias de Laravel
```

## Notas para cuando el equipo crezca

- El código de Laravel vive en `backend/` y se monta en el contenedor: puedes
  editarlo desde tu editor de siempre, sin entrar al contenedor.
- Todavía no incluimos frontend web, app móvil ni el servicio de IA/Python: según el
  documento de Fase 1, eso llega en fases posteriores. Cuando toque agregarlos, se
  suman como nuevos servicios en `docker-compose.yml` siguiendo el mismo patrón
  (nada de valores fijos, todo desde `.env`).
- Antes de instalar cualquier paquete de Composer, entra al contenedor
  (`make shell`) y corre `composer require ...` ahí adentro, para que quede
  instalado con la misma versión de PHP que usan tus compañeros.
