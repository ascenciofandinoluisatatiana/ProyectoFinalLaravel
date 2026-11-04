// Panel de invitado de UMBRAL para el celular.
// Es el mismo panel de la web (invitado/dashboard.html) adaptado a pantalla vertical:
// los datos se leen en vivo de la API pública, así que lo que se publique o cambie en la web se ve aquí.
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { StatusBar as BarraEstado } from 'expo-status-bar';
import { Fragment, memo, ReactNode, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  BackHandler,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar as BarraNativa,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IDIOMAS_PANEL, TEXTOS_PANEL } from './textosPanel';

const SITIO = 'https://umbral.proyectoscampus.top';
const API = `${SITIO}/api/v1/public`;

type Props = {
  idioma: string;
  alCambiarIdioma: (codigo: string) => void;
  alVolver: () => void;
  oscuroInicial?: boolean;
};

type Vendedor = { id: number; name: string; kind: string; phone: string; email: string; ini: string; ver: boolean };

type Prop = {
  id: number;
  type: string;
  op: string;
  price: number;
  dept: string;
  city: string;
  barrio: string;
  addr: string;
  lat: number;
  lng: number;
  beds: number;
  baths: number;
  park: number;
  area: number;
  estrato?: number | null;
  ver: boolean;
  prem: boolean;
  tier?: string;
  score?: number;
  desc: string;
  fotos: string[];
  seller: number;
};

type Filtros = {
  op: string;
  type: string;
  dept: string;
  city: string;
  barrio: string;
  max: string;
  beds: string;
  q: string;
  sort: string;
  view: 'cards' | 'map';
  favOnly: boolean;
  seller: number | null;
  showAll: boolean;
  showPrem: boolean;
};

const FILTROS_INICIALES: Filtros = {
  op: 'all', type: '', dept: '', city: '', barrio: '', max: '', beds: '', q: '',
  sort: 'rel', view: 'cards', favOnly: false, seller: null, showAll: false, showPrem: false,
};

// Misma paleta morada de la web (modo oscuro y claro).
type Paleta = { bg: string; card: string; text: string; muted: string; border: string; soft: string; primary: string; primary2: string; destaque: string };
const OSCURO: Paleta = { destaque: '#8a68e0', bg: '#22104a', card: '#141418', text: '#f5f5f7', muted: '#a6a6b0', border: '#2a2a32', soft: '#1f1f26', primary: '#e3c985', primary2: '#e3c985' };
const CLARO: Paleta = { destaque: '#9a7ee0', bg: '#f8f7ff', card: '#ffffff', text: '#241735', muted: '#514563', border: '#cdbff0', soft: '#ece3fe', primary: '#6d2fd6', primary2: '#6d2fd6' };
// Colores de los niveles cuando se usan como TEXTO sobre fondo claro (más oscuros para que se lean).
const NIVEL_TEXTO_DIA: Record<string, string> = { oro: '#80601E', plata: '#5d6272', bronce: '#8a5424' };
const BOTON = '#d4b062';
const BOTON2 = '#f3e2b0';
const TXT_BOTON = '#14110a';

const ICONO_TIPO: Record<string, string> = { casa: 'house', apartamento: 'building', finca: 'tree', local: 'store', lote: 'mountain-sun' };
const NIVEL: Record<string, number> = { oro: 3, plata: 2, bronce: 1 };
const COLOR_NIVEL: Record<string, string> = { oro: '#e3c985', plata: '#c9ccd6', bronce: '#c58b5a' };
const NOMBRES_IDIOMA: Record<string, string> = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', ar: 'العربية' };

/* ---------- icono ---------- */

const Ico = memo(function Ico({ n, s = 14, c, solid = true }: { n: string; s?: number; c: string; solid?: boolean }) {
  return <FontAwesome6 name={n} size={s} color={c} solid={solid} regular={!solid} />;
});

/* ---------- utilidades ---------- */

const cop = (n: number) => `$ ${String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const miles = (n: number) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const absoluta = (ruta: string) => (/^https?:\/\//i.test(ruta) ? ruta : `${SITIO}${ruta.startsWith('/') ? '' : '/'}${ruta}`);
const tierN = (p: Prop) => NIVEL[p.tier ?? ''] ?? (p.prem ? 1 : 0);
// Un solo morado para todas las propiedades que no tienen foto.
const FONDO_SIN_FOTO = '#5B2D9C';
const colorArte = (_id?: number) => FONDO_SIN_FOTO;
const quitarTildes = (s: string) => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const ubic = (p: Prop) => `${p.barrio} · ${p.city}${p.dept && quitarTildes(p.dept) !== quitarTildes(p.city) ? `, ${p.dept}` : ''}`;
const unicos = (a: string[]) => [...new Set(a)].sort((x, y) => x.localeCompare(y, 'es'));

const DIAS: Record<string, string[]> = {
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  pt: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
};
const MESES: Record<string, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};

// Hora y fecha de Colombia (UTC-5), sin depender de Intl.
const ahoraColombia = () => new Date(Date.now() - 5 * 3600000);
const fechaLarga = (lang: string, d: Date) => {
  const dia = DIAS[lang][d.getUTCDay()];
  const mes = MESES[lang][d.getUTCMonth()];
  const n = d.getUTCDate();
  const a = d.getUTCFullYear();
  if (lang === 'es' || lang === 'pt') return `${dia}, ${n} de ${mes} de ${a}`;
  if (lang === 'fr') return `${dia} ${n} ${mes} ${a}`;
  return `${dia}, ${mes} ${n}, ${a}`;
};
const horaCorta = (d: Date) => {
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0')}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
};

const semanaNum = () => Math.floor((Math.floor((Date.now() - 5 * 3600000) / 86400000) + 3) / 7);
// Cada lunes los premium de un mismo nivel avanzan de puesto (igual que en la web).
const premRotar = (r: Prop[]) => {
  const sem = semanaNum();
  const salida: Prop[] = [];
  [3, 2, 1].forEach((n) => {
    const g = r.filter((p) => p.prem && tierN(p) === n).sort((a, b) => a.id - b.id);
    if (!g.length) return;
    const k = sem % g.length;
    salida.push(...g.slice(k), ...g.slice(0, k));
  });
  return salida.concat(r.filter((p) => !p.prem));
};

const normFotos = (p: any): string[] => {
  let f: any = p.fotos || p.imagenes || p.images || p.photos || [];
  if (typeof f === 'string') f = [f];
  if (!Array.isArray(f)) f = [];
  let lista: string[] = f
    .map((x: any) => (typeof x === 'string' ? x : x && (x.url || x.ruta || x.path || x.src)))
    .filter(Boolean)
    .map((x: string) => absoluta(x));
  if (!lista.length && p.img) lista = [absoluta(String(p.img))];
  return lista;
};

/* ---------- mapas (Leaflet dentro de un WebView) ---------- */

const htmlMapa = (puntos: { id: number; lat: number; lng: number; titulo: string; precio: string; ver: string }[], fijo: boolean) => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>html,body,#m{height:100%;margin:0}.pop a{color:#6c3df5;font-weight:700;text-decoration:none}</style></head>
<body><div id="m"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
var pts=${JSON.stringify(puntos).replace(/</g, '\\u003c')};
var map=L.map('m').setView([5.5,-74.5],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
var b=[];
pts.forEach(function(p){
  var m=L.marker([p.lat,p.lng]).addTo(map);
  var h='<div class="pop"><b>'+p.titulo+'</b><br>'+p.precio+(${fijo ? 'false' : 'true'}?'<br><a href="#" onclick="window.ReactNativeWebView.postMessage(\\''+p.id+'\\');return false;">'+p.ver+' →</a>':'')+'</div>';
  m.bindPopup(h);
  b.push([p.lat,p.lng]);
});
if(${fijo ? 'true' : 'false'} && b.length){map.setView(b[0],15);}
else if(b.length){map.fitBounds(b,{padding:[30,30],maxZoom:12});}
</script></body></html>`;

/* ---------- carrusel de fotos ---------- */

function Carrusel({ fotos, ancho, alto }: { fotos: string[]; ancho: number; alto: number }) {
  const ref = useRef<ScrollView>(null);
  const [i, setI] = useState(0);
  const indice = useRef(0);
  const n = fotos.length;

  const ir = useCallback((k: number) => {
    const destino = (k + n) % n;
    indice.current = destino;
    setI(destino);
    ref.current?.scrollTo({ x: destino * ancho, animated: true });
  }, [n, ancho]);

  useEffect(() => {
    if (n < 2) return;
    const temporizador = setInterval(() => ir(indice.current + 1), 3500);
    return () => clearInterval(temporizador);
  }, [n, ir]);

  const alTerminar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const k = Math.round(e.nativeEvent.contentOffset.x / ancho);
    indice.current = k;
    setI(k);
  };

  return (
    <View style={{ width: ancho, height: alto }}>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={alTerminar} nestedScrollEnabled>
        {fotos.map((f, k) => (
          <Image key={`${f}-${k}`} source={{ uri: f }} style={{ width: ancho, height: alto }} resizeMode="cover" resizeMethod="resize" fadeDuration={0} />
        ))}
      </ScrollView>
      {n > 1 ? (
        <>
          <Pressable style={[st.flecha, { left: 8 }]} onPress={() => ir(i - 1)} accessibilityRole="button"><Ico n="chevron-left" s={15} c="#ffffff" /></Pressable>
          <Pressable style={[st.flecha, { right: 8 }]} onPress={() => ir(i + 1)} accessibilityRole="button"><Ico n="chevron-right" s={15} c="#ffffff" /></Pressable>
          <View style={st.puntos}>
            {fotos.map((_, k) => (<View key={k} style={[st.punto, k === i && st.puntoOn]} />))}
          </View>
        </>
      ) : null}
    </View>
  );
}

/* ---------- hoja de opciones y selector ---------- */

function HojaOpciones(props: {
  visible: boolean;
  titulo: string;
  opciones: [string, string][];
  valor: string;
  c: Paleta;
  alElegir: (v: string) => void;
  alCerrar: () => void;
}) {
  const { visible, titulo, opciones, valor, c, alElegir, alCerrar } = props;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={alCerrar}>
      <Pressable style={st.fondoModal} onPress={alCerrar}>
        <View style={[st.listaSelector, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[st.tituloSelector, { color: c.text }]}>{titulo}</Text>
          <ScrollView style={{ maxHeight: 380 }}>
            {opciones.map((o) => {
              const on = String(o[0]) === String(valor);
              return (
                <Pressable key={o[0] || '__todos'} style={[st.opcionSelector, on && { backgroundColor: c.soft }]} onPress={() => { alElegir(o[0]); alCerrar(); }}>
                  <Text style={{ color: on ? c.primary2 : c.text, fontWeight: on ? '700' : '400', fontSize: 14 }}>{o[1]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

function Selector(props: {
  etiqueta: string;
  valor: string;
  opciones: [string, string][];
  vacio: string;
  c: Paleta;
  alCambiar: (v: string) => void;
}) {
  const { etiqueta, valor, opciones, vacio, c, alCambiar } = props;
  const [abierto, setAbierto] = useState(false);
  const actual = opciones.find((o) => String(o[0]) === String(valor));
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={[st.etiquetaCampo, { color: c.muted }]}>{etiqueta}</Text>
      <Pressable style={[st.campo, { backgroundColor: c.bg, borderColor: c.border }]} onPress={() => setAbierto(true)} accessibilityRole="button">
        <Text style={{ color: c.text, fontSize: 12.5, flex: 1 }} numberOfLines={1}>{actual ? actual[1] : vacio}</Text>
        <Ico n="chevron-down" s={11} c={c.muted} />
      </Pressable>
      <HojaOpciones visible={abierto} titulo={etiqueta} opciones={[['', vacio], ...opciones]} valor={valor} c={c} alElegir={alCambiar} alCerrar={() => setAbierto(false)} />
    </View>
  );
}

/* ---------- tarjeta de propiedad (compacta, 2 por fila) ---------- */

type DatosTarjeta = {
  p: Prop;
  v?: Vendedor;
  fav: boolean;
  rank?: number;
  ancho: number;
  c: Paleta;
  t: (k: string) => string;
  alAbrir: (p: Prop) => void;
  alFav: (id: number) => void;
  alPagar: (p: Prop) => void;
};

// Fotos de la tarjeta: pasan solas cada pocos segundos (como en Shein/Temu).
function FotosTarjeta({ fotos, ancho, alto, desfase, alToque }: { fotos: string[]; ancho: number; alto: number; desfase: number; alToque: () => void }) {
  const ref = useRef<ScrollView>(null);
  const indice = useRef(0);
  const [i, setI] = useState(0);
  const n = fotos.length;

  useEffect(() => {
    if (n < 2) return;
    const temporizador = setInterval(() => {
      const destino = (indice.current + 1) % n;
      indice.current = destino;
      setI(destino);
      ref.current?.scrollTo({ x: destino * ancho, animated: true });
    }, 3200 + desfase);
    return () => clearInterval(temporizador);
  }, [n, ancho, desfase]);

  return (
    <View style={{ width: ancho, height: alto }}>
      <ScrollView
        ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} nestedScrollEnabled
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => { const k = Math.round(e.nativeEvent.contentOffset.x / ancho); indice.current = k; setI(k); }}
      >
        {fotos.map((f, k) => (
          <Pressable key={`${f}-${k}`} onPress={alToque}>
            <Image source={{ uri: f }} style={{ width: ancho, height: alto }} resizeMode="cover" resizeMethod="resize" fadeDuration={0} />
          </Pressable>
        ))}
      </ScrollView>
      {n > 1 ? (
        <View style={st.puntosMini} pointerEvents="none">
          {fotos.map((_, k) => (<View key={k} style={[st.puntoMini, k === i && st.puntoMiniOn]} />))}
        </View>
      ) : null}
    </View>
  );
}

// Corazón de favoritos: da un pequeño "latido" al tocarlo (animación nativa, dura menos de 0,2 s).
const Corazon = memo(function Corazon({ fav, id, alFav, etiqueta }: { fav: boolean; id: number; alFav: (id: number) => void; etiqueta: string }) {
  const escala = useRef(new Animated.Value(1)).current;
  const tocar = () => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 1.3, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 110, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    alFav(id);
  };
  return (
    <Pressable style={st.corazon} onPress={tocar} accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={6}>
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Ico n="heart" s={15} c={fav ? '#d4b062' : '#9a94b8'} solid={fav} />
      </Animated.View>
    </Pressable>
  );
});

const Tarjeta = memo(function Tarjeta({ p, rank, ancho, c, t, fav, alAbrir, alFav, alPagar }: DatosTarjeta) {
  const arriendo = p.op === 'arriendo';
  const altoFoto = Math.round(ancho * 0.72);
  return (
    <View style={[st.tarjeta, { width: ancho, backgroundColor: c.card, borderColor: p.prem ? (COLOR_NIVEL[p.tier ?? 'bronce'] ?? '#e3c985') : c.destaque }, p.prem && { elevation: 9, shadowColor: COLOR_NIVEL[p.tier ?? 'bronce'] ?? '#e3c985', shadowOpacity: 0.9, shadowRadius: 10 }]}>
      <View>
        {p.fotos.length ? (
          <FotosTarjeta fotos={p.fotos} ancho={ancho - 2} alto={altoFoto} desfase={(p.id % 5) * 400} alToque={() => alAbrir(p)} />
        ) : (
          <Pressable onPress={() => alAbrir(p)} style={[{ width: '100%', height: altoFoto, backgroundColor: colorArte(p.id), alignItems: 'center', justifyContent: 'center' }]}>
            <Ico n={ICONO_TIPO[p.type] ?? 'house'} s={32} c="#E4C986" />
          </Pressable>
        )}
        <View style={st.insignias} pointerEvents="none">
          <View style={[st.insignia, { backgroundColor: arriendo ? BOTON2 : BOTON }]}><Text style={st.insigniaTxt}>{t(arriendo ? 'rental' : 'sale')}</Text></View>
          {p.ver ? <View style={[st.insignia, { backgroundColor: '#3a3a44' }]}><Ico n="circle-check" s={9} c="#ffffff" /></View> : null}
        </View>
        {rank ? (
          <View style={st.rangoBox} pointerEvents="none">
            <View style={[st.rango, { backgroundColor: COLOR_NIVEL[p.tier ?? 'bronce'] ?? COLOR_NIVEL.bronce }]}><Text style={[st.rangoTxt, { color: p.tier === 'bronce' ? '#ffffff' : '#14110a' }]}>#{rank} {t(`tier_${p.tier || 'bronce'}`)}</Text></View>
          </View>
        ) : null}
        <Corazon fav={fav} id={p.id} alFav={alFav} etiqueta={t('nav_favs')} />
      </View>
      <View style={st.cuerpoTarjeta}>
        <Text style={[st.precio, { color: c.primary2 }]} numberOfLines={1}>{cop(p.price)}{arriendo ? <Text style={[st.precioPequeno, { color: c.muted }]}> {t('per_month')}</Text> : null}</Text>
        <Text style={[st.tituloTarjeta, { color: c.text }]} numberOfLines={1}>{`${t(`t_${p.type}`)} ${t('in_')} ${p.barrio}`}</Text>
        <View style={st.filaUbic}>
          <Ico n="location-dot" s={10} c={c.muted} />
          <Text style={[st.ubicacion, { color: c.muted }]} numberOfLines={1}>{ubic(p)}</Text>
        </View>
        <View style={st.datos}>
          {p.beds ? <View style={st.dato}><Ico n="bed" s={11} c={c.primary2} /><Text style={[st.datoTxt, { color: c.muted }]}>{p.beds}</Text></View> : null}
          {p.baths ? <View style={st.dato}><Ico n="bath" s={11} c={c.primary2} /><Text style={[st.datoTxt, { color: c.muted }]}>{p.baths}</Text></View> : null}
          {p.park ? <View style={st.dato}><Ico n="car" s={11} c={c.primary2} /><Text style={[st.datoTxt, { color: c.muted }]}>{p.park}</Text></View> : null}
          <View style={st.dato}><Ico n="ruler-combined" s={11} c={c.primary2} /><Text style={[st.datoTxt, { color: c.muted }]}>{miles(p.area)}{t('m2')}</Text></View>
        </View>
        <View style={st.acciones}>
          <Pressable style={[st.botonGhost, { borderColor: c.border, backgroundColor: c.card }]} onPress={() => alAbrir(p)} accessibilityRole="button" accessibilityLabel={t('details')}>
            <Ico n="eye" s={12} c={c.text} />
          </Pressable>
          <Pressable style={[st.botonLleno, { backgroundColor: arriendo ? BOTON2 : BOTON }]} onPress={() => alPagar(p)} accessibilityRole="button" accessibilityLabel={t(arriendo ? 'rent' : 'buy')}>
            <Ico n={arriendo ? 'key' : 'cart-shopping'} s={12} c="#14110a" />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

// Tarjeta "esqueleto": mientras llegan las propiedades las barras respiran entre gris y dorado.
// Usa una sola animación compartida (corre en el hilo nativo, casi no gasta procesador).
const Bloque = ({ brillo, estilo }: { brillo: Animated.Value | null; estilo: object }) => (
  <View style={[{ overflow: 'hidden' }, estilo]}>
    {brillo ? <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#E3C985', opacity: brillo }]} /> : null}
  </View>
);
const Esqueleto = memo(function Esqueleto({ ancho, c, brillo }: { ancho: number; c: typeof OSCURO; brillo: Animated.Value | null }) {
  const base = { backgroundColor: c.soft, borderRadius: 6 };
  return (
    <View style={[st.tarjeta, { width: ancho, backgroundColor: c.card, borderColor: c.border }]}>
      <Bloque brillo={brillo} estilo={{ height: Math.round(ancho * 0.72), backgroundColor: c.soft }} />
      <View style={st.cuerpoTarjeta}>
        <Bloque brillo={brillo} estilo={[base, { height: 16, width: '55%' }]} />
        <Bloque brillo={brillo} estilo={[base, { height: 12, width: '80%' }]} />
        <Bloque brillo={brillo} estilo={[base, { height: 10, width: '65%' }]} />
        <Bloque brillo={brillo} estilo={[base, { height: 30, width: '100%', borderRadius: 9, marginTop: 3 }]} />
      </View>
    </View>
  );
});

type Fila =
  | { k: 'fila'; key: string; items: Prop[] }
  | { k: 'titulo'; key: string; texto: string; sub?: string; icono?: string }
  | { k: 'tier'; key: string; tier: string; n: number }
  | { k: 'premium'; key: string; grupos: { k: 'oro' | 'plata' | 'bronce'; lista: Prop[] }[] }
  | { k: 'boton'; key: string; texto: string; icono: string; accion: 'premium' | 'todas' }
  | { k: 'pista'; key: string; texto: string }
  | { k: 'vacio'; key: string; texto: string };

const aFilas = (lista: Prop[], prefijo: string, columnas: number): Fila[] => {
  const filas: Fila[] = [];
  for (let i = 0; i < lista.length; i += columnas) {
    filas.push({ k: 'fila', key: `${prefijo}-${i / columnas}`, items: lista.slice(i, i + columnas) });
  }
  return filas;
};

/* ---------- componente principal ---------- */

// Las fuentes de los íconos se cargan UNA sola vez antes de dibujar el panel
// (si no, cada ícono pide la fuente por su cuenta y el celular se atora).
export default function PanelInvitado(props: Props) {
  const [fuentesListas] = useFonts(FontAwesome6.font);
  if (!fuentesListas) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: props.oscuroInicial === false ? '#f6f2ff' : '#22104a' }}>
        <ActivityIndicator size="large" color="#e3c985" />
      </View>
    );
  }
  return <PanelInterno {...props} />;
}

function PanelInterno({ idioma, alCambiarIdioma, alVolver, oscuroInicial }: Props) {
  const idx = IDIOMAS_PANEL.indexOf(idioma) >= 0 ? IDIOMAS_PANEL.indexOf(idioma) : 1; // el árabe usa el texto en inglés
  const lang = IDIOMAS_PANEL[idx];
  const esArabe = idioma === 'ar';
  const t = useCallback((k: string) => (TEXTOS_PANEL[k] || [k])[idx] || k, [idx]);
  const alinear = { textAlign: esArabe ? ('right' as const) : ('left' as const) };
  const { width: ancho } = useWindowDimensions();
  const barraSuperior = Platform.OS === 'android' ? BarraNativa.currentHeight ?? 24 : 44;
  // Celulares muy chicos: 1 columna. Celulares normales: 2. Tabletas: 3 o 4.
  const columnas = ancho < 340 ? 1 : ancho >= 900 ? 4 : ancho >= 600 ? 3 : 2;
  const anchoColumna = Math.floor((ancho - 36 - 12 * (columnas - 1)) / columnas);
  const anchoPremium = 150;
  const anchoEnPanel = Math.floor((ancho - 24 - 24 - 12 * (columnas - 1)) / columnas);

  const [oscuro, setOscuro] = useState(oscuroInicial !== false);
  const c = oscuro ? OSCURO : CLARO;

  const [props, setProps] = useState<Prop[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [ubicaciones, setUbicaciones] = useState<{ nombre: string; municipios: string[] }[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [S, setS] = useState<Filtros>(FILTROS_INICIALES);
  const [favs, setFavs] = useState<number[]>([]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [menu, setMenu] = useState(false);
  const [seccion, setSeccion] = useState('all');
  const [selIdioma, setSelIdioma] = useState(false);
  const [detalle, setDetalle] = useState<Prop | null>(null);
  const [pse, setPse] = useState<Prop | null>(null);
  const [calcAbierta, setCalcAbierta] = useState(false);
  const [vendedoresAbierto, setVendedoresAbierto] = useState(false);
  const [aviso, setAviso] = useState('');
  const [reloj, setReloj] = useState(ahoraColombia());
  const [lead, setLead] = useState({ n: '', c: '', m: '' });
  const [pago, setPago] = useState({ n: '', e: '', d: '', ok: false, enviando: false });
  const [calc, setCalc] = useState({ precio: '500000000', cuota: '30', tasa: '12', anios: '15' });

  const lista = useRef<FlatList<Fila>>(null);
  const yResultados = useRef(0);
  const temporizadorAviso = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarAviso = useCallback((m: string) => {
    setAviso(m);
    if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
    temporizadorAviso.current = setTimeout(() => setAviso(''), 3200);
  }, []);
  const cambiar = (parcial: Partial<Filtros>) => setS((a) => ({ ...a, ...parcial }));
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const escribirBusqueda = (v: string) => {
    setTextoBusqueda(v);
    cambiar({ q: v });
  };

  /* ---- datos del servidor ---- */
  // Convierte la respuesta de la API en las propiedades y vendedores que usa la pantalla.
  const procesar = useCallback((json: any) => {
    const datos: any[] = Array.isArray(json?.data) ? json.data : [];
    const mapa = new Map<number, Vendedor & { idx: number }>();
    const nuevas: Prop[] = datos.map((p) => {
      const v = p.seller || { id: 0, name: '—', kind: 'person', phone: '', email: '', ini: '?', ver: false };
      if (!mapa.has(v.id)) mapa.set(v.id, { ...v, idx: mapa.size });
      return {
        id: p.id, type: p.type, op: p.op, price: p.price, dept: p.dept || '', city: p.city || '', barrio: p.barrio || '',
        addr: p.addr || '', lat: p.lat, lng: p.lng, beds: p.beds || 0, baths: p.baths || 0, park: p.park || 0, area: p.area || 0,
        estrato: p.estrato, ver: !!p.ver, prem: !!p.prem, tier: p.tier, score: p.score,
        desc: String(p.descripcion || p.description || p.desc || '').trim(),
        fotos: normFotos(p), seller: (mapa.get(v.id) as { idx: number }).idx,
      };
    });
    // Si nada cambió no se vuelve a pintar la lista (evita trabajo inútil en el celular).
    setProps((anteriores) => (JSON.stringify(anteriores) === JSON.stringify(nuevas) ? anteriores : nuevas));
    setVendedores((anteriores) => {
      const siguientes = [...mapa.values()];
      return JSON.stringify(anteriores) === JSON.stringify(siguientes) ? anteriores : siguientes;
    });
  }, []);

  // Brillo dorado de los esqueletos de carga (se apaga si el usuario pidió reducir movimiento).
  const [brillo, setBrillo] = useState<Animated.Value | null>(null);
  useEffect(() => {
    if (!cargando) { setBrillo(null); return; }
    let activo = true;
    let actual: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (!activo || reducir) return;
      // Una sola animación lineal larga, y el brillo sube y baja (gris ↔ dorado) por interpolación.
      // Todo corre en el hilo nativo: sigue latiendo aunque la app esté ocupada dibujando.
      const CICLOS = 300;
      const puntos: number[] = [];
      const valores: number[] = [];
      for (let i = 0; i <= CICLOS * 2; i++) { puntos.push(i); valores.push(i % 2 === 0 ? 0.04 : 0.42); }
      const avance = new Animated.Value(0);
      const opacidad = avance.interpolate({ inputRange: puntos, outputRange: valores });
      const lanzar = () => {
        if (!activo) return;
        avance.setValue(0);
        actual = Animated.timing(avance, { toValue: CICLOS * 2, duration: CICLOS * 1800, easing: Easing.linear, useNativeDriver: true });
        actual.start(({ finished }) => { if (finished) lanzar(); });
      };
      setBrillo(opacidad as unknown as Animated.Value);
      lanzar();
    }).catch(() => undefined);
    return () => { activo = false; if (actual) actual.stop(); };
  }, [cargando]);

  const cargando_ = useRef(false);
  const cargar = useCallback(async (modo: 'inicial' | 'manual' | 'silencioso') => {
    if (cargando_.current && modo === 'silencioso') return;
    cargando_.current = true;
    if (modo === 'manual') setRefrescando(true);
    // Las ubicaciones se piden en paralelo y no frenan la lista de propiedades.
    fetch(`${API}/ubicaciones`, { headers: { Accept: 'application/json' } })
      .then((u) => (u.ok ? u.json() : null))
      .then((uj) => {
        if (uj && uj.data && uj.data.length) {
          setUbicaciones((a) => (a && JSON.stringify(a) === JSON.stringify(uj.data) ? a : uj.data));
          AsyncStorage.setItem('umbral_cache_ubic', JSON.stringify(uj.data)).catch(() => undefined);
        }
      })
      .catch(() => undefined);
    try {
      const r = await fetch(`${API}/propiedades?per_page=100`, { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(String(r.status));
      const json = await r.json();
      procesar(json);
      AsyncStorage.setItem('umbral_cache_props', JSON.stringify(json)).catch(() => undefined);
      setFallo(false);
    } catch {
      if (modo !== 'silencioso') setFallo(true);
    } finally {
      cargando_.current = false;
      setCargando(false);
      setRefrescando(false);
    }
  }, [procesar]);

  // Muestra al instante lo de la última vez mientras llega lo nuevo del servidor.
  useEffect(() => {
    AsyncStorage.getItem('umbral_cache_props').then((v) => {
      try { if (v) { procesar(JSON.parse(v)); setCargando(false); } } catch { /* sin caché */ }
    }).catch(() => undefined);
    AsyncStorage.getItem('umbral_cache_ubic').then((v) => {
      try { if (v) setUbicaciones(JSON.parse(v)); } catch { /* sin caché */ }
    }).catch(() => undefined);
  }, [procesar]);

  useEffect(() => {
    cargar('inicial');
    // Se actualiza sola cada 5 minutos: lo que cambie en la web aparece aquí.
    const temporizador = setInterval(() => cargar('silencioso'), 300000);
    return () => clearInterval(temporizador);
  }, [cargar]);

  useEffect(() => {
    const temporizador = setInterval(() => setReloj(ahoraColombia()), 300000);
    return () => clearInterval(temporizador);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('umbral_favs').then((v) => { if (v) { try { setFavs(JSON.parse(v)); } catch { /* vacío */ } } }).catch(() => undefined);
  }, []);

  const favsRef = useRef<number[]>([]);
  favsRef.current = favs;
  const alternarFav = useCallback((id: number) => {
    const actual = favsRef.current;
    const nuevo = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id];
    setFavs(nuevo);
    mostrarAviso(t(nuevo.includes(id) ? 'fav_add' : 'fav_del'));
    AsyncStorage.setItem('umbral_favs', JSON.stringify(nuevo)).catch(() => undefined);
  }, [mostrarAviso, t]);

  const abrirDetalle = useCallback((p: Prop) => { setLead({ n: '', c: '', m: '' }); setDetalle(p); }, []);
  const abrirPago = useCallback((p: Prop) => { setPago({ n: '', e: '', d: '', ok: false, enviando: false }); setPse(p); }, []);

  /* ---- botón atrás del celular ---- */
  const estadoAtras = useRef({ pse, detalle, calcAbierta, vendedoresAbierto, menu, selIdioma, mapaAbierto });
  estadoAtras.current = { pse, detalle, calcAbierta, vendedoresAbierto, menu, selIdioma, mapaAbierto };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const e = estadoAtras.current;
      if (e.pse) setPse(null);
      else if (e.mapaAbierto) setMapaAbierto(false);
      else if (e.detalle) setDetalle(null);
      else if (e.calcAbierta) setCalcAbierta(false);
      else if (e.vendedoresAbierto) setVendedoresAbierto(false);
      else if (e.menu) setMenu(false);
      else if (e.selIdioma) setSelIdioma(false);
      else alVolver();
      return true;
    });
    return () => sub.remove();
  }, [alVolver]);

  /* ---- filtrado ---- */
  const Sd = S;
  const filtrados = useMemo(() => {
    const S = Sd;
    let r = props.filter((p) =>
      (S.op === 'all' || p.op === S.op) && (!S.type || p.type === S.type) && (!S.dept || p.dept === S.dept) &&
      (!S.city || p.city === S.city) && (!S.barrio || p.barrio === S.barrio) && (!S.max || p.price <= +S.max) &&
      (!S.beds || p.beds >= +S.beds) && (!S.favOnly || favs.includes(p.id)) && (S.seller === null || p.seller === S.seller) &&
      (!S.q || `${t(`t_${p.type}`)} ${p.type} ${p.city} ${p.barrio} ${p.dept}`.toLowerCase().includes(S.q.toLowerCase())));
    if (S.sort === 'low') r = [...r].sort((a, b) => a.price - b.price);
    else if (S.sort === 'high') r = [...r].sort((a, b) => b.price - a.price);
    else r = premRotar([...r].sort((a, b) => (tierN(b) - tierN(a)) || ((b.score || 0) - (a.score || 0)) || (Number(b.ver) - Number(a.ver))));
    return r;
  }, [props, Sd, favs, t]);

  const filtrosActivos = !!(S.q || S.type || S.dept || S.city || S.barrio || S.max || S.beds || S.seller !== null || S.favOnly);
  const premTodas = useMemo(() => filtrados.filter((p) => p.prem), [filtrados]);
  const modoPremium = S.view === 'cards' && !filtrosActivos && premTodas.length > 0;
  const gruposPremium = useMemo(
    () => (['oro', 'plata', 'bronce'] as const)
      .map((k) => ({ k, lista: premTodas.filter((p) => (p.tier || 'bronce') === k) }))
      .filter((g) => g.lista.length),
    [premTodas],
  );

  const filas = useMemo<Fila[]>(() => {
    if (cargando || S.view === 'map') return [];
    if (!filtrados.length) return [{ k: 'vacio', key: 'vacio', texto: t('no_results') }];
    if (!modoPremium) return aFilas(filtrados, 'p', columnas);
    const resto = filtrados.filter((p) => !p.prem);
    const salida: Fila[] = [];
    salida.push({ k: 'premium', key: 'panel-premium', grupos: gruposPremium });
    if (resto.length && !S.showAll) {
      salida.push({ k: 'boton', key: 'b-todas', texto: `${t('see_more')} · ${resto.length}`, icono: 'chevron-down', accion: 'todas' });
    }
    if (resto.length && S.showAll) {
      salida.push({ k: 'titulo', key: 't-todas', texto: t('more_title') });
      salida.push(...aFilas(resto, 'r', columnas));
    }
    return salida;
  }, [cargando, S.view, S.showAll, filtrados, modoPremium, gruposPremium, t, columnas]);

  const { opcionesDept, ciudades, barrios } = useMemo(() => {
    const oDept = (ubicaciones ? ubicaciones.map((d) => d.nombre) : unicos(props.map((p) => p.dept))).map((d) => [d, d] as [string, string]);
    const pDept = props.filter((p) => !S.dept || p.dept === S.dept);
    const ciu = ubicaciones
      ? unicos(ubicaciones.filter((d) => !S.dept || d.nombre === S.dept).flatMap((d) => d.municipios))
      : unicos(pDept.map((p) => p.city));
    const pCiudad = pDept.filter((p) => !S.city || p.city === S.city);
    return { opcionesDept: oDept, ciudades: ciu, barrios: unicos(pCiudad.map((p) => p.barrio)) };
  }, [ubicaciones, props, S.dept, S.city]);

  const titulo = (p: Prop) => `${t(`t_${p.type}`)} ${t('in_')} ${p.barrio}`;
  const irAResultados = () => lista.current?.scrollToOffset({ offset: Math.max(0, yResultados.current - 8), animated: true });

  const navegar = (n: string) => {
    setMenu(false);
    if (n === 'calc') { setCalcAbierta(true); return; }
    if (n === 'sellers') { setVendedoresAbierto(true); return; }
    if (n === 'map') { setMapaAbierto(true); return; }
    setSeccion(n);
    cambiar({ favOnly: n === 'favs', seller: null, view: 'cards' });
    setTimeout(irAResultados, 120);
  };

  /* ---- cuota hipotecaria ---- */
  const cuotaMensual = () => {
    const precio = +calc.precio, cuota = +calc.cuota / 100, r = +calc.tasa / 100 / 12, n = +calc.anios * 12;
    const prestamo = precio * (1 - cuota);
    if (!prestamo || !n) return '—';
    const m = r ? (prestamo * r) / (1 - Math.pow(1 + r, -n)) : prestamo / n;
    return cop(Math.round(m));
  };

  /* ---- enviar mensaje al vendedor ---- */
  const enviarLead = async () => {
    if (!detalle) return;
    if (!lead.n.trim() || !lead.c.trim()) { mostrarAviso(t('req')); return; }
    try {
      const r = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ propiedad_id: detalle.id, nombre: lead.n, contacto: lead.c, mensaje: lead.m }),
      });
      if (r.ok) { mostrarAviso(t('sent_ok')); setLead({ n: '', c: '', m: '' }); } else { mostrarAviso(t('req')); }
    } catch { mostrarAviso(t('req')); }
  };

  /* ---- pago PSE ---- */
  const irAPse = async () => {
    if (!pse) return;
    if (!pago.n.trim() || !pago.e.trim() || !pago.d.trim() || !pago.ok) { mostrarAviso(t('req')); return; }
    setPago((a) => ({ ...a, enviando: true }));
    mostrarAviso(t('redirecting'));
    try {
      const r = await fetch(`${API}/pagos/propiedad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ propiedad_id: pse.id, nombre: pago.n.trim(), correo: pago.e.trim(), documento: pago.d.trim(), consentimiento: pago.ok }),
      });
      const datos = await r.json();
      if (!r.ok) {
        const errores: string[] = datos.errors ? (Object.values(datos.errors).flat() as string[]) : [];
        throw new Error(errores[0] || datos.message || t('req'));
      }
      if (!datos.url) throw new Error(datos.message || t('req'));
      await Linking.openURL(datos.url);
    } catch (e) {
      mostrarAviso(e instanceof Error && e.message ? e.message : t('req'));
    } finally {
      setPago((a) => ({ ...a, enviando: false }));
    }
  };

  /* ---------- piezas de pantalla ---------- */

  const tarjeta = useCallback((p: Prop, rank?: number, anchoTarjeta: number = anchoColumna) => (
    <Tarjeta p={p} v={vendedores[p.seller]} fav={favs.includes(p.id)} rank={rank} ancho={anchoTarjeta} c={c} t={t} alAbrir={abrirDetalle} alFav={alternarFav} alPagar={abrirPago} />
  ), [vendedores, favs, c, t, abrirDetalle, alternarFav, abrirPago, anchoColumna]);

  const renderFila = useCallback(({ item }: { item: Fila }) => {
    if (item.k === 'fila') {
      return (
        <View style={st.fila}>
          {Array.from({ length: columnas }, (_, j) => (item.items[j]
            ? <Fragment key={j}>{tarjeta(item.items[j])}</Fragment>
            : <View key={j} style={{ width: anchoColumna }} />))}
        </View>
      );
    }
    if (item.k === 'premium') {
      const filasPrem = (lista: Prop[]) => {
        const salida: Prop[][] = [];
        for (let i = 0; i < lista.length; i += columnas) salida.push(lista.slice(i, i + columnas));
        return salida;
      };
      return (
        <View style={[st.panelPremium, { backgroundColor: oscuro ? '#30175f' : '#ece4ff', borderColor: oscuro ? '#e3c985' : '#c9a24a', shadowColor: '#e3c985' }]}>
          <View style={st.bandaTres}>
            <View style={{ flex: 1, backgroundColor: COLOR_NIVEL.oro }} />
            <View style={{ flex: 1, backgroundColor: COLOR_NIVEL.plata }} />
            <View style={{ flex: 1, backgroundColor: COLOR_NIVEL.bronce }} />
          </View>
          <View style={st.premCabecera2}>
            <Ico n="crown" s={17} c={oscuro ? '#e3c985' : '#9a6b00'} />
            <Text style={[st.separador, { color: c.text }, alinear]}>{t('prem_title')}</Text>
          </View>
          {item.grupos.map((g) => (
            <View key={g.k}>
              <View style={st.tierFila3}>
                <Ico n="crown" s={13} c={oscuro ? COLOR_NIVEL[g.k] : NIVEL_TEXTO_DIA[g.k]} />
                <Text style={{ color: oscuro ? COLOR_NIVEL[g.k] : NIVEL_TEXTO_DIA[g.k], fontWeight: '800', fontSize: 15 }}>{t(`tier_${g.k}`)} · {g.lista.length}</Text>
              </View>
              {filasPrem(g.lista).map((par, i) => (
                <View key={par[0].id} style={st.filaPanel}>
                  {Array.from({ length: columnas }, (_, j) => (par[j]
                    ? <Fragment key={j}>{tarjeta(par[j], i * columnas + j + 1, anchoEnPanel)}</Fragment>
                    : <View key={j} style={{ width: anchoEnPanel }} />))}
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }
    if (item.k === 'tier') {
      return (
        <View style={st.tierFila2}>
          <Ico n="crown" s={13} c={COLOR_NIVEL[item.tier]} />
          <Text style={{ color: COLOR_NIVEL[item.tier], fontWeight: '800', fontSize: 15 }}>{t(`tier_${item.tier}`)} · {item.n}</Text>
        </View>
      );
    }
    if (item.k === 'titulo') {
      return (
        <View style={{ paddingHorizontal: 18, marginTop: 10, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {item.icono ? <Ico n={item.icono} s={16} c="#e3c985" /> : null}
            <Text style={[st.separador, { color: c.text }, alinear]}>{item.texto}</Text>
          </View>
          {item.sub ? <Text style={[st.pista, { color: c.muted }]}>{item.sub}</Text> : null}
        </View>
      );
    }
    if (item.k === 'boton') {
      return (
        <Pressable style={st.botonMas} onPress={() => cambiar(item.accion === 'premium' ? { showPrem: true } : { showAll: true })}>
          <Ico n={item.icono} s={13} c="#14110a" /><Text style={st.botonMasTxt}>{item.texto}</Text>
        </Pressable>
      );
    }
    if (item.k === 'pista') return <Text style={[st.pista, { color: c.muted, paddingHorizontal: 18, marginBottom: 10 }]}>{item.texto}</Text>;
    return (
      <View style={st.centro}>
        <Ico n="face-frown" s={34} c={c.muted} solid={false} />
        <Text style={[st.vacio, { color: c.muted }]}>{item.texto}</Text>
        {filtrosActivos ? (
          <Pressable style={st.botonMas} onPress={() => { setS(FILTROS_INICIALES); setTextoBusqueda(''); }} accessibilityRole="button">
            <Ico n="rotate-left" s={13} c="#14110a" /><Text style={st.botonMasTxt}>{t('clear')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }, [tarjeta, anchoColumna, anchoEnPanel, columnas, oscuro, c, t, esArabe, cambiar, filtrosActivos]);

  const puntosMapa = props.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, titulo: titulo(p), precio: `${cop(p.price)}${p.op === 'arriendo' ? t('per_month') : ''}`, ver: t('details') }));

  const bloqueToast = aviso ? (
    <View pointerEvents="none" style={st.toastCaja}><Text style={st.toastTxt}>{aviso}</Text></View>
  ) : null;

  const campoTexto = (valor: string, cambiarValor: (v: string) => void, extra?: { teclado?: 'default' | 'numeric' | 'email-address'; lineas?: number; ph?: string }) => (
    <TextInput
      value={valor}
      onChangeText={cambiarValor}
      keyboardType={extra?.teclado ?? 'default'}
      multiline={!!extra?.lineas}
      numberOfLines={extra?.lineas}
      placeholder={extra?.ph}
      placeholderTextColor={c.muted}
      autoCapitalize="none"
      style={[st.campo, { backgroundColor: c.bg, borderColor: c.border, color: c.text, textAlign: esArabe ? 'right' : 'left' }, extra?.lineas ? { minHeight: 70, textAlignVertical: 'top' } : null]}
    />
  );

  const etiquetaForm = (texto: string): ReactNode => <Text style={[st.etiquetaCampo, { color: c.muted }]}>{texto}</Text>;

  const saludo = (() => {
    const h = reloj.getUTCHours();
    return t(h < 12 ? 'g_morning' : h < 19 ? 'g_afternoon' : 'g_evening');
  })();
  const nCiudades = new Set(props.map((p) => p.city)).size;
  const nVerificadas = props.filter((p) => p.ver).length;

  /* ---- cabecera de la lista: buscador, filtros, resultados ---- */
  const cabecera = useMemo(() => (
    <View>
      <View style={[st.buscador, { backgroundColor: c.card, borderColor: c.border }]}>
        <Ico n="magnifying-glass" s={14} c={c.muted} />
        <TextInput
          value={textoBusqueda}
          onChangeText={escribirBusqueda}
          placeholder={t('search_ph')}
          placeholderTextColor={c.muted}
          style={[st.buscadorInput, { color: c.text, textAlign: esArabe ? 'right' : 'left' }]}
          returnKeyType="search"
        />
        {textoBusqueda ? (
          <Pressable onPress={() => { setTextoBusqueda(''); cambiar({ q: '' }); }} hitSlop={8} accessibilityRole="button">
            <Ico n="xmark" s={14} c={c.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={st.chipsFila}>
        {([['all', t('op_all'), ''], ['venta', t('buy'), 'tag'], ['arriendo', t('rent'), 'key']] as [string, string, string][]).map(([k, etiqueta, icono]) => {
          const on = S.op === k;
          return (
            <Pressable key={k} style={[st.chip, { borderColor: c.border, backgroundColor: c.card }, on && { backgroundColor: BOTON, borderColor: BOTON }]} onPress={() => cambiar({ op: k })} accessibilityRole="button">
              {icono ? <Ico n={icono} s={11} c={on ? '#14110a' : c.text} /> : null}
              <Text style={[st.chipTxt, { color: on ? '#14110a' : c.text }]}>{etiqueta}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[st.panelFiltros2, { backgroundColor: oscuro ? '#2f1760' : '#ece4ff', borderColor: oscuro ? 'rgba(227,201,133,0.35)' : '#cdbff0' }]}>
      <View style={st.tituloFiltros}>
        <Ico n="sliders" s={13} c={oscuro ? '#e3c985' : '#7c3aed'} />
        <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{t('f_btn')}</Text>
      </View>
      <View style={st.filtrosGrid}>
        <View style={st.mitad}><Selector etiqueta={t('f_type')} valor={S.type} vacio={t('any')} c={c} opciones={Object.keys(ICONO_TIPO).map((k) => [k, t(`t_${k}`)] as [string, string])} alCambiar={(v) => cambiar({ type: v })} /></View>
        <View style={st.mitad}><Selector etiqueta={t('f_dept')} valor={S.dept} vacio={t('any')} c={c} opciones={opcionesDept} alCambiar={(v) => cambiar({ dept: v, city: '', barrio: '' })} /></View>
        <View style={st.mitad}><Selector etiqueta={t('f_city')} valor={S.city} vacio={t('anyf')} c={c} opciones={ciudades.map((x) => [x, x] as [string, string])} alCambiar={(v) => cambiar({ city: v, barrio: '' })} /></View>
        <View style={st.mitad}><Selector etiqueta={t('f_barrio')} valor={S.barrio} vacio={t('any')} c={c} opciones={barrios.map((b) => [b, b] as [string, string])} alCambiar={(v) => cambiar({ barrio: v })} /></View>
        <View style={st.mitad}>
          {etiquetaForm(t('f_max'))}
          <View style={{ marginBottom: 8 }}>{campoTexto(S.max, (v) => cambiar({ max: v.replace(/[^0-9]/g, '') }), { teclado: 'numeric', ph: 'COP' })}</View>
        </View>
        <View style={st.mitad}><Selector etiqueta={t('f_beds')} valor={S.beds} vacio={t('any')} c={c} opciones={[1, 2, 3, 4].map((n) => [String(n), `${n}+`] as [string, string])} alCambiar={(v) => cambiar({ beds: v })} /></View>
        <View style={st.mitad}><Selector etiqueta={t('f_sort')} valor={S.sort === 'rel' ? '' : S.sort} vacio={t('s_rel')} c={c} opciones={[['low', t('s_low')], ['high', t('s_high')]]} alCambiar={(v) => cambiar({ sort: v || 'rel' })} /></View>
      </View>
      </View>

      <View onLayout={(e) => { yResultados.current = e.nativeEvent.layout.y; }} />

      <View style={st.estadisticas}>
        {([
          ['house', props.length, 'stat_props'],
          ['city', nCiudades, 'stat_cities'],
          ['people-roof', vendedores.length, 'stat_sellers'],
          ['circle-check', nVerificadas, 'stat_verified'],
        ] as [string, number, string][]).map(([icono, valor, clave]) => (
          <View key={clave} style={[st.estadistica, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[st.estadisticaIco, { backgroundColor: c.soft }]}><Ico n={icono} s={11} c={c.primary2} /></View>
            <Text style={[st.estadisticaNum, { color: c.text }]}>{valor}</Text>
            <Text style={[st.estadisticaTxt, { color: c.muted }]} numberOfLines={2}>{t(clave)}</Text>
          </View>
        ))}
      </View>

      {S.seller !== null && vendedores[S.seller] ? (
        <View style={st.herramientas}>
          <Pressable style={[st.chipVendedor, { backgroundColor: c.soft }]} onPress={() => cambiar({ seller: null })}>
            <Ico n="user" s={11} c={c.primary2} /><Text style={{ color: c.primary2, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>{vendedores[S.seller].name}</Text><Ico n="xmark" s={11} c={c.primary2} />
          </Pressable>
        </View>
      ) : null}

    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [S, textoBusqueda, c, oscuro, esArabe, t, props, vendedores, ubicaciones, opcionesDept, ciudades, barrios]);

  /* ---- pie de la lista: cargando, error o mapa ---- */
  const pie = useMemo(() => cargando ? (
    <View style={st.esqFilas}>
      {[0, 1, 2].map((k) => (
        <View key={k} style={st.fila}>
          {Array.from({ length: columnas }, (_, j) => <Esqueleto key={j} ancho={anchoColumna} c={c} brillo={brillo} />)}
        </View>
      ))}
    </View>
  ) : fallo && props.length === 0 ? (
    <View style={st.centro}>
      <Text style={[st.vacio, { color: c.muted }]}>No se pudo conectar con el servidor.</Text>
      <Pressable style={st.botonMas} onPress={() => cargar('inicial')}><Ico n="rotate-left" s={13} c="#14110a" /><Text style={st.botonMasTxt}>Reintentar</Text></Pressable>
    </View>
  ) : S.view === 'map' ? (
    <View style={[st.mapaCaja, { borderColor: c.border }]}>
      <WebView
        key={filtrados.map((p) => p.id).join(',')}
        originWhitelist={['*']}
        source={{ html: htmlMapa(puntosMapa, false) }}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        onMessage={(e) => {
          const p = props.find((x) => x.id === Number(e.nativeEvent.data));
          if (p) abrirDetalle(p);
        }}
      />
    </View>
  ) : null, [cargando, fallo, props, S.view, filtrados, c, cargar, anchoColumna, columnas, brillo]);

  const datosVendedor = detalle ? vendedores[detalle.seller] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: barraSuperior }}>
      <BarraEstado style={oscuro ? 'light' : 'dark'} />

      {/* barra superior */}
      <View style={[st.barra, { borderBottomColor: c.border, backgroundColor: c.card }]}>
        <Pressable style={[st.botonRedondo, { borderColor: c.border }]} onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="Menú">
          <Ico n="bars" s={16} c={c.text} />
        </Pressable>
        <View style={st.marcaBarra}>
          <Image source={require('./assets/icono.png')} style={st.logoBarra} resizeMode="contain" resizeMethod="resize" tintColor={oscuro ? '#e3c985' : undefined} />
          <Text style={[st.nombreBarra, { color: c.text }]}>Umbral</Text>
        </View>
        <Pressable style={[st.botonRedondo, { borderColor: c.border }]} onPress={alVolver} accessibilityRole="button" accessibilityLabel={t('exit')}>
          <Ico n="right-from-bracket" s={15} c={c.text} />
        </Pressable>
        <Pressable style={[st.botonRedondo, { borderColor: c.border }]} onPress={() => setOscuro((a) => !a)} accessibilityRole="button" accessibilityLabel="Tema">
          <Ico n={oscuro ? 'sun' : 'moon'} s={15} c={c.primary2} />
        </Pressable>
      </View>

      <FlatList
        ref={lista}
        data={filas}
        keyExtractor={(f) => f.key}
        renderItem={renderFila}
        ListHeaderComponent={cabecera}
        ListFooterComponent={pie}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => cargar('manual')} tintColor={c.primary2} colors={[c.primary]} />}
      />

      {bloqueToast}

      <HojaOpciones
        visible={selIdioma}
        titulo={t('lang_pill')}
        opciones={Object.keys(NOMBRES_IDIOMA).map((k) => [k, NOMBRES_IDIOMA[k]] as [string, string])}
        valor={idioma}
        c={c}
        alElegir={(v) => { if (v) alCambiarIdioma(v); }}
        alCerrar={() => setSelIdioma(false)}
      />

      {/* mapa en ventana flotante */}
      <Modal visible={mapaAbierto} transparent animationType="fade" onRequestClose={() => setMapaAbierto(false)}>
        <View style={st.fondoMapa}>
          <View style={[st.ventanaMapa, { backgroundColor: c.card, borderColor: oscuro ? 'rgba(227,201,133,0.45)' : '#d6c8f7' }]}>
            <View style={[st.cabeceraMapa, { backgroundColor: oscuro ? '#2f1760' : '#ece4ff' }]}>
              <Ico n="map-location-dot" s={16} c={oscuro ? '#e3c985' : '#7c3aed'} />
              <Text style={{ flex: 1, color: c.text, fontWeight: '800', fontSize: 15 }} numberOfLines={2}>{['Mapa de propiedades disponibles', 'Map of available properties', 'Mapa de imóveis disponíveis', 'Carte des propriétés disponibles'][idx] || 'Mapa'}</Text>
              <Pressable style={[st.botonRedondo, { borderColor: c.border, width: 36, height: 36, borderRadius: 18 }]} onPress={() => setMapaAbierto(false)} accessibilityRole="button" accessibilityLabel="Cerrar">
                <Ico n="xmark" s={15} c={c.text} />
              </Pressable>
            </View>
            {mapaAbierto ? (
              <WebView
                key={props.length}
                originWhitelist={['*']}
                source={{ html: htmlMapa(puntosMapa, false) }}
                javaScriptEnabled
                domStorageEnabled
                nestedScrollEnabled
                style={{ flex: 1 }}
                onMessage={(e) => {
                  const p = props.find((x) => x.id === Number(e.nativeEvent.data));
                  if (p) { setMapaAbierto(false); setTimeout(() => abrirDetalle(p), 300); }
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      {/* menú lateral */}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={[st.menu, { backgroundColor: c.card, borderRightColor: c.border, paddingTop: barraSuperior + 14 }]}>
            <View style={st.marcaMenu}>
              <Image source={require('./assets/icono.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800', letterSpacing: 3, fontSize: 16 }}>UMBRAL</Text>
                <Text style={{ color: c.primary2, fontStyle: 'italic', fontSize: 12 }}>{t('tagline')}</Text>
              </View>
            </View>
            <Text style={[st.etiquetaMenu, { color: c.muted }]}>{t('nav_main').toUpperCase()}</Text>
            {([['all', 'compass', t('nav_explore')], ['map', 'map-location-dot', t('nav_map')], ['favs', 'heart', t('nav_favs')]] as [string, string, string][]).map(([k, icono, e]) => (
              <Pressable key={k} style={[st.itemMenu, seccion === k && { backgroundColor: c.soft }]} onPress={() => navegar(k)}>
                <View style={{ width: 24, alignItems: 'center' }}><Ico n={icono} s={16} c={seccion === k ? c.primary2 : c.muted} /></View>
                <Text style={{ color: seccion === k ? c.primary2 : c.text, fontSize: 15, fontWeight: seccion === k ? '700' : '500' }}>{e}</Text>
              </Pressable>
            ))}
            <Text style={[st.etiquetaMenu, { color: c.muted }]}>{t('nav_tools').toUpperCase()}</Text>
            {([['calc', 'calculator', t('nav_calc')], ['sellers', 'address-card', t('nav_sellers')]] as [string, string, string][]).map(([k, icono, e]) => (
              <Pressable key={k} style={st.itemMenu} onPress={() => navegar(k)}>
                <View style={{ width: 24, alignItems: 'center' }}><Ico n={icono} s={16} c={c.muted} /></View>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '500' }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(5,3,20,0.6)' }} onPress={() => setMenu(false)} />
        </View>
      </Modal>

      {/* detalle de la propiedad */}
      <Modal visible={detalle !== null} animationType="slide" onRequestClose={() => setDetalle(null)}>
        {detalle ? (
          <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View>
                  {detalle.fotos.length ? (
                    <Carrusel fotos={detalle.fotos} ancho={ancho} alto={270} />
                  ) : (
                    <View style={{ width: ancho, height: 270, backgroundColor: colorArte(detalle.id), alignItems: 'center', justifyContent: 'center' }}>
                      <Ico n={ICONO_TIPO[detalle.type] ?? 'house'} s={64} c="#E4C986" />
                    </View>
                  )}
                  <View style={[st.insignias, { top: barraSuperior + 12 }]}>
                    <View style={[st.insignia, { backgroundColor: detalle.op === 'arriendo' ? BOTON2 : BOTON }]}><Text style={st.insigniaTxt}>{t(detalle.op === 'arriendo' ? 'rental' : 'sale')}</Text></View>
                    {detalle.ver ? <View style={[st.insignia, { backgroundColor: '#3a3a44', flexDirection: 'row', gap: 4 }]}><Ico n="circle-check" s={10} c="#ffffff" /><Text style={[st.insigniaTxt, { color: '#ffffff' }]}>{t('verified')}</Text></View> : null}
                    {detalle.prem ? <View style={[st.insignia, { backgroundColor: '#e3c985', flexDirection: 'row', gap: 4 }]}><Ico n="star" s={10} c="#14110a" /><Text style={[st.insigniaTxt, { color: '#14110a' }]}>{t('premium')}</Text></View> : null}
                  </View>
                  <Pressable style={[st.cerrar, { top: barraSuperior + 8 }]} onPress={() => setDetalle(null)} accessibilityRole="button" accessibilityLabel="Cerrar"><Ico n="xmark" s={16} c="#ffffff" /></Pressable>
                </View>

                <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
                  <Text style={[st.precioDetalle, { color: c.primary2 }, alinear]}>{cop(detalle.price)}{detalle.op === 'arriendo' ? <Text style={[st.precioPequeno, { color: c.muted }]}> {t('per_month')}</Text> : null}</Text>
                  <Text style={[st.tituloDetalle, { color: c.text }, alinear]}>{titulo(detalle)}</Text>
                  <View style={[st.filaUbic, { marginTop: 6 }]}>
                    <Ico n="location-dot" s={12} c={c.muted} />
                    <Text style={[st.ubicacionDetalle, { color: c.muted }]}>{detalle.addr} · {ubic(detalle)}</Text>
                  </View>
                  <View style={[st.datosDetalle]}>
                    {detalle.beds ? <View style={[st.fichaDato, { borderColor: c.border }]}><Ico n="bed" s={13} c={c.primary2} /><Text style={[st.fichaTxt, { color: c.text }]}>{detalle.beds} {t('f_beds')}</Text></View> : null}
                    {detalle.baths ? <View style={[st.fichaDato, { borderColor: c.border }]}><Ico n="bath" s={13} c={c.primary2} /><Text style={[st.fichaTxt, { color: c.text }]}>{detalle.baths}</Text></View> : null}
                    {detalle.park ? <View style={[st.fichaDato, { borderColor: c.border }]}><Ico n="car" s={13} c={c.primary2} /><Text style={[st.fichaTxt, { color: c.text }]}>{detalle.park}</Text></View> : null}
                    <View style={[st.fichaDato, { borderColor: c.border }]}><Ico n="ruler-combined" s={13} c={c.primary2} /><Text style={[st.fichaTxt, { color: c.text }]}>{miles(detalle.area)} {t('m2')}</Text></View>
                    {detalle.estrato ? <View style={[st.fichaDato, { borderColor: c.border }]}><Ico n="layer-group" s={13} c={c.primary2} /><Text style={[st.fichaTxt, { color: c.text }]}>{t('estrato')} {detalle.estrato}</Text></View> : null}
                  </View>

                  {detalle.desc ? (
                    <>
                      <Text style={[st.subtitulo, { color: c.text }, alinear]}>{t('description')}</Text>
                      <Text style={[st.parrafo, { color: c.muted }, alinear]}>{detalle.desc}</Text>
                    </>
                  ) : null}

                  <Text style={[st.subtitulo, { color: c.text }, alinear]}>{t('location')}</Text>
                  <View style={[st.mapaDetalle, { borderColor: c.border }]}>
                    <WebView
                      originWhitelist={['*']}
                      source={{ html: htmlMapa([{ id: detalle.id, lat: detalle.lat, lng: detalle.lng, titulo: detalle.addr, precio: '', ver: '' }], true) }}
                      javaScriptEnabled
                      domStorageEnabled
                      nestedScrollEnabled
                    />
                  </View>

                  {datosVendedor ? (
                    <View style={[st.caja, { backgroundColor: c.card, borderColor: c.border }]}>
                      <Text style={[st.cajaTitulo, { color: c.muted }]}>{t('seller_info').toUpperCase()}</Text>
                      <View style={st.miniVendedor}>
                        <View style={[st.avatarChico, { width: 50, height: 50, borderRadius: 25 }]}><Text style={[st.avatarChicoTxt, { fontSize: 14 }]}>{datosVendedor.ini}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{datosVendedor.name}</Text>
                          <Text style={{ color: c.muted, fontSize: 12 }}>{t(datosVendedor.kind === 'agency' ? 'agency' : 'person')}</Text>
                          {datosVendedor.ver ? <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 2 }}><Ico n="circle-check" s={11} c={c.primary2} /><Text style={{ color: c.primary2, fontSize: 12, fontWeight: '700' }}>{t('verified_seller')}</Text></View> : null}
                        </View>
                      </View>
                      <View style={[st.filaUbic, { marginTop: 12 }]}><Ico n="phone" s={12} c={c.primary2} /><Text style={{ color: c.muted, fontSize: 13 }}>{datosVendedor.phone}</Text></View>
                      <View style={[st.filaUbic, { marginTop: 6 }]}><Ico n="envelope" s={12} c={c.primary2} /><Text style={{ color: c.muted, fontSize: 13 }}>{datosVendedor.email}</Text></View>
                      <Pressable style={[st.botonGhostGrande, { borderColor: c.border, backgroundColor: c.card }]} onPress={() => Linking.openURL(`tel:${datosVendedor.phone.replace(/\s/g, '')}`).catch(() => undefined)}>
                        <Ico n="phone" s={13} c={c.text} /><Text style={{ color: c.text, fontWeight: '700' }}>{t('call')}</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={[st.caja, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={[st.cajaTitulo, { color: c.muted }]}>{t('contact_form').toUpperCase()}</Text>
                    {etiquetaForm(`${t('name')} *`)}
                    <View style={{ marginBottom: 10 }}>{campoTexto(lead.n, (v) => setLead((a) => ({ ...a, n: v })))}</View>
                    {etiquetaForm(`${t('phone_mail')} *`)}
                    <View style={{ marginBottom: 10 }}>{campoTexto(lead.c, (v) => setLead((a) => ({ ...a, c: v })))}</View>
                    {etiquetaForm(t('message'))}
                    <View style={{ marginBottom: 12 }}>{campoTexto(lead.m, (v) => setLead((a) => ({ ...a, m: v })), { lineas: 3 })}</View>
                    <Pressable style={st.botonGrande} onPress={enviarLead}><Ico n="paper-plane" s={13} c="#14110a" /><Text style={st.botonGrandeTxt}>{t('send')}</Text></Pressable>
                  </View>

                  <Pressable
                    style={[st.botonGrande, { backgroundColor: detalle.op === 'arriendo' ? BOTON2 : BOTON, marginTop: 16 }]}
                    onPress={() => { const p = detalle; setDetalle(null); setTimeout(() => abrirPago(p), 250); }}
                  >
                    <Ico n={detalle.op === 'arriendo' ? 'key' : 'cart-shopping'} s={14} c="#14110a" /><Text style={st.botonGrandeTxt}>{t(detalle.op === 'arriendo' ? 'rent' : 'buy')} · PSE</Text>
                  </Pressable>
                  <Pressable style={[st.botonGhostGrande, { borderColor: c.border, backgroundColor: c.card, marginTop: 12 }]} onPress={() => alternarFav(detalle.id)}>
                    <Ico n="heart" s={14} c={c.primary2} solid={favs.includes(detalle.id)} /><Text style={{ color: c.text, fontWeight: '700' }}>{t('nav_favs')}</Text>
                  </Pressable>
                </View>
              </ScrollView>
              {bloqueToast}
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </Modal>

      {/* pago PSE */}
      <Modal visible={pse !== null} transparent animationType="slide" onRequestClose={() => setPse(null)}>
        {pse ? (
          <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(5,3,20,0.65)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[st.hoja, { backgroundColor: c.card, borderColor: c.border }]}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={st.filaEncabezadoHoja}>
                  <View style={[st.logoPse, { backgroundColor: c.soft }]}><Ico n="building-columns" s={13} c={c.primary2} /><Text style={{ color: c.primary2, fontWeight: '800' }}>PSE</Text></View>
                  <Pressable onPress={() => setPse(null)} accessibilityRole="button" accessibilityLabel="Cerrar"><Ico n="xmark" s={18} c={c.text} /></Pressable>
                </View>
                <Text style={[st.tituloHoja, { color: c.text }, alinear]}>{t(pse.op === 'arriendo' ? 'pse_title_rent' : 'pse_title_buy')}</Text>
                <Text style={[st.parrafo, { color: c.muted }, alinear]}>{t('pse_text')}</Text>
                <View style={[st.resumen, { borderColor: c.border, backgroundColor: c.bg }]}>
                  <Text style={{ color: c.muted, fontSize: 13 }}>{t('property')}: <Text style={{ color: c.text, fontWeight: '700' }}>{titulo(pse)}</Text></Text>
                  <Text style={{ color: c.muted, fontSize: 13 }}>{t('location')}: <Text style={{ color: c.text, fontWeight: '700' }}>{pse.city}</Text></Text>
                  <Text style={{ color: c.muted, fontSize: 13 }}>{t('amount')}: <Text style={{ color: c.primary2, fontWeight: '800' }}>{cop(pse.price)}</Text></Text>
                </View>
                {etiquetaForm(`${t('b_name')} *`)}
                <View style={{ marginBottom: 10 }}>{campoTexto(pago.n, (v) => setPago((a) => ({ ...a, n: v })))}</View>
                {etiquetaForm(`${t('b_mail')} *`)}
                <View style={{ marginBottom: 10 }}>{campoTexto(pago.e, (v) => setPago((a) => ({ ...a, e: v })), { teclado: 'email-address' })}</View>
                {etiquetaForm(`${t('b_doc')} *`)}
                <View style={{ marginBottom: 12 }}>{campoTexto(pago.d, (v) => setPago((a) => ({ ...a, d: v })))}</View>
                <Pressable style={st.filaConsentimiento} onPress={() => setPago((a) => ({ ...a, ok: !a.ok }))}>
                  <View style={[st.casilla, { borderColor: c.border }, pago.ok && { backgroundColor: BOTON, borderColor: BOTON }]}>{pago.ok ? <Ico n="check" s={11} c="#ffffff" /> : null}</View>
                  <Text style={{ color: c.muted, fontSize: 12, flex: 1, lineHeight: 18 }}>{t('consent')}</Text>
                </Pressable>
                <Pressable style={[st.botonGrande, { marginTop: 14, opacity: pago.enviando ? 0.6 : 1 }]} disabled={pago.enviando} onPress={irAPse}>
                  <Ico n="lock" s={13} c="#14110a" /><Text style={st.botonGrandeTxt}>{t('go_pse')}</Text>
                </Pressable>
              </ScrollView>
              {bloqueToast}
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </Modal>

      {/* calculadora */}
      <Modal visible={calcAbierta} transparent animationType="fade" onRequestClose={() => setCalcAbierta(false)}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18, backgroundColor: 'rgba(5,3,20,0.65)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[st.hoja, { backgroundColor: c.card, borderColor: c.border, borderRadius: 24, maxHeight: '86%' }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={st.filaEncabezadoHoja}>
                <Text style={[st.tituloHoja, { color: c.text, marginTop: 0, flex: 1 }, alinear]}>{t('calc_title')}</Text>
                <Pressable onPress={() => setCalcAbierta(false)} accessibilityRole="button" accessibilityLabel="Cerrar"><Ico n="xmark" s={18} c={c.text} /></Pressable>
              </View>
              <Text style={[st.parrafo, { color: c.muted, marginBottom: 12 }, alinear]}>{t('calc_note')}</Text>
              {etiquetaForm(t('calc_price'))}
              <View style={{ marginBottom: 10 }}>{campoTexto(calc.precio, (v) => setCalc((a) => ({ ...a, precio: v.replace(/[^0-9]/g, '') })), { teclado: 'numeric' })}</View>
              {etiquetaForm(t('calc_down'))}
              <View style={{ marginBottom: 10 }}>{campoTexto(calc.cuota, (v) => setCalc((a) => ({ ...a, cuota: v.replace(/[^0-9.]/g, '') })), { teclado: 'numeric' })}</View>
              {etiquetaForm(t('calc_rate'))}
              <View style={{ marginBottom: 10 }}>{campoTexto(calc.tasa, (v) => setCalc((a) => ({ ...a, tasa: v.replace(/[^0-9.]/g, '') })), { teclado: 'numeric' })}</View>
              {etiquetaForm(t('calc_years'))}
              <View style={{ marginBottom: 14 }}>{campoTexto(calc.anios, (v) => setCalc((a) => ({ ...a, anios: v.replace(/[^0-9]/g, '') })), { teclado: 'numeric' })}</View>
              <View style={[st.resumen, { borderColor: c.border, backgroundColor: c.bg, alignItems: 'center' }]}>
                <Text style={{ color: c.muted, fontSize: 13 }}>{t('calc_result')}</Text>
                <Text style={{ color: c.primary2, fontSize: 26, fontWeight: '800', marginTop: 4 }}>{cuotaMensual()}</Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* vendedores */}
      <Modal visible={vendedoresAbierto} transparent animationType="slide" onRequestClose={() => setVendedoresAbierto(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(5,3,20,0.65)' }}>
          <View style={[st.hoja, { backgroundColor: c.card, borderColor: c.border, maxHeight: '85%' }]}>
            <View style={st.filaEncabezadoHoja}>
              <Text style={[st.tituloHoja, { color: c.text, marginTop: 0, flex: 1 }, alinear]}>{t('sellers_title')}</Text>
              <Pressable onPress={() => setVendedoresAbierto(false)} accessibilityRole="button" accessibilityLabel="Cerrar"><Ico n="xmark" s={18} c={c.text} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {vendedores.map((v, i) => (
                <View key={v.id} style={[st.caja, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <View style={st.miniVendedor}>
                    <View style={[st.avatarChico, { width: 46, height: 46, borderRadius: 23 }]}><Text style={[st.avatarChicoTxt, { fontSize: 13 }]}>{v.ini}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{v.name}</Text>
                      <Text style={{ color: c.muted, fontSize: 12 }}>{t(v.kind === 'agency' ? 'agency' : 'person')} · {props.filter((p) => p.seller === i).length} {t('props_n')}</Text>
                      {v.ver ? <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 2 }}><Ico n="circle-check" s={11} c={c.primary2} /><Text style={{ color: c.primary2, fontSize: 12, fontWeight: '700' }}>{t('verified_seller')}</Text></View> : null}
                    </View>
                  </View>
                  <View style={[st.filaUbic, { marginTop: 10 }]}><Ico n="phone" s={12} c={c.primary2} /><Text style={{ color: c.muted, fontSize: 13 }}>{v.phone}</Text></View>
                  <View style={[st.filaUbic, { marginTop: 4 }]}><Ico n="envelope" s={12} c={c.primary2} /><Text style={{ color: c.muted, fontSize: 13 }}>{v.email}</Text></View>
                  <Pressable style={[st.botonGhostGrande, { borderColor: c.border, backgroundColor: c.card }]} onPress={() => { setVendedoresAbierto(false); setSeccion('all'); cambiar({ seller: i, view: 'cards', favOnly: false }); setTimeout(irAResultados, 160); }}>
                    <Ico n="house" s={13} c={c.text} /><Text style={{ color: c.text, fontWeight: '700' }}>{t('see_props')}</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- estilos ---------- */

const st = StyleSheet.create({
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, marginTop: 12, paddingHorizontal: 14, height: 50, borderRadius: 25, borderWidth: 1 },
  buscadorInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  chipsFila: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 12, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontWeight: '700' },
  panelFiltros2: { marginHorizontal: 12, marginTop: 14, marginBottom: 18, borderRadius: 18, borderWidth: 1, padding: 12 },
  tituloFiltros: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  contadorFiltros: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#e3c985', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  contadorFiltrosTxt: { color: '#14110a', fontSize: 11, fontWeight: '800' },
  botonesFiltros: { flexDirection: 'row', gap: 10, marginTop: 6 },
  botonLimpiar: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  botonAplicar: { flex: 1.3, height: 44, borderRadius: 14, backgroundColor: '#d4b062', alignItems: 'center', justifyContent: 'center' },
  filaResultados: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 10 },
  ordenar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1 },
  marcaBarra: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoBarra: { width: 28, height: 28 },
  nombreBarra: { fontSize: 19, fontWeight: '800', letterSpacing: 1 },
  filtrosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  panelPremium: { marginHorizontal: 12, marginTop: 6, marginBottom: 16, borderRadius: 22, borderWidth: 2, overflow: 'hidden', paddingBottom: 6, elevation: 10, shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  bandaTres: { flexDirection: 'row', height: 5 },
  premCabecera2: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  tierFila3: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginTop: 8, marginBottom: 10 },
  filaPanel: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 12 },
  tierFila2: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 34, marginTop: 6, marginBottom: 10 },
  mitad: { width: '48.5%' },
  puntosMini: { position: 'absolute', bottom: 5, alignSelf: 'center', flexDirection: 'row', gap: 3 },
  puntoMini: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  puntoMiniOn: { width: 10, backgroundColor: '#ffffff' },
  tierFila: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 8 },
  barra: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  botonRedondo: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipIdioma: { height: 40, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tituloBarra: { flex: 1, fontSize: 16, fontWeight: '800' },

  hero: { margin: 16, borderRadius: 24, padding: 20, backgroundColor: '#1f0e3d', overflow: 'hidden' },
  heroTagFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroTag: { color: '#e3c985', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, flexShrink: 1 },
  heroSaludo: { color: '#ffffff', fontSize: 32, fontWeight: '800', marginTop: 8 },
  heroTexto: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 21, marginTop: 4, marginBottom: 16 },
  operaciones: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chipOp: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  chipOpOn: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  chipOpTxt: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  hbar: { borderRadius: 20, padding: 10, gap: 8 },
  hbarInput: { height: 48, fontSize: 15, paddingHorizontal: 8 },
  hbarBotones: { flexDirection: 'row', gap: 8 },
  hmore: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  botonVer: { flex: 1, height: 46, borderRadius: 14, backgroundColor: BOTON, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  botonVerTxt: { color: '#14110a', fontWeight: '800', fontSize: 14 },
  pildoras: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  pildora: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  pildoraTxt: { color: '#ffffff', fontSize: 12, fontWeight: '600' },

  estadisticas: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, marginTop: 4, marginBottom: 6 },
  estadistica: { flex: 1, borderRadius: 12, borderWidth: 1, borderTopWidth: 2, borderTopColor: '#e3c985', paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center' },
  estadisticaIco: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  estadisticaNum: { fontSize: 16, fontWeight: '800' },
  estadisticaTxt: { fontSize: 8.5, marginTop: 1, textAlign: 'center' },

  panelFiltros: { margin: 16, marginBottom: 0, borderRadius: 18, borderWidth: 1, padding: 16 },
  etiquetaCampo: { fontSize: 10.5, fontWeight: '700', marginBottom: 3 },
  campo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },

  cabeceraResultados: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 18, marginTop: 22 },
  tituloResultados: { fontSize: 24, fontWeight: '800' },
  herramientas: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, marginTop: 10, marginBottom: 14, flexWrap: 'wrap' },
  chipVendedor: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: 12, maxWidth: 220 },
  segmento: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden', height: 38 },
  segmentoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },

  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 12 },
  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 14, paddingHorizontal: 24 },
  vacio: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
  esqFilas: { paddingTop: 6 },
  mapaCaja: { height: 460, borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginHorizontal: 18 },
  mapaDetalle: { height: 220, borderRadius: 18, overflow: 'hidden', borderWidth: 1 },

  tarjeta: { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  fotoTarjeta: { width: '100%', height: 100 },
  insignias: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', gap: 3, flexWrap: 'wrap', maxWidth: '72%' },
  insignia: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center', justifyContent: 'center' },
  insigniaTxt: { color: '#14110a', fontSize: 11, fontWeight: '700' },
  rangoBox: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', gap: 3 },
  rango: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  rangoTxt: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  corazon: { position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  cuerpoTarjeta: { paddingHorizontal: 8, paddingVertical: 7, gap: 3 },
  precio: { fontSize: 15, fontWeight: '800' },
  precioPequeno: { fontSize: 10, fontWeight: '600' },
  tituloTarjeta: { fontSize: 12.5, fontWeight: '700', lineHeight: 16 },
  filaUbic: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ubicacion: { fontSize: 11, lineHeight: 14, flex: 1 },
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 2 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  datoTxt: { fontSize: 10.5, fontWeight: '600' },
  miniVendedor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarChico: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e3c985', alignItems: 'center', justifyContent: 'center' },
  avatarChicoTxt: { color: '#14110a', fontWeight: '800', fontSize: 9 },
  acciones: { flexDirection: 'row', gap: 6, marginTop: 3 },
  botonGhost: { flex: 1, borderWidth: 1, borderRadius: 9, height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  botonLleno: { flex: 1, borderRadius: 9, height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },

  premCaja: { marginHorizontal: 12, marginTop: 10, marginBottom: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(227,201,133,0.35)', padding: 12, backgroundColor: '#230f45', overflow: 'hidden' },
  premCabecera: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  premCorona: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#e3c985', alignItems: 'center', justifyContent: 'center' },
  premTitulo: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  premSub: { fontSize: 12, lineHeight: 17, marginTop: 2, color: 'rgba(255,255,255,0.78)' },
  separador: { fontSize: 18, fontWeight: '800' },
  pista: { fontSize: 13, textAlign: 'center', marginTop: 2 },
  botonMas: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, height: 46, borderRadius: 14, backgroundColor: BOTON, marginVertical: 10 },
  botonMasTxt: { color: '#14110a', fontWeight: '800', fontSize: 14 },

  menu: { width: 290, borderRightWidth: 1, paddingHorizontal: 14 },
  marcaMenu: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingHorizontal: 6 },
  etiquetaMenu: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 14, marginBottom: 6, paddingHorizontal: 6 },
  itemMenu: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12 },

  cerrar: { position: 'absolute', right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(20,10,60,0.7)', alignItems: 'center', justifyContent: 'center' },
  flecha: { position: 'absolute', top: '42%', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(20,10,60,0.6)', alignItems: 'center', justifyContent: 'center' },
  puntos: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  puntoOn: { backgroundColor: '#ffffff', width: 18 },
  precioDetalle: { fontSize: 28, fontWeight: '800' },
  tituloDetalle: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  ubicacionDetalle: { fontSize: 13, lineHeight: 19, flex: 1 },
  datosDetalle: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  fichaDato: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  fichaTxt: { fontSize: 13, fontWeight: '600' },
  subtitulo: { fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 8 },
  parrafo: { fontSize: 14, lineHeight: 22 },
  caja: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 18 },
  cajaTitulo: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  botonGrande: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, height: 50, backgroundColor: BOTON },
  botonGrandeTxt: { color: '#14110a', fontWeight: '800', fontSize: 15 },
  botonGhostGrande: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, height: 48, marginTop: 12 },

  fondoMapa: { flex: 1, backgroundColor: 'rgba(5,3,20,0.7)', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 80 },
  ventanaMapa: { flex: 1, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cabeceraMapa: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(5,3,20,0.65)', justifyContent: 'center', padding: 24 },
  listaSelector: { borderRadius: 20, borderWidth: 1, padding: 14 },
  tituloSelector: { fontSize: 16, fontWeight: '800', marginBottom: 8, paddingHorizontal: 6 },
  opcionSelector: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },

  hoja: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, maxHeight: '92%' },
  filaEncabezadoHoja: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  logoPse: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  tituloHoja: { fontSize: 20, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  resumen: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 4, marginVertical: 14 },
  filaConsentimiento: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  casilla: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },

  toastCaja: { position: 'absolute', left: 24, right: 24, bottom: 30, backgroundColor: '#1f1f26', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: '#e3c985' },
  toastTxt: { color: '#ffffff', textAlign: 'center', fontSize: 13, fontWeight: '600' },
});
