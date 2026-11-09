<?php

namespace App\Services\Paneles;

use App\Models\Comision;
use App\Models\Lead;
use App\Models\Membresia;
use App\Models\Pago;
use App\Models\PaqueteMembresia;
use App\Models\Propiedad;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Notificaciones de la campana de los paneles (inmobiliaria y agente).
 *
 * No se guarda cada aviso: se arman con lo que ya existe en la base (contactos, visitas,
 * pagos, membresías y comisiones de los últimos 30 días). Así funcionan sin importar desde
 * dónde llegó el dato (portal, panel, pago en línea). Solo se guarda hasta cuándo las vio
 * el usuario (notificaciones_lecturas) para contar las nuevas.
 */
class NotificacionService
{
    private const ZONA = 'America/Bogota';

    private const DIAS = 30;

    private const MAXIMO = 20;

    /** Máximo por tipo de aviso, para que muchos contactos no tapen los demás avisos. */
    private const POR_TIPO = 5;

    /* =================== Inmobiliaria =================== */

    public function deInmobiliaria(User $inmobiliaria): array
    {
        $desde = now()->subDays(self::DIAS);
        $ids = Propiedad::where('user_id', $inmobiliaria->id)->pluck('id');
        $avisos = collect();

        Lead::with('propiedad:id,tipo,barrio,ciudad')->whereIn('propiedad_id', $ids)->where('created_at', '>=', $desde)
            ->latest()->limit(self::POR_TIPO)->get()
            ->each(fn (Lead $l) => $avisos->push($this->aviso('contacto-' . $l->id, 'fa-comments', 'Nuevo contacto: ' . $l->nombre,
                $this->titulo($l->propiedad), $l->created_at, '/inmobiliaria/contactos.html')));

        $this->visitas(Visita::whereIn('propiedad_id', $ids), $desde, '/inmobiliaria/visitas.html', $avisos);

        Pago::where('user_id', $inmobiliaria->id)->where('concepto', 'membresia')
            ->whereIn('estado', ['aprobado', 'rechazado', 'error', 'anulado'])->where('updated_at', '>=', $desde)
            ->latest('updated_at')->limit(self::POR_TIPO)->get()
            ->each(function (Pago $p) use ($avisos) {
                $aprobado = $p->estado === 'aprobado';
                $avisos->push($this->aviso('pago-' . $p->id . '-' . $p->estado, $aprobado ? 'fa-circle-check' : 'fa-circle-xmark',
                    $aprobado ? 'Pago aprobado' : 'Pago ' . ($p->estado === 'rechazado' ? 'rechazado' : 'no completado'),
                    '$' . number_format($p->monto, 0, ',', '.') . ' · ' . $p->referencia, $p->updated_at, '/inmobiliaria/membresia.html',
                    $aprobado ? 'ok' : 'peligro'));
            });

        // Membresías de publicaciones (y de la cuenta) que vencen en los próximos 3 días
        $hoy = Carbon::now(self::ZONA)->startOfDay();
        $titulos = Propiedad::whereIn('id', $ids)->get(['id', 'tipo', 'barrio', 'ciudad'])->keyBy('id');
        Membresia::where('user_id', $inmobiliaria->id)->where('estado', 'activa')->whereNull('paquete_id')
            ->whereDate('fecha_fin', '>=', $hoy->toDateString())
            ->whereDate('fecha_fin', '<=', $hoy->copy()->addDays(3)->toDateString())
            ->get()
            ->each(fn (Membresia $m) => $avisos->push($this->aviso('vence-' . $m->id, 'fa-hourglass-half',
                'Membresía por vencer', ($m->propiedad_id ? $this->titulo($titulos[$m->propiedad_id] ?? null) : 'Toda la cuenta')
                . ' · vence el ' . $m->fecha_fin->format('d/m/Y'),
                Carbon::parse($m->fecha_fin->toDateString(), self::ZONA)->subDays(3)->utc(), '/inmobiliaria/membresia.html', 'aviso')));

        PaqueteMembresia::where('user_id', $inmobiliaria->id)
            ->whereDate('fecha_fin', '>=', $hoy->toDateString())
            ->whereDate('fecha_fin', '<=', $hoy->copy()->addDays(3)->toDateString())
            ->get()
            ->each(fn (PaqueteMembresia $pq) => $avisos->push($this->aviso('paquete-' . $pq->id, 'fa-layer-group',
                'Paquete por vencer', $pq->nombreVisible() . ' · vence el ' . $pq->fecha_fin->format('d/m/Y'),
                Carbon::parse($pq->fecha_fin->toDateString(), self::ZONA)->subDays(3)->utc(), '/inmobiliaria/membresia.html', 'aviso')));

        Comision::with('agente:id,name')->where('inmobiliaria_id', $inmobiliaria->id)->where('estado', '!=', 'anulada')
            ->where('created_at', '>=', $desde)->latest()->limit(self::POR_TIPO)->get()
            ->each(fn (Comision $c) => $avisos->push($this->aviso('cierre-' . $c->id, 'fa-handshake',
                ($c->operacion === 'venta' ? 'Venta cerrada: ' : 'Arriendo cerrado: ') . $c->inmueble,
                'Comisión de ' . ($c->agente?->name ?? 'agente') . ': $' . number_format($c->valor, 0, ',', '.'),
                $c->created_at, '/inmobiliaria/ventas.html', 'ok')));

        return $this->respuesta($inmobiliaria, $avisos);
    }

    /* =================== Agente =================== */

    public function deAgente(User $agente): array
    {
        $desde = now()->subDays(self::DIAS);
        $avisos = collect();

        Lead::with('propiedad:id,tipo,barrio,ciudad')->where('agente_id', $agente->id)->where('created_at', '>=', $desde)
            ->latest()->limit(self::POR_TIPO)->get()
            ->each(fn (Lead $l) => $avisos->push($this->aviso('contacto-' . $l->id, 'fa-comments', 'Contacto asignado: ' . $l->nombre,
                $this->titulo($l->propiedad), $l->created_at, '/agente/contactos.html')));

        Propiedad::where('agente_id', $agente->id)->where('user_id', $agente->inmobiliaria_id)
            ->where('updated_at', '>=', $desde)->latest('updated_at')->limit(self::POR_TIPO)->get()
            ->each(fn (Propiedad $p) => $avisos->push($this->aviso('propiedad-' . $p->id . '-' . $p->updated_at?->timestamp, 'fa-house',
                'Propiedad a tu cargo', $this->titulo($p) . ' · ' . ucfirst($p->estado), $p->updated_at, '/agente/propiedades.html')));

        $this->visitas(Visita::where('agente_id', $agente->id), $desde, '/agente/visitas.html', $avisos);

        Comision::where('agente_id', $agente->id)->where('inmobiliaria_id', $agente->inmobiliaria_id)
            ->where('estado', '!=', 'anulada')->where('created_at', '>=', $desde)->latest()->limit(self::POR_TIPO)->get()
            ->each(function (Comision $c) use ($avisos) {
                $valor = '$' . number_format($c->valor, 0, ',', '.');
                $avisos->push($this->aviso('comision-' . $c->id, 'fa-hand-holding-dollar', 'Ganaste una comisión de ' . $valor,
                    $c->inmueble, $c->created_at, '/agente/ventas.html', 'ok'));
                if ($c->estado === 'pagada' && $c->pagada_en) {
                    $avisos->push($this->aviso('pagada-' . $c->id, 'fa-sack-dollar', 'Te pagaron la comisión de ' . $valor,
                        $c->inmueble, $c->pagada_en, '/agente/ventas.html', 'ok'));
                }
            });

        return $this->respuesta($agente, $avisos);
    }

    /** Marca todas como leídas. */
    public function marcarLeidas(User $usuario): void
    {
        DB::table('notificaciones_lecturas')->updateOrInsert(['user_id' => $usuario->id], ['visto_en' => now()]);
    }

    /* =================== Piezas comunes =================== */

    /** Visitas confirmadas o canceladas hace poco, y las que son en las próximas 24 horas. */
    private function visitas($consulta, Carbon $desde, string $url, Collection $avisos): void
    {
        (clone $consulta)->with('propiedad:id,tipo,barrio,ciudad')->whereIn('estado', ['confirmada', 'cancelada'])
            ->where('updated_at', '>=', $desde)->latest('updated_at')->limit(self::POR_TIPO)->get()
            ->each(fn (Visita $v) => $avisos->push($this->aviso('visita-' . $v->id . '-' . $v->estado,
                $v->estado === 'confirmada' ? 'fa-calendar-check' : 'fa-calendar-xmark',
                'Visita ' . $v->estado . ': ' . $v->nombre,
                $this->titulo($v->propiedad) . ' · ' . $v->fecha->copy()->setTimezone(self::ZONA)->format('d/m h:i a'),
                $v->updated_at, $url, $v->estado === 'cancelada' ? 'peligro' : 'ok')));

        (clone $consulta)->with('propiedad:id,tipo,barrio,ciudad')->whereIn('estado', ['pendiente', 'confirmada'])
            ->where('fecha', '>=', now())->where('fecha', '<=', now()->addDay())->orderBy('fecha')->get()
            ->each(fn (Visita $v) => $avisos->push($this->aviso('proxima-' . $v->id, 'fa-clock',
                'Visita próxima: ' . $v->nombre,
                $this->titulo($v->propiedad) . ' · ' . $v->fecha->copy()->setTimezone(self::ZONA)->format('d/m h:i a'),
                // Aparece 24 horas antes de la visita (o cuando se creó, si fue después)
                $v->fecha->copy()->subDay()->max($v->created_at), $url, 'aviso')));
    }

    private function respuesta(User $usuario, Collection $avisos): array
    {
        $visto = DB::table('notificaciones_lecturas')->where('user_id', $usuario->id)->value('visto_en');
        // La primera vez cuentan como nuevas las de la última semana
        $vistoEn = $visto ? Carbon::parse($visto) : now()->subDays(7);

        $lista = $avisos->sortByDesc(fn ($a) => $a['fecha']->getTimestamp())->unique('id')->take(self::MAXIMO)->values()
            ->map(fn ($a) => array_merge($a, ['nueva' => $a['fecha']->gt($vistoEn), 'fecha' => $a['fecha']->toIso8601String()]));

        return [
            'data' => $lista->all(),
            'sin_leer' => $lista->where('nueva', true)->count(),
        ];
    }

    private function aviso(string $id, string $icono, string $titulo, string $detalle, $fecha, string $url, string $tono = 'normal'): array
    {
        return [
            'id' => $id,
            'icono' => $icono,
            'titulo' => $titulo,
            'detalle' => $detalle,
            'fecha' => Carbon::parse($fecha),
            'url' => $url,
            'tono' => $tono,
        ];
    }

    private function titulo(?Propiedad $p): string
    {
        return $p ? ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : 'Propiedad';
    }
}
