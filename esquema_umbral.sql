--
-- PostgreSQL database dump
--

\restrict nkw7xrfAjbbiQ2triA8K88emdxH07gorIg0tW3qi74tDShtJEVtdc1cPQ2oP0zV

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aceptaciones_legales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aceptaciones_legales (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    tipo character varying(30) NOT NULL,
    version character varying(20) NOT NULL,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip character varying(45)
);


--
-- Name: aceptaciones_legales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aceptaciones_legales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aceptaciones_legales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aceptaciones_legales_id_seq OWNED BY public.aceptaciones_legales.id;


--
-- Name: ajustes_membresia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ajustes_membresia (
    id bigint NOT NULL,
    membresia_id bigint NOT NULL,
    admin_id bigint,
    tipo character varying(20) NOT NULL,
    dias_extendidos integer,
    motivo text NOT NULL,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ajustes_membresia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ajustes_membresia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ajustes_membresia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ajustes_membresia_id_seq OWNED BY public.ajustes_membresia.id;


--
-- Name: alertas_busqueda; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alertas_busqueda (
    id bigint NOT NULL,
    correo character varying(150) NOT NULL,
    criterios jsonb NOT NULL,
    codigo_idioma character(2),
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: alertas_busqueda_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alertas_busqueda_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alertas_busqueda_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alertas_busqueda_id_seq OWNED BY public.alertas_busqueda.id;


--
-- Name: auditorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditorias (
    id bigint NOT NULL,
    user_id bigint,
    entidad character varying(60) NOT NULL,
    id_entidad character varying(40) NOT NULL,
    accion character varying(20) NOT NULL,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    ip character varying(45),
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: auditorias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditorias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditorias_id_seq OWNED BY public.auditorias.id;


--
-- Name: barrios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.barrios (
    id bigint NOT NULL,
    municipio_id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    localidad_comuna character varying(100),
    codigo_postal character varying(10),
    latitud numeric(9,6),
    longitud numeric(9,6)
);


--
-- Name: barrios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.barrios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: barrios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.barrios_id_seq OWNED BY public.barrios.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: caracteristicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caracteristicas (
    id bigint NOT NULL,
    nombre character varying(80) NOT NULL,
    categoria character varying(30) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: caracteristicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.caracteristicas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: caracteristicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.caracteristicas_id_seq OWNED BY public.caracteristicas.id;


--
-- Name: comisiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comisiones (
    id bigint NOT NULL,
    inmobiliaria_id bigint NOT NULL,
    agente_id bigint NOT NULL,
    propiedad_id bigint,
    inmueble character varying(160) NOT NULL,
    operacion character varying(10) NOT NULL,
    base bigint NOT NULL,
    porcentaje numeric(5,2) NOT NULL,
    valor bigint NOT NULL,
    estado character varying(15) DEFAULT 'pendiente'::character varying NOT NULL,
    origen character varying(15) DEFAULT 'panel'::character varying NOT NULL,
    cerrada_en timestamp(0) without time zone NOT NULL,
    pagada_en timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    venta_id bigint,
    contrato_id bigint
);


--
-- Name: comisiones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comisiones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comisiones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comisiones_id_seq OWNED BY public.comisiones.id;


--
-- Name: configuracion_general; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_general (
    clave character varying(80) NOT NULL,
    valor text NOT NULL,
    descripcion character varying(200)
);


--
-- Name: contratos_arriendo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos_arriendo (
    id bigint NOT NULL,
    solicitud_id bigint,
    publicacion_id bigint NOT NULL,
    lead_id bigint NOT NULL,
    canon_cop numeric(14,2) NOT NULL,
    deposito_cop numeric(14,2),
    administracion_cop numeric(14,2),
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    estado character varying(20) NOT NULL
);


--
-- Name: contratos_arriendo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratos_arriendo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratos_arriendo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratos_arriendo_id_seq OWNED BY public.contratos_arriendo.id;


--
-- Name: departamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departamentos (
    id bigint NOT NULL,
    codigo_dane character varying(2) NOT NULL,
    nombre character varying(255) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: departamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departamentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departamentos_id_seq OWNED BY public.departamentos.id;


--
-- Name: disponibilidad_agente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disponibilidad_agente (
    id bigint NOT NULL,
    agente_id bigint NOT NULL,
    dia_semana smallint NOT NULL,
    hora_inicio time(0) without time zone NOT NULL,
    hora_fin time(0) without time zone NOT NULL
);


--
-- Name: disponibilidad_agente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.disponibilidad_agente_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: disponibilidad_agente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.disponibilidad_agente_id_seq OWNED BY public.disponibilidad_agente.id;


--
-- Name: documentos_identidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_identidad (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    tipo character varying(30) NOT NULL,
    archivo_url character varying(300) NOT NULL,
    cifrado boolean DEFAULT false NOT NULL,
    fecha_carga timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: documentos_identidad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documentos_identidad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documentos_identidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documentos_identidad_id_seq OWNED BY public.documentos_identidad.id;


--
-- Name: equipos_agentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipos_agentes (
    id bigint NOT NULL,
    inmobiliaria_id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: equipos_agentes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipos_agentes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipos_agentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipos_agentes_id_seq OWNED BY public.equipos_agentes.id;


--
-- Name: estados_propiedad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estados_propiedad (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: estados_propiedad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estados_propiedad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estados_propiedad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estados_propiedad_id_seq OWNED BY public.estados_propiedad.id;


--
-- Name: eventos_seguridad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos_seguridad (
    id bigint NOT NULL,
    user_id bigint,
    tipo character varying(40) NOT NULL,
    ip character varying(45),
    dispositivo character varying(150),
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: eventos_seguridad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eventos_seguridad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eventos_seguridad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eventos_seguridad_id_seq OWNED BY public.eventos_seguridad.id;


--
-- Name: eventos_webhook_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos_webhook_pago (
    id bigint NOT NULL,
    id_evento_proveedor character varying(80) NOT NULL,
    pago_id bigint,
    payload jsonb NOT NULL,
    firma_valida boolean DEFAULT false NOT NULL,
    procesado boolean DEFAULT false NOT NULL,
    fecha_recepcion timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: eventos_webhook_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eventos_webhook_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eventos_webhook_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eventos_webhook_pago_id_seq OWNED BY public.eventos_webhook_pago.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: historial_estado_propiedad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_estado_propiedad (
    id bigint NOT NULL,
    propiedad_id bigint NOT NULL,
    estado_id bigint NOT NULL,
    user_id bigint NOT NULL,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: historial_estado_propiedad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_estado_propiedad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_estado_propiedad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_estado_propiedad_id_seq OWNED BY public.historial_estado_propiedad.id;


--
-- Name: historial_publicacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_publicacion (
    id bigint NOT NULL,
    publicacion_id bigint NOT NULL,
    precio_cop numeric(14,2),
    estado character varying(20),
    user_id bigint,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: historial_publicacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_publicacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_publicacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_publicacion_id_seq OWNED BY public.historial_publicacion.id;


--
-- Name: idiomas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idiomas (
    codigo character(2) NOT NULL,
    nombre character varying(40) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id bigint NOT NULL,
    propiedad_id bigint NOT NULL,
    nombre character varying(120) NOT NULL,
    contacto character varying(120) NOT NULL,
    mensaje text,
    consentimiento boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    agente_id bigint,
    estado character varying(20) DEFAULT 'nuevo'::character varying NOT NULL,
    publicacion_id bigint,
    clasificacion character varying(20)
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: membresias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membresias (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    plan character varying(15) NOT NULL,
    precio numeric(12,2) NOT NULL,
    estado character varying(15) DEFAULT 'activa'::character varying NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    referencia_pago character varying(60),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    recordatorio_enviado_en timestamp(0) without time zone,
    propiedad_id bigint,
    paquete_id bigint
);


--
-- Name: membresias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.membresias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: membresias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.membresias_id_seq OWNED BY public.membresias.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: moderaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderaciones (
    id bigint NOT NULL,
    publicacion_id bigint NOT NULL,
    moderador_id bigint NOT NULL,
    resultado character varying(20) NOT NULL,
    motivo text,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: moderaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.moderaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: moderaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.moderaciones_id_seq OWNED BY public.moderaciones.id;


--
-- Name: municipios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.municipios (
    id bigint NOT NULL,
    departamento_id bigint NOT NULL,
    codigo_dane character varying(5) NOT NULL,
    nombre character varying(255) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    latitud numeric(9,6),
    longitud numeric(9,6)
);


--
-- Name: municipios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.municipios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: municipios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.municipios_id_seq OWNED BY public.municipios.id;


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    tipo character varying(40) NOT NULL,
    titulo character varying(150) NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id bigint NOT NULL,
    referencia character varying(60) NOT NULL,
    concepto character varying(20) NOT NULL,
    user_id bigint,
    propiedad_id bigint,
    membresia_id bigint,
    plan character varying(15),
    monto_centavos bigint NOT NULL,
    moneda character varying(3) DEFAULT 'COP'::character varying NOT NULL,
    estado character varying(15) DEFAULT 'pendiente'::character varying NOT NULL,
    proveedor character varying(20) NOT NULL,
    transaccion_id character varying(80),
    metodo character varying(30),
    pagador_nombre character varying(120),
    pagador_correo character varying(120),
    pagador_documento character varying(30),
    pagado_en timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    banco character varying(80),
    numero_comprobante character varying(40),
    comprobante_url character varying(300)
);


--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- Name: pais_idioma; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pais_idioma (
    codigo_pais character(2) NOT NULL,
    codigo_idioma character(2) NOT NULL
);


--
-- Name: paquetes_membresia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paquetes_membresia (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    pago_id bigint,
    cupos smallint NOT NULL,
    precio numeric(12,2) NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    referencia_pago character varying(60),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: paquetes_membresia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paquetes_membresia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paquetes_membresia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paquetes_membresia_id_seq OWNED BY public.paquetes_membresia.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos (
    id bigint NOT NULL,
    codigo character varying(80) NOT NULL,
    descripcion character varying(200)
);


--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permisos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- Name: planes_membresia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planes_membresia (
    id bigint NOT NULL,
    plan character varying(15) NOT NULL,
    nombre character varying(30) NOT NULL,
    dias smallint NOT NULL,
    precio numeric(12,2) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    limite_publicaciones integer,
    nivel_posicionamiento smallint DEFAULT '0'::smallint NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: planes_membresia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planes_membresia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planes_membresia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planes_membresia_id_seq OWNED BY public.planes_membresia.id;


--
-- Name: plantillas_mensaje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plantillas_mensaje (
    id bigint NOT NULL,
    codigo character varying(60) NOT NULL,
    codigo_idioma character(2) NOT NULL,
    asunto character varying(200),
    cuerpo text NOT NULL
);


--
-- Name: plantillas_mensaje_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plantillas_mensaje_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plantillas_mensaje_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plantillas_mensaje_id_seq OWNED BY public.plantillas_mensaje.id;


--
-- Name: preferencias_comunicacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preferencias_comunicacion (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    canal character varying(10) NOT NULL,
    tipo_mensaje character varying(40) NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    consentimiento_en timestamp(0) without time zone
);


--
-- Name: preferencias_comunicacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preferencias_comunicacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preferencias_comunicacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preferencias_comunicacion_id_seq OWNED BY public.preferencias_comunicacion.id;


--
-- Name: procesos_venta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procesos_venta (
    id bigint NOT NULL,
    publicacion_id bigint NOT NULL,
    lead_id bigint NOT NULL,
    etapa character varying(20) NOT NULL,
    valor_oferta_cop numeric(14,2),
    valor_cierre_cop numeric(14,2),
    fecha_inicio date DEFAULT CURRENT_DATE NOT NULL,
    fecha_cierre date
);


--
-- Name: procesos_venta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procesos_venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procesos_venta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procesos_venta_id_seq OWNED BY public.procesos_venta.id;


--
-- Name: propiedad_caracteristica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propiedad_caracteristica (
    propiedad_id bigint NOT NULL,
    caracteristica_id bigint NOT NULL
);


--
-- Name: propiedad_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propiedad_fotos (
    id bigint NOT NULL,
    propiedad_id bigint NOT NULL,
    ruta character varying(255) NOT NULL,
    orden smallint DEFAULT '0'::smallint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tipo character varying(20) DEFAULT 'foto'::character varying NOT NULL,
    es_principal boolean DEFAULT false NOT NULL
);


--
-- Name: propiedad_fotos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.propiedad_fotos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: propiedad_fotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.propiedad_fotos_id_seq OWNED BY public.propiedad_fotos.id;


--
-- Name: propiedades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propiedades (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    tipo character varying(255) NOT NULL,
    operacion character varying(255) NOT NULL,
    precio bigint NOT NULL,
    departamento character varying(255) NOT NULL,
    ciudad character varying(255) NOT NULL,
    barrio character varying(255) NOT NULL,
    direccion character varying(255) NOT NULL,
    lat numeric(10,7) NOT NULL,
    lng numeric(10,7) NOT NULL,
    habitaciones smallint DEFAULT '0'::smallint NOT NULL,
    banos smallint DEFAULT '0'::smallint NOT NULL,
    parqueaderos smallint DEFAULT '0'::smallint NOT NULL,
    area integer NOT NULL,
    estrato smallint,
    verificada boolean DEFAULT false NOT NULL,
    estado character varying(255) DEFAULT 'publicada'::character varying NOT NULL,
    imagen character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    agente_id bigint,
    descripcion text,
    pisos smallint,
    antiguedad smallint,
    caracteristicas json,
    area_terreno_m2 numeric(10,2),
    propietario_id bigint,
    verificador_id bigint,
    fecha_verificacion timestamp(0) without time zone,
    tipo_id bigint,
    municipio_id bigint,
    estado_id bigint
);


--
-- Name: propiedades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.propiedades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: propiedades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.propiedades_id_seq OWNED BY public.propiedades.id;


--
-- Name: propietarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propietarios (
    id bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    tipo_identificacion_id bigint,
    numero_documento character varying(30),
    telefono character varying(20),
    correo character varying(150),
    registrado_por bigint NOT NULL
);


--
-- Name: propietarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.propietarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: propietarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.propietarios_id_seq OWNED BY public.propietarios.id;


--
-- Name: publicaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publicaciones (
    id bigint NOT NULL,
    propiedad_id bigint NOT NULL,
    operacion_id bigint NOT NULL,
    publicador_id bigint NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text NOT NULL,
    precio_cop numeric(14,2) NOT NULL,
    estado character varying(20) NOT NULL,
    nivel_posicionamiento smallint DEFAULT '0'::smallint NOT NULL,
    motivo_suspension character varying(20),
    publicar_desde timestamp(0) without time zone,
    retirar_en timestamp(0) without time zone,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: publicaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.publicaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: publicaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.publicaciones_id_seq OWNED BY public.publicaciones.id;


--
-- Name: puntos_interes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.puntos_interes (
    id bigint NOT NULL,
    municipio_id bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    categoria character varying(20) NOT NULL,
    latitud numeric(9,6) NOT NULL,
    longitud numeric(9,6) NOT NULL,
    fuente character varying(60)
);


--
-- Name: puntos_interes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.puntos_interes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: puntos_interes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.puntos_interes_id_seq OWNED BY public.puntos_interes.id;


--
-- Name: registro_correo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registro_correo (
    id bigint NOT NULL,
    user_id bigint,
    destinatario character varying(150) NOT NULL,
    plantilla character varying(60) NOT NULL,
    estado character varying(10) NOT NULL,
    error text,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: registro_correo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registro_correo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registro_correo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registro_correo_id_seq OWNED BY public.registro_correo.id;


--
-- Name: rol_permiso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol_permiso (
    role_id bigint NOT NULL,
    permiso_id bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: seguimiento_lead; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seguimiento_lead (
    id bigint NOT NULL,
    lead_id bigint NOT NULL,
    user_id bigint,
    tipo character varying(20) NOT NULL,
    nota text NOT NULL,
    fecha_tarea timestamp(0) without time zone,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: seguimiento_lead_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seguimiento_lead_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seguimiento_lead_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seguimiento_lead_id_seq OWNED BY public.seguimiento_lead.id;


--
-- Name: sesiones_visita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesiones_visita (
    id bigint NOT NULL,
    pais character(2),
    idioma character(2),
    dispositivo character varying(20),
    fecha_inicio timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sesiones_visita_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sesiones_visita_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sesiones_visita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sesiones_visita_id_seq OWNED BY public.sesiones_visita.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: solicitudes_alquiler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_alquiler (
    id bigint NOT NULL,
    publicacion_id bigint NOT NULL,
    lead_id bigint NOT NULL,
    estado character varying(20) NOT NULL,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: solicitudes_alquiler_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitudes_alquiler_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solicitudes_alquiler_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitudes_alquiler_id_seq OWNED BY public.solicitudes_alquiler.id;


--
-- Name: suscripciones_propiedad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suscripciones_propiedad (
    id bigint NOT NULL,
    publicacion_id bigint NOT NULL,
    correo character varying(150) NOT NULL,
    tipo_alerta character varying(10) NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: suscripciones_propiedad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suscripciones_propiedad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suscripciones_propiedad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suscripciones_propiedad_id_seq OWNED BY public.suscripciones_propiedad.id;


--
-- Name: textos_traduccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.textos_traduccion (
    id bigint NOT NULL,
    clave character varying(120) NOT NULL,
    codigo_idioma character(2) NOT NULL,
    texto text NOT NULL
);


--
-- Name: textos_traduccion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.textos_traduccion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: textos_traduccion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.textos_traduccion_id_seq OWNED BY public.textos_traduccion.id;


--
-- Name: tipos_identificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_identificacion (
    id bigint NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(60) NOT NULL
);


--
-- Name: tipos_identificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_identificacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_identificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_identificacion_id_seq OWNED BY public.tipos_identificacion.id;


--
-- Name: tipos_operacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_operacion (
    id bigint NOT NULL,
    nombre character varying(30) NOT NULL
);


--
-- Name: tipos_operacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_operacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_operacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_operacion_id_seq OWNED BY public.tipos_operacion.id;


--
-- Name: tipos_propiedad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_propiedad (
    id bigint NOT NULL,
    tipo_padre_id bigint,
    nombre character varying(80) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: tipos_propiedad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_propiedad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_propiedad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_propiedad_id_seq OWNED BY public.tipos_propiedad.id;


--
-- Name: traducciones_publicacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.traducciones_publicacion (
    id bigint NOT NULL,
    publicacion_id bigint NOT NULL,
    codigo_idioma character(2) NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text NOT NULL,
    proveedor character varying(40),
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: traducciones_publicacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.traducciones_publicacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: traducciones_publicacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.traducciones_publicacion_id_seq OWNED BY public.traducciones_publicacion.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    role_id bigint,
    telefono character varying(20),
    tipo_documento character varying(10),
    numero_documento character varying(30),
    representante_legal character varying(255),
    pais_residencia character varying(2) DEFAULT 'CO'::character varying NOT NULL,
    estado character varying(15) DEFAULT 'activo'::character varying NOT NULL,
    avatar character varying(255),
    inmobiliaria_id bigint,
    idioma_preferido character(2),
    intentos_fallidos smallint DEFAULT '0'::smallint NOT NULL,
    bloqueado_hasta timestamp(0) without time zone,
    equipo_id bigint,
    descripcion_publica text,
    dos_factores boolean DEFAULT false NOT NULL,
    dos_factores_secreto character varying(255)
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verificaciones (
    id bigint NOT NULL,
    user_id bigint,
    decidido_por bigint,
    origen character varying(15) DEFAULT 'administrador'::character varying NOT NULL,
    decision character varying(10) NOT NULL,
    motivo text,
    estado_anterior character varying(15) NOT NULL,
    estado_nuevo character varying(15) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    cuenta_nombre character varying(255),
    cuenta_email character varying(255),
    cuenta_rol character varying(30),
    decisor_nombre character varying(255),
    documento_id bigint,
    puntaje_ia numeric(5,2)
);


--
-- Name: verificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verificaciones_id_seq OWNED BY public.verificaciones.id;


--
-- Name: visitas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitas (
    id bigint NOT NULL,
    propiedad_id bigint NOT NULL,
    lead_id bigint,
    agente_id bigint,
    nombre character varying(120) NOT NULL,
    contacto character varying(120) NOT NULL,
    fecha timestamp(0) without time zone NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    nota text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: visitas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visitas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visitas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visitas_id_seq OWNED BY public.visitas.id;


--
-- Name: vistas_publicacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vistas_publicacion (
    id bigint NOT NULL,
    publicacion_id bigint NOT NULL,
    sesion_id bigint,
    fecha timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vistas_publicacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vistas_publicacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vistas_publicacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vistas_publicacion_id_seq OWNED BY public.vistas_publicacion.id;


--
-- Name: aceptaciones_legales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aceptaciones_legales ALTER COLUMN id SET DEFAULT nextval('public.aceptaciones_legales_id_seq'::regclass);


--
-- Name: ajustes_membresia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_membresia ALTER COLUMN id SET DEFAULT nextval('public.ajustes_membresia_id_seq'::regclass);


--
-- Name: alertas_busqueda id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_busqueda ALTER COLUMN id SET DEFAULT nextval('public.alertas_busqueda_id_seq'::regclass);


--
-- Name: auditorias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias ALTER COLUMN id SET DEFAULT nextval('public.auditorias_id_seq'::regclass);


--
-- Name: barrios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barrios ALTER COLUMN id SET DEFAULT nextval('public.barrios_id_seq'::regclass);


--
-- Name: caracteristicas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caracteristicas ALTER COLUMN id SET DEFAULT nextval('public.caracteristicas_id_seq'::regclass);


--
-- Name: comisiones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones ALTER COLUMN id SET DEFAULT nextval('public.comisiones_id_seq'::regclass);


--
-- Name: contratos_arriendo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_arriendo ALTER COLUMN id SET DEFAULT nextval('public.contratos_arriendo_id_seq'::regclass);


--
-- Name: departamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos ALTER COLUMN id SET DEFAULT nextval('public.departamentos_id_seq'::regclass);


--
-- Name: disponibilidad_agente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_agente ALTER COLUMN id SET DEFAULT nextval('public.disponibilidad_agente_id_seq'::regclass);


--
-- Name: documentos_identidad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_identidad ALTER COLUMN id SET DEFAULT nextval('public.documentos_identidad_id_seq'::regclass);


--
-- Name: equipos_agentes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos_agentes ALTER COLUMN id SET DEFAULT nextval('public.equipos_agentes_id_seq'::regclass);


--
-- Name: estados_propiedad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados_propiedad ALTER COLUMN id SET DEFAULT nextval('public.estados_propiedad_id_seq'::regclass);


--
-- Name: eventos_seguridad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_seguridad ALTER COLUMN id SET DEFAULT nextval('public.eventos_seguridad_id_seq'::regclass);


--
-- Name: eventos_webhook_pago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_webhook_pago ALTER COLUMN id SET DEFAULT nextval('public.eventos_webhook_pago_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: historial_estado_propiedad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_propiedad ALTER COLUMN id SET DEFAULT nextval('public.historial_estado_propiedad_id_seq'::regclass);


--
-- Name: historial_publicacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_publicacion ALTER COLUMN id SET DEFAULT nextval('public.historial_publicacion_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: membresias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresias ALTER COLUMN id SET DEFAULT nextval('public.membresias_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: moderaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderaciones ALTER COLUMN id SET DEFAULT nextval('public.moderaciones_id_seq'::regclass);


--
-- Name: municipios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios ALTER COLUMN id SET DEFAULT nextval('public.municipios_id_seq'::regclass);


--
-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- Name: paquetes_membresia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes_membresia ALTER COLUMN id SET DEFAULT nextval('public.paquetes_membresia_id_seq'::regclass);


--
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- Name: planes_membresia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planes_membresia ALTER COLUMN id SET DEFAULT nextval('public.planes_membresia_id_seq'::regclass);


--
-- Name: plantillas_mensaje id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantillas_mensaje ALTER COLUMN id SET DEFAULT nextval('public.plantillas_mensaje_id_seq'::regclass);


--
-- Name: preferencias_comunicacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferencias_comunicacion ALTER COLUMN id SET DEFAULT nextval('public.preferencias_comunicacion_id_seq'::regclass);


--
-- Name: procesos_venta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procesos_venta ALTER COLUMN id SET DEFAULT nextval('public.procesos_venta_id_seq'::regclass);


--
-- Name: propiedad_fotos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedad_fotos ALTER COLUMN id SET DEFAULT nextval('public.propiedad_fotos_id_seq'::regclass);


--
-- Name: propiedades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades ALTER COLUMN id SET DEFAULT nextval('public.propiedades_id_seq'::regclass);


--
-- Name: propietarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propietarios ALTER COLUMN id SET DEFAULT nextval('public.propietarios_id_seq'::regclass);


--
-- Name: publicaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicaciones ALTER COLUMN id SET DEFAULT nextval('public.publicaciones_id_seq'::regclass);


--
-- Name: puntos_interes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_interes ALTER COLUMN id SET DEFAULT nextval('public.puntos_interes_id_seq'::regclass);


--
-- Name: registro_correo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_correo ALTER COLUMN id SET DEFAULT nextval('public.registro_correo_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: seguimiento_lead id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_lead ALTER COLUMN id SET DEFAULT nextval('public.seguimiento_lead_id_seq'::regclass);


--
-- Name: sesiones_visita id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_visita ALTER COLUMN id SET DEFAULT nextval('public.sesiones_visita_id_seq'::regclass);


--
-- Name: solicitudes_alquiler id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_alquiler ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_alquiler_id_seq'::regclass);


--
-- Name: suscripciones_propiedad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suscripciones_propiedad ALTER COLUMN id SET DEFAULT nextval('public.suscripciones_propiedad_id_seq'::regclass);


--
-- Name: textos_traduccion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.textos_traduccion ALTER COLUMN id SET DEFAULT nextval('public.textos_traduccion_id_seq'::regclass);


--
-- Name: tipos_identificacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_identificacion ALTER COLUMN id SET DEFAULT nextval('public.tipos_identificacion_id_seq'::regclass);


--
-- Name: tipos_operacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_operacion ALTER COLUMN id SET DEFAULT nextval('public.tipos_operacion_id_seq'::regclass);


--
-- Name: tipos_propiedad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_propiedad ALTER COLUMN id SET DEFAULT nextval('public.tipos_propiedad_id_seq'::regclass);


--
-- Name: traducciones_publicacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.traducciones_publicacion ALTER COLUMN id SET DEFAULT nextval('public.traducciones_publicacion_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificaciones ALTER COLUMN id SET DEFAULT nextval('public.verificaciones_id_seq'::regclass);


--
-- Name: visitas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas ALTER COLUMN id SET DEFAULT nextval('public.visitas_id_seq'::regclass);


--
-- Name: vistas_publicacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas_publicacion ALTER COLUMN id SET DEFAULT nextval('public.vistas_publicacion_id_seq'::regclass);


--
-- Name: aceptaciones_legales aceptaciones_legales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aceptaciones_legales
    ADD CONSTRAINT aceptaciones_legales_pkey PRIMARY KEY (id);


--
-- Name: ajustes_membresia ajustes_membresia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_membresia
    ADD CONSTRAINT ajustes_membresia_pkey PRIMARY KEY (id);


--
-- Name: alertas_busqueda alertas_busqueda_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_busqueda
    ADD CONSTRAINT alertas_busqueda_pkey PRIMARY KEY (id);


--
-- Name: auditorias auditorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_pkey PRIMARY KEY (id);


--
-- Name: barrios barrios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barrios
    ADD CONSTRAINT barrios_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: caracteristicas caracteristicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caracteristicas
    ADD CONSTRAINT caracteristicas_pkey PRIMARY KEY (id);


--
-- Name: comisiones comisiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_pkey PRIMARY KEY (id);


--
-- Name: configuracion_general configuracion_general_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_general
    ADD CONSTRAINT configuracion_general_pkey PRIMARY KEY (clave);


--
-- Name: contratos_arriendo contratos_arriendo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_arriendo
    ADD CONSTRAINT contratos_arriendo_pkey PRIMARY KEY (id);


--
-- Name: departamentos departamentos_codigo_dane_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_codigo_dane_unique UNIQUE (codigo_dane);


--
-- Name: departamentos departamentos_nombre_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_nombre_unique UNIQUE (nombre);


--
-- Name: departamentos departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (id);


--
-- Name: disponibilidad_agente disponibilidad_agente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_agente
    ADD CONSTRAINT disponibilidad_agente_pkey PRIMARY KEY (id);


--
-- Name: documentos_identidad documentos_identidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_identidad
    ADD CONSTRAINT documentos_identidad_pkey PRIMARY KEY (id);


--
-- Name: equipos_agentes equipos_agentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos_agentes
    ADD CONSTRAINT equipos_agentes_pkey PRIMARY KEY (id);


--
-- Name: estados_propiedad estados_propiedad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados_propiedad
    ADD CONSTRAINT estados_propiedad_pkey PRIMARY KEY (id);


--
-- Name: eventos_seguridad eventos_seguridad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_seguridad
    ADD CONSTRAINT eventos_seguridad_pkey PRIMARY KEY (id);


--
-- Name: eventos_webhook_pago eventos_webhook_pago_id_evento_proveedor_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_webhook_pago
    ADD CONSTRAINT eventos_webhook_pago_id_evento_proveedor_unique UNIQUE (id_evento_proveedor);


--
-- Name: eventos_webhook_pago eventos_webhook_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_webhook_pago
    ADD CONSTRAINT eventos_webhook_pago_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: historial_estado_propiedad historial_estado_propiedad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_propiedad
    ADD CONSTRAINT historial_estado_propiedad_pkey PRIMARY KEY (id);


--
-- Name: historial_publicacion historial_publicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_publicacion
    ADD CONSTRAINT historial_publicacion_pkey PRIMARY KEY (id);


--
-- Name: idiomas idiomas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idiomas
    ADD CONSTRAINT idiomas_pkey PRIMARY KEY (codigo);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: membresias membresias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: moderaciones moderaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderaciones
    ADD CONSTRAINT moderaciones_pkey PRIMARY KEY (id);


--
-- Name: municipios municipios_codigo_dane_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_codigo_dane_unique UNIQUE (codigo_dane);


--
-- Name: municipios municipios_departamento_id_nombre_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_departamento_id_nombre_unique UNIQUE (departamento_id, nombre);


--
-- Name: municipios municipios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_numero_comprobante_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_numero_comprobante_unique UNIQUE (numero_comprobante);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_referencia_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_unique UNIQUE (referencia);


--
-- Name: pais_idioma pais_idioma_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pais_idioma
    ADD CONSTRAINT pais_idioma_pkey PRIMARY KEY (codigo_pais);


--
-- Name: paquetes_membresia paquetes_membresia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes_membresia
    ADD CONSTRAINT paquetes_membresia_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: permisos permisos_codigo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_codigo_unique UNIQUE (codigo);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: planes_membresia planes_membresia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planes_membresia
    ADD CONSTRAINT planes_membresia_pkey PRIMARY KEY (id);


--
-- Name: planes_membresia planes_membresia_plan_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planes_membresia
    ADD CONSTRAINT planes_membresia_plan_unique UNIQUE (plan);


--
-- Name: plantillas_mensaje plantillas_mensaje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantillas_mensaje
    ADD CONSTRAINT plantillas_mensaje_pkey PRIMARY KEY (id);


--
-- Name: preferencias_comunicacion preferencias_comunicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferencias_comunicacion
    ADD CONSTRAINT preferencias_comunicacion_pkey PRIMARY KEY (id);


--
-- Name: procesos_venta procesos_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procesos_venta
    ADD CONSTRAINT procesos_venta_pkey PRIMARY KEY (id);


--
-- Name: propiedad_caracteristica propiedad_caracteristica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedad_caracteristica
    ADD CONSTRAINT propiedad_caracteristica_pkey PRIMARY KEY (propiedad_id, caracteristica_id);


--
-- Name: propiedad_fotos propiedad_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedad_fotos
    ADD CONSTRAINT propiedad_fotos_pkey PRIMARY KEY (id);


--
-- Name: propiedades propiedades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_pkey PRIMARY KEY (id);


--
-- Name: propietarios propietarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propietarios
    ADD CONSTRAINT propietarios_pkey PRIMARY KEY (id);


--
-- Name: publicaciones publicaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicaciones
    ADD CONSTRAINT publicaciones_pkey PRIMARY KEY (id);


--
-- Name: puntos_interes puntos_interes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_interes
    ADD CONSTRAINT puntos_interes_pkey PRIMARY KEY (id);


--
-- Name: registro_correo registro_correo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_correo
    ADD CONSTRAINT registro_correo_pkey PRIMARY KEY (id);


--
-- Name: rol_permiso rol_permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_pkey PRIMARY KEY (role_id, permiso_id);


--
-- Name: roles roles_nombre_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_unique UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: seguimiento_lead seguimiento_lead_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_lead
    ADD CONSTRAINT seguimiento_lead_pkey PRIMARY KEY (id);


--
-- Name: sesiones_visita sesiones_visita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_visita
    ADD CONSTRAINT sesiones_visita_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_alquiler solicitudes_alquiler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_alquiler
    ADD CONSTRAINT solicitudes_alquiler_pkey PRIMARY KEY (id);


--
-- Name: suscripciones_propiedad suscripciones_propiedad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suscripciones_propiedad
    ADD CONSTRAINT suscripciones_propiedad_pkey PRIMARY KEY (id);


--
-- Name: textos_traduccion textos_traduccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.textos_traduccion
    ADD CONSTRAINT textos_traduccion_pkey PRIMARY KEY (id);


--
-- Name: tipos_identificacion tipos_identificacion_codigo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_identificacion
    ADD CONSTRAINT tipos_identificacion_codigo_unique UNIQUE (codigo);


--
-- Name: tipos_identificacion tipos_identificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_identificacion
    ADD CONSTRAINT tipos_identificacion_pkey PRIMARY KEY (id);


--
-- Name: tipos_operacion tipos_operacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_operacion
    ADD CONSTRAINT tipos_operacion_pkey PRIMARY KEY (id);


--
-- Name: tipos_propiedad tipos_propiedad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_propiedad
    ADD CONSTRAINT tipos_propiedad_pkey PRIMARY KEY (id);


--
-- Name: traducciones_publicacion traducciones_publicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.traducciones_publicacion
    ADD CONSTRAINT traducciones_publicacion_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_tipo_documento_numero_documento_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tipo_documento_numero_documento_unique UNIQUE (tipo_documento, numero_documento);


--
-- Name: verificaciones verificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificaciones
    ADD CONSTRAINT verificaciones_pkey PRIMARY KEY (id);


--
-- Name: visitas visitas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_pkey PRIMARY KEY (id);


--
-- Name: vistas_publicacion vistas_publicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas_publicacion
    ADD CONSTRAINT vistas_publicacion_pkey PRIMARY KEY (id);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: comisiones_agente_id_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comisiones_agente_id_estado_index ON public.comisiones USING btree (agente_id, estado);


--
-- Name: comisiones_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comisiones_estado_index ON public.comisiones USING btree (estado);


--
-- Name: comisiones_inmobiliaria_id_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comisiones_inmobiliaria_id_estado_index ON public.comisiones USING btree (inmobiliaria_id, estado);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: leads_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_estado_index ON public.leads USING btree (estado);


--
-- Name: membresias_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX membresias_estado_index ON public.membresias USING btree (estado);


--
-- Name: membresias_propiedad_id_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX membresias_propiedad_id_estado_index ON public.membresias USING btree (propiedad_id, estado);


--
-- Name: membresias_user_id_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX membresias_user_id_estado_index ON public.membresias USING btree (user_id, estado);


--
-- Name: pagos_concepto_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_concepto_index ON public.pagos USING btree (concepto);


--
-- Name: pagos_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_estado_index ON public.pagos USING btree (estado);


--
-- Name: pagos_transaccion_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_transaccion_id_index ON public.pagos USING btree (transaccion_id);


--
-- Name: paquetes_membresia_user_id_fecha_fin_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paquetes_membresia_user_id_fecha_fin_index ON public.paquetes_membresia USING btree (user_id, fecha_fin);


--
-- Name: propiedad_fotos_propiedad_id_orden_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX propiedad_fotos_propiedad_id_orden_index ON public.propiedad_fotos USING btree (propiedad_id, orden);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: users_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_estado_index ON public.users USING btree (estado);


--
-- Name: verificaciones_decision_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verificaciones_decision_index ON public.verificaciones USING btree (decision);


--
-- Name: verificaciones_user_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verificaciones_user_id_created_at_index ON public.verificaciones USING btree (user_id, created_at);


--
-- Name: visitas_estado_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visitas_estado_index ON public.visitas USING btree (estado);


--
-- Name: aceptaciones_legales aceptaciones_legales_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aceptaciones_legales
    ADD CONSTRAINT aceptaciones_legales_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ajustes_membresia ajustes_membresia_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_membresia
    ADD CONSTRAINT ajustes_membresia_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ajustes_membresia ajustes_membresia_membresia_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_membresia
    ADD CONSTRAINT ajustes_membresia_membresia_id_foreign FOREIGN KEY (membresia_id) REFERENCES public.membresias(id) ON DELETE CASCADE;


--
-- Name: alertas_busqueda alertas_busqueda_codigo_idioma_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_busqueda
    ADD CONSTRAINT alertas_busqueda_codigo_idioma_foreign FOREIGN KEY (codigo_idioma) REFERENCES public.idiomas(codigo) ON DELETE SET NULL;


--
-- Name: auditorias auditorias_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: barrios barrios_municipio_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barrios
    ADD CONSTRAINT barrios_municipio_id_foreign FOREIGN KEY (municipio_id) REFERENCES public.municipios(id);


--
-- Name: comisiones comisiones_agente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_agente_id_foreign FOREIGN KEY (agente_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comisiones comisiones_contrato_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_contrato_id_foreign FOREIGN KEY (contrato_id) REFERENCES public.contratos_arriendo(id) ON DELETE SET NULL;


--
-- Name: comisiones comisiones_inmobiliaria_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_inmobiliaria_id_foreign FOREIGN KEY (inmobiliaria_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comisiones comisiones_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE SET NULL;


--
-- Name: comisiones comisiones_venta_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_venta_id_foreign FOREIGN KEY (venta_id) REFERENCES public.procesos_venta(id) ON DELETE SET NULL;


--
-- Name: contratos_arriendo contratos_arriendo_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_arriendo
    ADD CONSTRAINT contratos_arriendo_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: contratos_arriendo contratos_arriendo_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_arriendo
    ADD CONSTRAINT contratos_arriendo_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: contratos_arriendo contratos_arriendo_solicitud_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_arriendo
    ADD CONSTRAINT contratos_arriendo_solicitud_id_foreign FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes_alquiler(id) ON DELETE SET NULL;


--
-- Name: disponibilidad_agente disponibilidad_agente_agente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilidad_agente
    ADD CONSTRAINT disponibilidad_agente_agente_id_foreign FOREIGN KEY (agente_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: documentos_identidad documentos_identidad_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_identidad
    ADD CONSTRAINT documentos_identidad_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: equipos_agentes equipos_agentes_inmobiliaria_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos_agentes
    ADD CONSTRAINT equipos_agentes_inmobiliaria_id_foreign FOREIGN KEY (inmobiliaria_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: eventos_seguridad eventos_seguridad_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_seguridad
    ADD CONSTRAINT eventos_seguridad_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: eventos_webhook_pago eventos_webhook_pago_pago_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_webhook_pago
    ADD CONSTRAINT eventos_webhook_pago_pago_id_foreign FOREIGN KEY (pago_id) REFERENCES public.pagos(id) ON DELETE SET NULL;


--
-- Name: historial_estado_propiedad historial_estado_propiedad_estado_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_propiedad
    ADD CONSTRAINT historial_estado_propiedad_estado_id_foreign FOREIGN KEY (estado_id) REFERENCES public.estados_propiedad(id);


--
-- Name: historial_estado_propiedad historial_estado_propiedad_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_propiedad
    ADD CONSTRAINT historial_estado_propiedad_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: historial_estado_propiedad historial_estado_propiedad_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_propiedad
    ADD CONSTRAINT historial_estado_propiedad_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: historial_publicacion historial_publicacion_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_publicacion
    ADD CONSTRAINT historial_publicacion_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: historial_publicacion historial_publicacion_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_publicacion
    ADD CONSTRAINT historial_publicacion_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_agente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_agente_id_foreign FOREIGN KEY (agente_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: leads leads_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE SET NULL;


--
-- Name: membresias membresias_paquete_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_paquete_id_foreign FOREIGN KEY (paquete_id) REFERENCES public.paquetes_membresia(id) ON DELETE CASCADE;


--
-- Name: membresias membresias_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: membresias membresias_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: moderaciones moderaciones_moderador_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderaciones
    ADD CONSTRAINT moderaciones_moderador_id_foreign FOREIGN KEY (moderador_id) REFERENCES public.users(id);


--
-- Name: moderaciones moderaciones_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderaciones
    ADD CONSTRAINT moderaciones_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: municipios municipios_departamento_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_departamento_id_foreign FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id);


--
-- Name: notificaciones notificaciones_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_membresia_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_membresia_id_foreign FOREIGN KEY (membresia_id) REFERENCES public.membresias(id) ON DELETE SET NULL;


--
-- Name: pagos pagos_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE SET NULL;


--
-- Name: pagos pagos_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pais_idioma pais_idioma_codigo_idioma_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pais_idioma
    ADD CONSTRAINT pais_idioma_codigo_idioma_foreign FOREIGN KEY (codigo_idioma) REFERENCES public.idiomas(codigo);


--
-- Name: paquetes_membresia paquetes_membresia_pago_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes_membresia
    ADD CONSTRAINT paquetes_membresia_pago_id_foreign FOREIGN KEY (pago_id) REFERENCES public.pagos(id) ON DELETE SET NULL;


--
-- Name: paquetes_membresia paquetes_membresia_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paquetes_membresia
    ADD CONSTRAINT paquetes_membresia_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: plantillas_mensaje plantillas_mensaje_codigo_idioma_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantillas_mensaje
    ADD CONSTRAINT plantillas_mensaje_codigo_idioma_foreign FOREIGN KEY (codigo_idioma) REFERENCES public.idiomas(codigo);


--
-- Name: preferencias_comunicacion preferencias_comunicacion_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferencias_comunicacion
    ADD CONSTRAINT preferencias_comunicacion_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: procesos_venta procesos_venta_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procesos_venta
    ADD CONSTRAINT procesos_venta_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: procesos_venta procesos_venta_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procesos_venta
    ADD CONSTRAINT procesos_venta_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: propiedad_caracteristica propiedad_caracteristica_caracteristica_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedad_caracteristica
    ADD CONSTRAINT propiedad_caracteristica_caracteristica_id_foreign FOREIGN KEY (caracteristica_id) REFERENCES public.caracteristicas(id);


--
-- Name: propiedad_caracteristica propiedad_caracteristica_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedad_caracteristica
    ADD CONSTRAINT propiedad_caracteristica_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: propiedad_fotos propiedad_fotos_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedad_fotos
    ADD CONSTRAINT propiedad_fotos_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: propiedades propiedades_agente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_agente_id_foreign FOREIGN KEY (agente_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: propiedades propiedades_estado_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_estado_id_foreign FOREIGN KEY (estado_id) REFERENCES public.estados_propiedad(id);


--
-- Name: propiedades propiedades_municipio_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_municipio_id_foreign FOREIGN KEY (municipio_id) REFERENCES public.municipios(id);


--
-- Name: propiedades propiedades_propietario_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_propietario_id_foreign FOREIGN KEY (propietario_id) REFERENCES public.propietarios(id) ON DELETE SET NULL;


--
-- Name: propiedades propiedades_tipo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_tipo_id_foreign FOREIGN KEY (tipo_id) REFERENCES public.tipos_propiedad(id);


--
-- Name: propiedades propiedades_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: propiedades propiedades_verificador_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propiedades
    ADD CONSTRAINT propiedades_verificador_id_foreign FOREIGN KEY (verificador_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: propietarios propietarios_registrado_por_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propietarios
    ADD CONSTRAINT propietarios_registrado_por_foreign FOREIGN KEY (registrado_por) REFERENCES public.users(id);


--
-- Name: propietarios propietarios_tipo_identificacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propietarios
    ADD CONSTRAINT propietarios_tipo_identificacion_id_foreign FOREIGN KEY (tipo_identificacion_id) REFERENCES public.tipos_identificacion(id);


--
-- Name: publicaciones publicaciones_operacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicaciones
    ADD CONSTRAINT publicaciones_operacion_id_foreign FOREIGN KEY (operacion_id) REFERENCES public.tipos_operacion(id);


--
-- Name: publicaciones publicaciones_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicaciones
    ADD CONSTRAINT publicaciones_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: publicaciones publicaciones_publicador_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicaciones
    ADD CONSTRAINT publicaciones_publicador_id_foreign FOREIGN KEY (publicador_id) REFERENCES public.users(id);


--
-- Name: puntos_interes puntos_interes_municipio_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_interes
    ADD CONSTRAINT puntos_interes_municipio_id_foreign FOREIGN KEY (municipio_id) REFERENCES public.municipios(id) ON DELETE CASCADE;


--
-- Name: registro_correo registro_correo_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_correo
    ADD CONSTRAINT registro_correo_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: rol_permiso rol_permiso_permiso_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_permiso_id_foreign FOREIGN KEY (permiso_id) REFERENCES public.permisos(id);


--
-- Name: rol_permiso rol_permiso_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: seguimiento_lead seguimiento_lead_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_lead
    ADD CONSTRAINT seguimiento_lead_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: seguimiento_lead seguimiento_lead_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_lead
    ADD CONSTRAINT seguimiento_lead_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sesiones_visita sesiones_visita_idioma_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_visita
    ADD CONSTRAINT sesiones_visita_idioma_foreign FOREIGN KEY (idioma) REFERENCES public.idiomas(codigo) ON DELETE SET NULL;


--
-- Name: solicitudes_alquiler solicitudes_alquiler_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_alquiler
    ADD CONSTRAINT solicitudes_alquiler_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: solicitudes_alquiler solicitudes_alquiler_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_alquiler
    ADD CONSTRAINT solicitudes_alquiler_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: suscripciones_propiedad suscripciones_propiedad_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suscripciones_propiedad
    ADD CONSTRAINT suscripciones_propiedad_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: textos_traduccion textos_traduccion_codigo_idioma_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.textos_traduccion
    ADD CONSTRAINT textos_traduccion_codigo_idioma_foreign FOREIGN KEY (codigo_idioma) REFERENCES public.idiomas(codigo);


--
-- Name: tipos_propiedad tipos_propiedad_tipo_padre_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_propiedad
    ADD CONSTRAINT tipos_propiedad_tipo_padre_id_foreign FOREIGN KEY (tipo_padre_id) REFERENCES public.tipos_propiedad(id);


--
-- Name: traducciones_publicacion traducciones_publicacion_codigo_idioma_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.traducciones_publicacion
    ADD CONSTRAINT traducciones_publicacion_codigo_idioma_foreign FOREIGN KEY (codigo_idioma) REFERENCES public.idiomas(codigo);


--
-- Name: traducciones_publicacion traducciones_publicacion_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.traducciones_publicacion
    ADD CONSTRAINT traducciones_publicacion_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: users users_equipo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_equipo_id_foreign FOREIGN KEY (equipo_id) REFERENCES public.equipos_agentes(id) ON DELETE SET NULL;


--
-- Name: users users_idioma_preferido_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_idioma_preferido_foreign FOREIGN KEY (idioma_preferido) REFERENCES public.idiomas(codigo);


--
-- Name: users users_inmobiliaria_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_inmobiliaria_id_foreign FOREIGN KEY (inmobiliaria_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: verificaciones verificaciones_decidido_por_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificaciones
    ADD CONSTRAINT verificaciones_decidido_por_foreign FOREIGN KEY (decidido_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: verificaciones verificaciones_documento_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificaciones
    ADD CONSTRAINT verificaciones_documento_id_foreign FOREIGN KEY (documento_id) REFERENCES public.documentos_identidad(id) ON DELETE SET NULL;


--
-- Name: verificaciones verificaciones_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verificaciones
    ADD CONSTRAINT verificaciones_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: visitas visitas_agente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_agente_id_foreign FOREIGN KEY (agente_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: visitas visitas_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: visitas visitas_propiedad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_propiedad_id_foreign FOREIGN KEY (propiedad_id) REFERENCES public.propiedades(id) ON DELETE CASCADE;


--
-- Name: vistas_publicacion vistas_publicacion_publicacion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas_publicacion
    ADD CONSTRAINT vistas_publicacion_publicacion_id_foreign FOREIGN KEY (publicacion_id) REFERENCES public.publicaciones(id) ON DELETE CASCADE;


--
-- Name: vistas_publicacion vistas_publicacion_sesion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas_publicacion
    ADD CONSTRAINT vistas_publicacion_sesion_id_foreign FOREIGN KEY (sesion_id) REFERENCES public.sesiones_visita(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict nkw7xrfAjbbiQ2triA8K88emdxH07gorIg0tW3qi74tDShtJEVtdc1cPQ2oP0zV

