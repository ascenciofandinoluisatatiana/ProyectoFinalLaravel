<?php

namespace App\Services\Paneles;

use App\Models\Comision;
use App\Models\Lead;
use App\Models\Notificacion;
use App\Models\Pago;
use App\Models\Propiedad;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Support\Facades\Auth;

/**
 * Guarda en la tabla "notificaciones" los avisos de la inmobiliaria y del agente
 * (el vendedor tiene los suyos en LeadObserver y VisitaObserver).
 *
 * Reglas:
 *  - Cada aviso dice qué pasó ("La propiedad fue pausada"), no un texto genérico.
 *  - La inmobiliaria recibe lo de sus propiedades; el agente solo lo que tiene a su cargo.
 *  - Quien hizo la acción no recibe aviso de su propia acción.
 *  - Nunca rompe la acción original: todo va dentro de try/catch.
 */
class AvisosGuardados
{
    private const ZONA = 'America/Bogota';

    /** El comando que vence planes lo activa para que el agente no reciba además "pasó a borrador". */
    public static bool $silenciarEstado = false;

    private const FRASES_ESTADO = [
        'publicada' => 'fue publicada',
        'pausada' => 'fue pausada',
        'borrador' => 'pasó a borrador',
        'vendida' => 'fue marcada como vendida',
        'arrendada' => 'fue marcada como arrendada',
    ];

    /* ===================== Contactos ===================== */

    public static function contactoNuevo(Lead $lead): void
    {
        self::seguro(function () use ($lead) {
            $propiedad = Propiedad::find($lead->propiedad_id);
            if (! $propiedad) {
                return;
            }
            $titulo = Notificacion::tituloPropiedad($propiedad);

            if (self::paraRol($propiedad->user_id, 'inmobiliaria')) {
                Notificacion::crear((int) $propiedad->user_id, 'contacto-' . $lead->id, 'contacto',
                    'Nuevo contacto: ' . $lead->nombre, $titulo, '/inmobiliaria/contactos.html', 'fa-comments', 'normal', $lead->created_at);
            }
            self::contactoAsignado($lead, $titulo);
        });
    }

    /** El contacto quedó a cargo de un agente. */
    public static function contactoAsignado(Lead $lead, ?string $titulo = null): void
    {
        self::seguro(function () use ($lead, $titulo) {
            if (! self::paraRol($lead->agente_id, 'agente') || self::esQuienActua($lead->agente_id)) {
                return;
            }
            $titulo ??= Notificacion::tituloPropiedad(Propiedad::find($lead->propiedad_id));
            Notificacion::crear((int) $lead->agente_id, 'contacto-' . $lead->id . '-asignado', 'contacto',
                'Contacto asignado: ' . $lead->nombre, $titulo, '/agente/contactos.html', 'fa-comments');
        });
    }

    /* ===================== Visitas ===================== */

    public static function visitaNueva(Visita $visita): void
    {
        self::seguro(function () use ($visita) {
            $propiedad = Propiedad::find($visita->propiedad_id);
            if (! $propiedad) {
                return;
            }
            $detalle = Notificacion::tituloPropiedad($propiedad) . ' · ' . self::fecha($visita);

            if (self::paraRol($propiedad->user_id, 'inmobiliaria') && ! self::esQuienActua($propiedad->user_id)) {
                Notificacion::crear((int) $propiedad->user_id, 'visita-' . $visita->id . '-nueva', 'visita',
                    'Nueva visita: ' . $visita->nombre, $detalle, '/inmobiliaria/visitas.html', 'fa-calendar-check', 'normal', $visita->created_at);
            }
            self::visitaAsignada($visita, $detalle);
        });
    }

    /** La visita quedó a cargo de un agente. */
    public static function visitaAsignada(Visita $visita, ?string $detalle = null): void
    {
        self::seguro(function () use ($visita, $detalle) {
            if (! self::paraRol($visita->agente_id, 'agente') || self::esQuienActua($visita->agente_id)) {
                return;
            }
            $detalle ??= Notificacion::tituloPropiedad(Propiedad::find($visita->propiedad_id)) . ' · ' . self::fecha($visita);
            Notificacion::crear((int) $visita->agente_id, 'visita-' . $visita->id . '-asignada', 'visita',
                'Visita asignada: ' . $visita->nombre, $detalle, '/agente/visitas.html', 'fa-calendar-check');
        });
    }

    /** Visita confirmada o cancelada: avisa a la inmobiliaria y al agente (menos a quien lo hizo). */
    public static function visitaEstado(Visita $visita): void
    {
        self::seguro(function () use ($visita) {
            if (! in_array($visita->estado, ['confirmada', 'cancelada'], true)) {
                return;
            }
            $propiedad = Propiedad::find($visita->propiedad_id);
            if (! $propiedad) {
                return;
            }
            $cancelada = $visita->estado === 'cancelada';
            $titulo = 'Visita ' . $visita->estado . ': ' . $visita->nombre;
            $detalle = Notificacion::tituloPropiedad($propiedad) . ' · ' . self::fecha($visita);
            $clave = 'visita-' . $visita->id . '-' . $visita->estado . '-' . now()->timestamp;
            $icono = $cancelada ? 'fa-calendar-xmark' : 'fa-calendar-check';
            $tono = $cancelada ? 'peligro' : 'ok';

            if (self::paraRol($propiedad->user_id, 'inmobiliaria') && ! self::esQuienActua($propiedad->user_id)) {
                Notificacion::crear((int) $propiedad->user_id, $clave, 'visita', $titulo, $detalle, '/inmobiliaria/visitas.html', $icono, $tono);
            }
            if (self::paraRol($visita->agente_id, 'agente') && ! self::esQuienActua($visita->agente_id)) {
                Notificacion::crear((int) $visita->agente_id, $clave, 'visita', $titulo, $detalle, '/agente/visitas.html', $icono, $tono);
            }
        });
    }

    /* ===================== Propiedades ===================== */

    /** Cambió el estado de una propiedad: el agente a cargo sabe qué pasó. */
    public static function propiedadEstado(Propiedad $propiedad): void
    {
        self::seguro(function () use ($propiedad) {
            $frase = self::FRASES_ESTADO[$propiedad->estado] ?? null;
            if (self::$silenciarEstado || ! $frase || ! self::paraRol($propiedad->agente_id, 'agente') || self::esQuienActua($propiedad->agente_id)) {
                return;
            }
            Notificacion::crear((int) $propiedad->agente_id, 'propiedad-' . $propiedad->id . '-' . $propiedad->estado . '-' . now()->timestamp,
                'propiedad', 'La propiedad ' . $frase, Notificacion::tituloPropiedad($propiedad), '/agente/propiedades.html',
                $propiedad->estado === 'pausada' || $propiedad->estado === 'borrador' ? 'fa-pause' : 'fa-house', 'normal');
        });
    }

    /** Le asignaron una propiedad al agente. */
    public static function propiedadAsignada(Propiedad $propiedad): void
    {
        self::seguro(function () use ($propiedad) {
            if (! self::paraRol($propiedad->agente_id, 'agente') || self::esQuienActua($propiedad->agente_id)) {
                return;
            }
            Notificacion::crear((int) $propiedad->agente_id, 'propiedad-' . $propiedad->id . '-asignada-' . now()->timestamp,
                'propiedad', 'Se te asignó una propiedad', Notificacion::tituloPropiedad($propiedad), '/agente/propiedades.html', 'fa-house');
        });
    }

    /* ===================== Comisiones ===================== */

    /** Se cerró una venta o un arriendo con comisión. */
    public static function comisionNueva(Comision $comision): void
    {
        self::seguro(function () use ($comision) {
            $valor = '$' . number_format($comision->valor, 0, ',', '.');

            if (self::paraRol($comision->inmobiliaria_id, 'inmobiliaria')) {
                $agente = User::whereKey($comision->agente_id)->value('name') ?? 'agente';
                Notificacion::crear((int) $comision->inmobiliaria_id, 'cierre-' . $comision->id, 'cierre',
                    ($comision->operacion === 'venta' ? 'Venta cerrada: ' : 'Arriendo cerrado: ') . $comision->inmueble,
                    'Comisión de ' . $agente . ': ' . $valor, '/inmobiliaria/ventas.html', 'fa-handshake', 'ok');
            }
            if (self::paraRol($comision->agente_id, 'agente')) {
                Notificacion::crear((int) $comision->agente_id, 'comision-' . $comision->id, 'comision',
                    'Ganaste una comisión de ' . $valor, $comision->inmueble, '/agente/ventas.html', 'fa-hand-holding-dollar', 'ok');
            }
        });
    }

    /** La inmobiliaria marcó la comisión como pagada. */
    public static function comisionPagada(Comision $comision): void
    {
        self::seguro(function () use ($comision) {
            if (! self::paraRol($comision->agente_id, 'agente')) {
                return;
            }
            Notificacion::crear((int) $comision->agente_id, 'pagada-' . $comision->id . '-' . now()->timestamp, 'comision',
                'Te pagaron la comisión de $' . number_format($comision->valor, 0, ',', '.'), $comision->inmueble,
                '/agente/ventas.html', 'fa-sack-dollar', 'ok');
        });
    }

    /* ===================== Pagos y planes de publicación ===================== */

    /** Resultado de un pago de membresía o plan (inmobiliaria; el vendedor ya tiene los suyos). */
    public static function pagoResultado(Pago $pago): void
    {
        self::seguro(function () use ($pago) {
            if ($pago->concepto !== 'membresia' || ! self::paraRol($pago->user_id, 'inmobiliaria')) {
                return;
            }
            $aprobado = $pago->estado === 'aprobado';
            if (! $aprobado && ! in_array($pago->estado, ['rechazado', 'error', 'anulado'], true)) {
                return;
            }
            Notificacion::crear((int) $pago->user_id, 'pago-' . $pago->id . '-' . $pago->estado, 'pago',
                $aprobado ? 'Pago aprobado' : 'Pago ' . ($pago->estado === 'rechazado' ? 'rechazado' : 'no completado'),
                '$' . number_format($pago->monto, 0, ',', '.') . ' · ' . $pago->referencia,
                '/inmobiliaria/membresia.html', $aprobado ? 'fa-circle-check' : 'fa-circle-xmark', $aprobado ? 'ok' : 'peligro');
        });
    }

    /** Se pagó una publicación normal por tiempo o un posicionamiento. */
    public static function planActivado(Propiedad $propiedad, string $tipo, $hasta): void
    {
        self::seguro(function () use ($propiedad, $tipo, $hasta) {
            $rol = self::rolDuenio($propiedad);
            if (! $rol) {
                return;
            }
            $fin = \Illuminate\Support\Carbon::parse($hasta)->setTimezone(self::ZONA)->format('d/m/Y');
            Notificacion::crear((int) $propiedad->user_id, 'plan-' . $tipo . '-' . $propiedad->id . '-' . now()->timestamp, 'plan',
                $tipo === 'normal' ? 'Publicación activa' : 'Posicionamiento activo',
                Notificacion::tituloPropiedad($propiedad) . ' · hasta el ' . $fin,
                self::urlDuenio($rol, $propiedad), $tipo === 'normal' ? 'fa-bullhorn' : 'fa-arrow-up', 'ok');
        });
    }

    /**
     * "Le quedan N días": avisa al dueño y al agente a cargo. Devuelve true si el aviso es nuevo
     * (o, en modo solo ver, si se avisaría). Usa tipo "vencimiento" para que salga en la campana.
     */
    public static function planPorVencer(Propiedad $propiedad, string $tipo, string $finLocal, int $dias, bool $soloVer = false): bool
    {
        $nuevo = false;
        self::seguro(function () use ($propiedad, $tipo, $finLocal, $dias, $soloVer, &$nuevo) {
            $cuando = $dias === 0 ? 'vence hoy' : ($dias === 1 ? 'vence mañana' : "vence en {$dias} días");
            $titulo = ($tipo === 'normal' ? 'Publicación por vencer' : 'Posicionamiento por vencer') . ': ' . $cuando;
            $detalle = Notificacion::tituloPropiedad($propiedad) . ' · vence el ' . \Illuminate\Support\Carbon::parse($finLocal)->format('d/m/Y');
            $icono = $tipo === 'normal' ? 'fa-hourglass-half' : 'fa-arrow-up';
            $clave = 'plan-' . $tipo . '-' . $propiedad->id . '-' . $finLocal . '-d' . $dias;

            $rol = self::rolDuenio($propiedad);
            $filas = [];
            if ($rol) {
                $filas[] = Notificacion::fila((int) $propiedad->user_id, $clave, 'vencimiento', $titulo, $detalle,
                    self::urlDuenio($rol, $propiedad), $icono, 'aviso');
            }
            if (self::paraRol($propiedad->agente_id, 'agente')) {
                $filas[] = Notificacion::fila((int) $propiedad->agente_id, $clave, 'vencimiento', $titulo, $detalle,
                    '/agente/propiedades.html', $icono, 'aviso');
            }
            if (! $filas) {
                return;
            }
            if ($soloVer) {
                $nuevo = true;

                return;
            }
            $nuevo = \Illuminate\Support\Facades\DB::table('notificaciones')->insertOrIgnore($filas) > 0;
        });

        return $nuevo;
    }

    /** El plan ya venció (publicación normal o posicionamiento): avisa al dueño y al agente. */
    public static function planVencido(Propiedad $propiedad, string $tipo): void
    {
        self::seguro(function () use ($propiedad, $tipo) {
            $titulo = $tipo === 'normal' ? 'La publicación venció' : 'El posicionamiento terminó';
            $detalle = Notificacion::tituloPropiedad($propiedad);
            $clave = 'plan-fin-' . $tipo . '-' . $propiedad->id . '-' . now()->timestamp;
            $icono = $tipo === 'normal' ? 'fa-hourglass-end' : 'fa-arrow-down';

            $rol = self::rolDuenio($propiedad);
            if ($rol) {
                Notificacion::crear((int) $propiedad->user_id, $clave, 'plan', $titulo, $detalle,
                    self::urlDuenio($rol, $propiedad), $icono, 'aviso');
            }
            if (self::paraRol($propiedad->agente_id, 'agente')) {
                Notificacion::crear((int) $propiedad->agente_id, $clave, 'plan', $titulo, $detalle,
                    '/agente/propiedades.html', $icono, 'aviso');
            }
        });
    }

    /* ===================== Piezas internas ===================== */

    /** "vendedor" o "inmobiliaria" si el dueño de la propiedad es uno de los dos. */
    private static function rolDuenio(Propiedad $propiedad): ?string
    {
        foreach (['inmobiliaria', 'vendedor'] as $rol) {
            if (self::paraRol($propiedad->user_id, $rol)) {
                return $rol;
            }
        }

        return null;
    }

    private static function urlDuenio(string $rol, Propiedad $propiedad): string
    {
        if ($rol === 'inmobiliaria') {
            return '/inmobiliaria/propiedades.html';
        }

        return $propiedad->operacion === 'venta' ? '/vendedor/vender.html' : '/vendedor/arrendar.html';
    }

    private static function fecha(Visita $visita): string
    {
        return $visita->fecha->copy()->setTimezone(self::ZONA)->format('d/m h:i a');
    }

    private static function esQuienActua($userId): bool
    {
        return $userId && Auth::id() === (int) $userId;
    }

    private static function paraRol($userId, string $rol): bool
    {
        if (! $userId) {
            return false;
        }

        return User::whereKey($userId)->whereHas('role', fn ($q) => $q->where('nombre', $rol))->exists();
    }

    /** Avisar nunca debe romper la acción original. */
    private static function seguro(callable $accion): void
    {
        try {
            $accion();
        } catch (\Throwable $e) {
            // Se ignora a propósito (Notificacion::crear ya anota sus propios errores en el log)
        }
    }
}
