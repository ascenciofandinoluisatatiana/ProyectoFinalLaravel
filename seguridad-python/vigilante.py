#!/usr/bin/env python3
"""
UMBRAL · Vigilante de seguridad (Python, solo biblioteca estándar).

Qué hace:
  1. Lee el registro de visitas que escribe nginx (una línea JSON por visita).
  2. Si una IP se porta como atacante, la agrega a una lista de bloqueados.
  3. nginx lee esa lista y responde 403 a esas IP. El bloqueo se quita solo.

Reglas (se cambian con variables de entorno, ver docker-compose.prod.yml):
  - auth_fallos : muchos intentos fallidos en rutas de inicio de sesión / claves.
  - escaneo_404 : muchas rutas que no existen (típico de un escáner).
  - ruta_ataque : una sola petición a una ruta de ataque conocida (.env, .git, wp-login...).
Nunca bloquea: redes privadas, ni las IP de IPS_PERMITIDAS.
"""
import ipaddress, json, os, re, signal, sys, time
from collections import defaultdict, deque
from urllib.parse import unquote

LOG = os.environ.get("VIG_LOG", "/logs/access.log")
EVENTOS = os.environ.get("VIG_EVENTOS", "/logs/vigilante.log")
LISTA = os.environ.get("VIG_LISTA", "/bloqueados/bloqueados.conf")
VENTANA = int(os.environ.get("VIG_VENTANA_SEG", "60"))
MAX_AUTH = int(os.environ.get("VIG_MAX_AUTH_FALLOS", "10"))
MAX_404 = int(os.environ.get("VIG_MAX_404", "20"))
BLOQUEO = int(os.environ.get("VIG_BLOQUEO_MIN", "30")) * 60
PAUSA = float(os.environ.get("VIG_PAUSA_SEG", "1"))
MAX_LOG_MB = int(os.environ.get("VIG_MAX_LOG_MB", "50"))

PERMITIDAS = []
for c in ["127.0.0.0/8", "::1/128", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fe80::/10", "fc00::/7"] + \
         [x.strip() for x in os.environ.get("IPS_PERMITIDAS", "").split(",") if x.strip()]:
    try:
        PERMITIDAS.append(ipaddress.ip_network(c, strict=False))
    except ValueError:
        print("IP permitida ignorada (no es válida):", c, flush=True)

RUTAS_AUTH = re.compile(r"/(sesion|login|registro|recuperar-clave|restablecer-clave|codigo)(/|$|\?)")
RUTA_ATAQUE = re.compile(
    r"(/\.env|/\.git|/\.aws|/\.ssh|/\.ds_store|wp-login|wp-admin|wp-content|xmlrpc\.php|phpmyadmin|/pma/|"
    r"/etc/passwd|/proc/self|\.\./|<script|%3cscript|union(\s|\+)+select|/vendor/phpunit|/actuator|"
    r"/cgi-bin|/boaform|/server-status|/telescope|/horizon|\.php(\?|$)|\.sql(\?|$)|\.bak(\?|$)|\.zip(\?|$))")
IGNORAR_404 = re.compile(r"^/(storage|assets)/|\.(png|jpe?g|webp|gif|ico|svg|map|woff2?|css|js)(\?|$)|/favicon")
FALLO_AUTH = {401, 403, 422, 429}

auth_t = defaultdict(deque)
n404_t = defaultdict(deque)
bloqueadas = {}          # ip -> (hasta, motivo)
parar = False


def ahora():
    return time.time()


def evento(tipo, **datos):
    linea = json.dumps(dict(hora=time.strftime("%Y-%m-%d %H:%M:%S"), tipo=tipo, **datos), ensure_ascii=False)
    print(linea, flush=True)
    try:
        with open(EVENTOS, "a", encoding="utf-8") as f:
            f.write(linea + "\n")
    except OSError:
        pass


def permitida(ip):
    try:
        a = ipaddress.ip_address(ip)
    except ValueError:
        return True          # si no es una IP válida, no se bloquea (no se podría escribir en la lista)
    return any(a in red for red in PERMITIDAS)


def escribir_lista():
    """Escribe la lista que nginx lee (formato de 'geo'). Se reemplaza el archivo completo de golpe."""
    lineas = ["# Lo escribe el vigilante. No editar a mano."]
    for ip, (hasta, motivo) in sorted(bloqueadas.items()):
        lineas.append("%s 1; # hasta=%d %s" % (ip, hasta, motivo))
    tmp = LISTA + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("\n".join(lineas) + "\n")
    os.replace(tmp, LISTA)


def cargar_lista():
    """Al arrancar, recuerda los bloqueos que seguían vigentes."""
    try:
        with open(LISTA, encoding="utf-8") as f:
            for l in f:
                m = re.match(r"^(\S+) 1; # hasta=(\d+) ?(.*)$", l.strip())
                if m and int(m.group(2)) > ahora():
                    bloqueadas[m.group(1)] = (int(m.group(2)), m.group(3))
    except OSError:
        pass


def bloquear(ip, motivo, detalle=""):
    if permitida(ip) or ip in bloqueadas:
        return
    bloqueadas[ip] = (int(ahora()) + BLOQUEO, motivo)
    escribir_lista()
    evento("BLOQUEO", ip=ip, motivo=motivo, detalle=detalle[:160], minutos=BLOQUEO // 60)


def vencer():
    vencidas = [ip for ip, (hasta, _) in bloqueadas.items() if hasta <= ahora()]
    for ip in vencidas:
        del bloqueadas[ip]
        evento("DESBLOQUEO", ip=ip)
    if vencidas:
        escribir_lista()


def contar(cola, ip, t):
    q = cola[ip]
    q.append(t)
    while q and t - q[0] > VENTANA:
        q.popleft()
    return len(q)


def revisar(linea):
    try:
        d = json.loads(linea)
        ip, metodo, uri, estado = d["ip"], d["m"], d["u"], int(d["s"])
    except (ValueError, KeyError, TypeError):
        return
    if ip in bloqueadas or permitida(ip):
        return
    t = ahora()
    ruta = unquote(uri).lower()
    if RUTA_ATAQUE.search(ruta):
        return bloquear(ip, "ruta_ataque", metodo + " " + uri)
    if metodo == "POST" and estado in FALLO_AUTH and RUTAS_AUTH.search(ruta):
        n = contar(auth_t, ip, t)
        if n >= MAX_AUTH:
            return bloquear(ip, "auth_fallos", "%d fallos en %ds" % (n, VENTANA))
    if estado == 404 and not IGNORAR_404.search(ruta):
        n = contar(n404_t, ip, t)
        if n >= MAX_404:
            return bloquear(ip, "escaneo_404", "%d rutas inexistentes en %ds" % (n, VENTANA))


def seguir():
    f = None
    inodo = None
    while not parar:
        try:
            st = os.stat(LOG)
        except OSError:
            time.sleep(PAUSA)
            continue
        if f is None or st.st_ino != inodo:        # primera vez, o el archivo se recreó
            if f:
                f.close()
            f = open(LOG, encoding="utf-8", errors="replace")
            if inodo is None:
                f.seek(0, os.SEEK_END)              # al arrancar no se reprocesa lo viejo
            inodo = st.st_ino
        if st.st_size < f.tell():                  # el archivo se vació
            f.seek(0)
        for linea in f:
            if linea.endswith("\n"):
                revisar(linea)
        vencer()
        if st.st_size > MAX_LOG_MB * 1024 * 1024:   # el registro no crece sin límite
            try:
                open(LOG, "w").close()
                f.seek(0)
                evento("REGISTRO_VACIADO", mb=MAX_LOG_MB)
            except OSError:
                pass
        time.sleep(PAUSA)


def terminar(*_):
    global parar
    parar = True


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, terminar)
    signal.signal(signal.SIGINT, terminar)
    cargar_lista()
    escribir_lista()
    evento("INICIO", ventana=VENTANA, max_auth=MAX_AUTH, max_404=MAX_404, bloqueo_min=BLOQUEO // 60,
           permitidas=[str(r) for r in PERMITIDAS])
    seguir()
