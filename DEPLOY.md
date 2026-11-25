# UMBRAL — Despliegue y qué hacer si algo falla

Servidor: VPS Contabo · carpeta `/opt/apps/umbral` · sitio https://umbral.proyectoscampus.top

## 1. Desplegar un cambio

Desde tu computador (carpeta del proyecto):

```
git add -u
git commit -m "Descripcion del cambio"
git push origin main
git push vps main
```

En el servidor (`ssh root@185.217.126.221`):

```
cd /opt/apps/umbral
git pull
curl -s https://umbral.proyectoscampus.top/api/v1/health
```

El `health` debe responder `"status":"ok"` con `database` y `redis` en `ok`.

Según lo que cambió, además:

| Qué cambió | Qué hacer en el servidor |
|---|---|
| Solo pantallas (`frontend/`: HTML, CSS, JS, imágenes) | Nada: nginx lee la carpeta directo |
| Código PHP (`backend/`) | `docker restart umbral_backend umbral_queue` |
| `docker/nginx/prod.conf` | `docker exec umbral_frontend nginx -t` y luego `docker exec umbral_frontend nginx -s reload` |
| `docker-compose.prod.yml` o `docker/` (otros) | `docker compose -f docker-compose.prod.yml up -d` (y revisar con `docker ps`) |
| `seguridad-python/` (vigilante) | `docker compose -f docker-compose.prod.yml up -d --build umbral_vigilante` |
| `servidor/cron/` | Copiar a `/etc/cron.d/` (ver README, sección "Tareas programadas") |

> Reiniciar `umbral_queue` siempre que cambie el código PHP: el trabajador de segundo plano
> no recarga el código solo. Si no se reinicia, sigue usando la versión vieja.

## 2. Antes de un despliegue importante

1. Hacer un respaldo a mano: `/opt/apps/umbral/respaldos/respaldo.sh`
2. Anotar la versión actual para poder volver: `git log --oneline -1`
3. Si hay migraciones nuevas, revisar qué cambian (`backend/database/migrations/`).

## 3. Volver atrás (reversa)

Si el despliegue dejó algo roto:

```
cd /opt/apps/umbral
git log --oneline -5                # busca el commit anterior bueno
git checkout <commit-anterior> -- .  # vuelve los archivos a esa versión
docker restart umbral_backend umbral_queue
curl -s https://umbral.proyectoscampus.top/api/v1/health
```

Después, en tu computador, corrige el problema y despliega de nuevo. Si hubo una migración que
dañó datos, **no** la deshagas a ciegas: restaura el respaldo (sección 5).

## 4. Tareas programadas (cron del servidor)

Están en `/etc/cron.d/` (copia en `servidor/cron/`):

| Archivo | Cuándo (Colombia) | Qué hace |
|---|---|---|
| `umbral-programador` | cada minuto | `schedule:run` (vence planes cada hora) |
| `umbral-avisos` | 8:00 a.m. | Avisos de membresías por vencer |
| `umbral-respaldo` | 6:00 p.m. | Respaldo de la base |

Comprobar: `docker exec umbral_backend php artisan schedule:list`

## 5. Respaldos

- Se guardan en `/opt/apps/umbral/respaldos/` (7 días) y cifrados en el bucket (carpeta `respaldos/`).
- Registro: `/opt/apps/umbral/respaldos/respaldo.log`
- La clave de cifrado está en `/root/.umbral-respaldo-clave` (hay otra copia en el computador de Tatiana). **Sin esa clave no se puede abrir la copia del bucket.**
- **Probar que la restauración funciona** (no toca la base real):
  `/opt/apps/umbral/servidor/probar-restauracion.sh`

## 6. Si algo falla

### El sitio no abre o responde error
1. `docker ps` → ¿están todos los `umbral_*` en `Up`? Si falta alguno: `docker compose -f docker-compose.prod.yml up -d`
2. `curl -s https://umbral.proyectoscampus.top/api/v1/health`
   - `database` en `error` → revisar `docker logs umbral_postgres --tail 50`
   - `redis` en `error` → revisar `docker logs umbral_redis --tail 50`
3. Errores de la aplicación: `docker exec umbral_backend tail -n 50 storage/logs/laravel.log`

### Las fotos no se copian al bucket, o los documentos no se revisan con la IA
La causa casi siempre es que `umbral_queue` está caído o con código viejo.
```
docker ps | grep umbral_queue
docker restart umbral_queue
docker logs umbral_queue --tail 50
```
Las fotos siguen viéndose (están en el disco local) hasta que se copian.

### Un usuario real quedó bloqueado por el vigilante
El bloqueo se quita solo a los 30 minutos. Para quitarlo ya: editar
`/opt/apps/umbral/vigilante/bloqueados/bloqueados.conf`, borrar la línea de esa IP y recargar:
`docker exec umbral_frontend nginx -s reload`.
Para apagar el vigilante un rato: `docker stop umbral_vigilante` (y `docker start umbral_vigilante` al terminar).

### El disco se llenó
```
df -h /
docker system df
du -sh /opt/apps/umbral/respaldos /opt/apps/umbral/vigilante/logs
```
Revisar primero respaldos y logs. No borrar volúmenes de Docker (`umbral_postgres_data`, `umbral_redis_data`).

### La IA (DeepSeek) no responde
No hay que hacer nada urgente: los documentos quedan **pendientes** para el administrador
(nunca se rechazan por fallo técnico). Revisar la clave en `backend/.env` si dura mucho.

### Restaurar la base desde un respaldo
Solo si se perdió o dañó información. Hacerlo con calma y **primero** probar con
`probar-restauracion.sh`. Si hace falta restaurar la base real, pídele a quien administra el
servidor que revise esto juntos antes de ejecutarlo: borra los datos actuales.

## 7. Datos útiles

- Health: `/api/v1/health`
- Contenedores: `umbral_postgres`, `umbral_redis`, `umbral_backend`, `umbral_queue`, `umbral_frontend`, `umbral_vigilante`
- Caddy (candado HTTPS) está en otro contenedor compartido (`caddy`): no se toca desde este proyecto.
