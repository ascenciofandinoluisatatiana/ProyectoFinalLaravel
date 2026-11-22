# Vigilante de seguridad (Python)

Programa aparte que protege UMBRAL de intentos de ataque. No toca el código de Laravel ni el frontend.

## Cómo funciona
1. nginx anota cada visita en `vigilante/logs/access.log` (una línea JSON por visita, con la IP real).
2. `vigilante.py` lee ese registro todo el tiempo.
3. Si una IP se porta como atacante, la agrega a `vigilante/bloqueados/bloqueados.conf`.
4. nginx lee esa lista (se recarga sola en unos 3 segundos) y le responde **403** a esas IP.
5. Cada bloqueo dura 30 minutos y se quita solo.

## Qué cuenta como ataque
| Regla | Condición (por IP) |
|---|---|
| `auth_fallos` | 10 intentos fallidos (401/403/422/429) en rutas de login, registro o claves, en 60 s |
| `escaneo_404` | 20 rutas que no existen (404) en 60 s (no cuentan fotos ni archivos de `assets`) |
| `ruta_ataque` | 1 sola petición a rutas como `.env`, `.git`, `wp-login`, `phpmyadmin`, `../`, `<script`, `union select`, `.php`, `.sql` |

Nunca se bloquea: redes privadas de Docker, ni las IP de `IPS_PERMITIDAS`.

## Ajustes (variables en `.env` del servidor, todas opcionales)
`VIGILANTE_IPS_PERMITIDAS` (por defecto `181.128.79.248`, separadas por coma), `VIGILANTE_MAX_AUTH_FALLOS` (10), `VIGILANTE_MAX_404` (20), `VIGILANTE_BLOQUEO_MIN` (30).

## Comandos útiles (en el servidor, dentro de /opt/apps/umbral)
- Ver quién está bloqueado: `cat vigilante/bloqueados/bloqueados.conf`
- Ver lo que ha pasado: `tail -20 vigilante/logs/vigilante.log`
- Desbloquear a todos: `: > vigilante/bloqueados/bloqueados.conf && docker restart umbral_vigilante`
- Apagar el vigilante: `docker stop umbral_vigilante` (el sitio sigue funcionando igual)
