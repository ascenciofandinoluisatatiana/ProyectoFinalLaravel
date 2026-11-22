#!/bin/sh
# Cada 3 segundos mira si el vigilante cambió la lista de IP bloqueadas; si cambió, nginx la vuelve a leer.
F=/etc/nginx/vigilante/bloqueados.conf
ult=$(stat -c '%Y-%s' "$F" 2>/dev/null || echo 0)
while sleep 3; do
  act=$(stat -c '%Y-%s' "$F" 2>/dev/null || echo 0)
  if [ "$act" != "$ult" ]; then
    ult=$act
    nginx -t -q 2>/dev/null && nginx -s reload
  fi
done
