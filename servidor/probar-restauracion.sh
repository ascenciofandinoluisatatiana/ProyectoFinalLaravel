#!/bin/bash
# Prueba de restauración (S4): baja del bucket la última copia, la descifra y la restaura
# en una base TEMPORAL. No toca la base real. Al terminar borra todo lo temporal.
CARPETA=/opt/apps/umbral/respaldos
ENV=/opt/apps/umbral/backend/.env
CLAVE=/root/.umbral-respaldo-clave
PRUEBA=umbral_prueba_restauracion
TMP=$(mktemp -d)
limpiar() {
  rm -rf "$TMP"
  docker exec umbral_postgres psql -U umbral -d postgres -qc "DROP DATABASE IF EXISTS $PRUEBA;" > /dev/null 2>&1
}
trap limpiar EXIT

leer() { grep -E "^$1=" "$ENV" | head -1 | cut -d= -f2- | tr -d "\"'\r"; }
endpoint=$(leer OBJECT_STORAGE_ENDPOINT); endpoint="${endpoint%/}"
bucket=$(leer OBJECT_STORAGE_BUCKET)
region=$(leer OBJECT_STORAGE_REGION)
acceso=$(leer OBJECT_STORAGE_ACCESS_KEY)
secreto=$(leer OBJECT_STORAGE_SECRET_KEY)
prefijo=$(leer OBJECT_STORAGE_PREFIX); prefijo="${prefijo#/}"; prefijo="${prefijo%/}"
estilo=$(leer OBJECT_STORAGE_USE_PATH_STYLE_ENDPOINT)

nombre="$(basename "$(ls -t $CARPETA/umbral_20*.dump | head -1)").gpg"
objeto="${prefijo:+$prefijo/}respaldos/$nombre"
if [ "$estilo" = "false" ]; then
  url="${endpoint%%://*}://$bucket.${endpoint#*://}/$objeto"
else
  url="$endpoint/$bucket/$objeto"
fi

echo "1) Bajando del bucket: $nombre"
vacio=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
printf 'user = "%s:%s"\n' "$acceso" "$secreto" | curl -sS --fail --max-time 120 -K - \
  --aws-sigv4 "aws:amz:${region:-us-east-1}:s3" -H "x-amz-content-sha256: $vacio" \
  -o "$TMP/copia.gpg" "$url" || { echo "FALLO: no se pudo bajar del bucket"; exit 1; }
echo "   bajó $(du -h "$TMP/copia.gpg" | cut -f1)"

echo "2) Descifrando con la clave"
gpg --batch --yes --pinentry-mode loopback --passphrase-file "$CLAVE" -o "$TMP/copia.dump" -d "$TMP/copia.gpg" 2> /dev/null \
  || { echo "FALLO: no se pudo descifrar"; exit 1; }

echo "3) Restaurando en la base temporal $PRUEBA"
docker exec umbral_postgres psql -U umbral -d postgres -qc "DROP DATABASE IF EXISTS $PRUEBA;" > /dev/null 2>&1
docker exec umbral_postgres psql -U umbral -d postgres -qc "CREATE DATABASE $PRUEBA;" \
  || { echo "FALLO: no se pudo crear la base temporal"; exit 1; }
docker exec -i umbral_postgres pg_restore -U umbral -d $PRUEBA --no-owner < "$TMP/copia.dump" 2> "$TMP/errores.txt"
echo "   líneas de error al restaurar: $(wc -l < "$TMP/errores.txt")"

echo "4) Comparando con la base real"
contar() { docker exec umbral_postgres psql -U umbral -d "$1" -tAc "$2" 2> /dev/null; }
T1="SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
U1="SELECT count(*) FROM users"
echo "   tablas     -> real: $(contar umbral "$T1")   restaurada: $(contar $PRUEBA "$T1")"
echo "   usuarios   -> real: $(contar umbral "$U1")   restaurada: $(contar $PRUEBA "$U1")"
if [ "$(contar umbral "$T1")" = "$(contar $PRUEBA "$T1")" ] && [ "$(contar umbral "$U1")" = "$(contar $PRUEBA "$U1")" ]; then
  echo "RESULTADO: LA COPIA SIRVE (coincide con la base real)"
else
  echo "RESULTADO: HAY DIFERENCIAS, revisar"
  head -5 "$TMP/errores.txt"
fi
echo "5) Limpiando la base temporal y los archivos temporales"
