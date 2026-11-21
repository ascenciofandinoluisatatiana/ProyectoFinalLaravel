#!/bin/bash
# Respaldo diario de la base de Umbral.
# 1) copia local en /opt/apps/umbral/respaldos  2) copia CIFRADA en el bucket (carpeta respaldos/)
CARPETA=/opt/apps/umbral/respaldos
ENV=/opt/apps/umbral/backend/.env
CLAVE=/root/.umbral-respaldo-clave      # clave de cifrado (la guarda Tatiana también en su computador)
LOG="$CARPETA/respaldo.log"
FECHA=$(date +%Y-%m-%d_%H%M)
ARCHIVO="$CARPETA/umbral_$FECHA.dump"
TEMP="$ARCHIVO.tmp"
umask 077

# Lee un valor del .env (sin mostrarlo en pantalla)
leer() { grep -E "^$1=" "$ENV" | head -1 | cut -d= -f2- | tr -d "\"'\r"; }

# Cifra la copia y la sube al bucket. Devuelve 0 si todo salió bien.
subir_al_bucket() {
  local archivo="$1" cifrado="$1.gpg"
  if [ ! -s "$CLAVE" ]; then
    echo "$(date '+%F %T') ERROR bucket: falta la clave de cifrado $CLAVE" >> "$LOG"; return 1
  fi
  gpg --batch --yes --pinentry-mode loopback --passphrase-file "$CLAVE" \
      --symmetric --cipher-algo AES256 -o "$cifrado" "$archivo" 2>> "$LOG" || return 1

  local endpoint bucket region acceso secreto prefijo estilo url objeto hash resultado
  endpoint=$(leer OBJECT_STORAGE_ENDPOINT); endpoint="${endpoint%/}"
  bucket=$(leer OBJECT_STORAGE_BUCKET)
  region=$(leer OBJECT_STORAGE_REGION)
  acceso=$(leer OBJECT_STORAGE_ACCESS_KEY)
  secreto=$(leer OBJECT_STORAGE_SECRET_KEY)
  prefijo=$(leer OBJECT_STORAGE_PREFIX); prefijo="${prefijo#/}"; prefijo="${prefijo%/}"
  estilo=$(leer OBJECT_STORAGE_USE_PATH_STYLE_ENDPOINT)

  objeto="${prefijo:+$prefijo/}respaldos/$(basename "$cifrado")"
  if [ "$estilo" = "false" ]; then
    url="${endpoint%%://*}://$bucket.${endpoint#*://}/$objeto"
  else
    url="$endpoint/$bucket/$objeto"
  fi

  hash=$(sha256sum "$cifrado" | cut -d' ' -f1)
  # La clave secreta se pasa por la entrada estándar para que no se vea en la lista de procesos
  printf 'user = "%s:%s"\n' "$acceso" "$secreto" | curl -sS --fail --max-time 120 -K - \
      --aws-sigv4 "aws:amz:${region:-us-east-1}:s3" \
      -H "x-amz-content-sha256: $hash" -T "$cifrado" "$url" 2>> "$LOG"
  resultado=$?
  rm -f "$cifrado"
  return $resultado
}

if docker exec umbral_postgres pg_dump -U umbral -d umbral -Fc > "$TEMP" \
   && [ -s "$TEMP" ] \
   && docker exec -i umbral_postgres pg_restore --list < "$TEMP" > /dev/null; then
  mv "$TEMP" "$ARCHIVO"
  echo "$(date '+%F %T') OK $ARCHIVO" >> "$LOG"
  find "$CARPETA" -name 'umbral_20*.dump' -mtime +7 -delete

  if subir_al_bucket "$ARCHIVO"; then
    echo "$(date '+%F %T') OK bucket: $(basename "$ARCHIVO").gpg" >> "$LOG"
  else
    echo "$(date '+%F %T') ERROR al subir la copia al bucket (la copia local sí quedó)" >> "$LOG"
    exit 3
  fi
else
  rm -f "$TEMP"
  echo "$(date '+%F %T') ERROR en el respaldo" >> "$LOG"
  exit 1
fi
