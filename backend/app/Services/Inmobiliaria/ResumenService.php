<?php

namespace App\Services\Inmobiliaria;

use App\Models\Lead;
use App\Models\Membresia;
use App\Models\Propiedad;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Support\Carbon;

/**
 * Cifras del dashboard de una inmobiliaria (RF-081).
 * Todo se limita a las propiedades de esa inmobiliaria y a sus agentes.
 */
class ResumenService
{
    /** Las fechas se guardan en UTC; los días de la gráfica se cuentan en hora de Colombia. */
    private const ZONA = 'America/Bogota';

    private const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    public function datos(User $inmobiliaria): array
    {
        $ahora = Carbon::now();
        $idsPropiedades = Propiedad::where('user_id', $inmobiliaria->id)->pluck('id');

        // ---------- Propiedades ----------
        $propiedades = Propiedad::where('user_id', $inmobiliaria->id);
        $totalPropiedades = (clone $propiedades)->count();
        $publicadas = (clone $propiedades)->where('estado', 'publicada')->count();
        $sinAgente = (clone $propiedades)->whereNull('agente_id')->count();
        $venta = (clone $propiedades)->where('operacion', 'venta')->count();
        $arriendo = (clone $propiedades)->where('operacion', 'arriendo')->count();

        // ---------- Agentes ----------
        $agentes = $inmobiliaria->agentes()->get(['id', 'name', 'email', 'estado', 'avatar']);
        $agentesActivos = $agentes->where('estado', 'activo')->count();

        // ---------- Contactos (leads) ----------
        $leads = Lead::whereIn('propiedad_id', $idsPropiedades);
        $totalLeads = (clone $leads)->count();
        $leadsNuevos = (clone $leads)->where('estado', 'nuevo')->count();
        $leadsSinAgente = (clone $leads)->whereNull('agente_id')->count();

        // ---------- Visitas ----------
        $visitas = Visita::whereIn('propiedad_id', $idsPropiedades);
        $visitasProximas = (clone $visitas)->where('fecha', '>=', $ahora)
            ->whereIn('estado', ['pendiente', 'confirmada'])->count();

        return [
            'kpis' => [
                'propiedades' => $totalPropiedades,
                'publicadas' => $publicadas,
                'sin_agente' => $sinAgente,
                'venta' => $venta,
                'arriendo' => $arriendo,
                'agentes' => $agentes->count(),
                'agentes_activos' => $agentesActivos,
                'leads' => $totalLeads,
                'leads_nuevos' => $leadsNuevos,
                'leads_sin_agente' => $leadsSinAgente,
                'visitas_proximas' => $visitasProximas,
            ],
            'membresia' => $this->membresia($inmobiliaria, $ahora),
            'destacadas' => $this->destacadas($idsPropiedades, $ahora),
            'contactos_7_dias' => $this->contactosUltimosDias($idsPropiedades, $ahora, 7),
            'agentes' => $this->rendimientoAgentes($agentes, $idsPropiedades, $ahora),
            'ultimos_contactos' => $this->ultimosContactos($idsPropiedades),
            'proximas_visitas' => $this->proximasVisitas($idsPropiedades, $ahora),
        ];
    }

    /** Membresía vigente (la que vence más tarde) o null. */
    private function membresia(User $inmobiliaria, Carbon $ahora): ?array
    {
        $hoy = $ahora->copy()->setTimezone(self::ZONA);
        $m = Membresia::where('user_id', $inmobiliaria->id)
            ->whereNull('propiedad_id')               // la de toda la cuenta (si existe)
            ->where('estado', 'activa')
            ->whereDate('fecha_fin', '>=', $hoy->toDateString())
            ->orderByDesc('fecha_fin')
            ->first();

        if (! $m) {
            return null;
        }

        return [
            'plan' => $m->plan,
            'nombre_plan' => Membresia::NOMBRES_PLAN[$m->plan] ?? $m->plan,
            'fecha_inicio' => $m->fecha_inicio->toDateString(),
            'fecha_fin' => $m->fecha_fin->toDateString(),
            'dias_restantes' => (int) Carbon::parse($hoy->toDateString())->diffInDays(Carbon::parse($m->fecha_fin->toDateString())),
        ];
    }

    /** Cuántas publicaciones tienen membresía vigente hoy y cuál vence primero. */
    private function destacadas($idsPropiedades, Carbon $ahora): array
    {
        $hoy = $ahora->copy()->setTimezone(self::ZONA)->toDateString();
        $vigentes = Membresia::whereIn('propiedad_id', $idsPropiedades)
            ->where('estado', 'activa')
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->whereDate('fecha_fin', '>=', $hoy)
            ->get(['propiedad_id', 'fecha_fin']);

        $finPorPropiedad = $vigentes->groupBy('propiedad_id')->map(fn ($g) => $g->max(fn ($m) => $m->fecha_fin->toDateString()));

        return [
            'total' => $finPorPropiedad->count(),
            'proximo_vencimiento' => $finPorPropiedad->min(),
        ];
    }

    /** Contactos recibidos por día (se agrupa en PHP para funcionar igual en PostgreSQL y SQLite). */
    private function contactosUltimosDias($idsPropiedades, Carbon $ahora, int $dias): array
    {
        $desde = $ahora->copy()->setTimezone(self::ZONA)->subDays($dias - 1)->startOfDay();

        $fechas = Lead::whereIn('propiedad_id', $idsPropiedades)
            ->where('created_at', '>=', $desde->copy()->utc())
            ->pluck('created_at')
            ->map(fn ($f) => Carbon::parse($f)->setTimezone(self::ZONA)->toDateString())
            ->countBy();

        $resultado = [];
        for ($i = 0; $i < $dias; $i++) {
            $dia = $desde->copy()->addDays($i);
            $resultado[] = [
                'fecha' => $dia->toDateString(),
                'etiqueta' => self::DIAS[$dia->dayOfWeek] . ' ' . $dia->day,
                'total' => $fechas->get($dia->toDateString(), 0),
            ];
        }

        return $resultado;
    }

    /** Por cada agente: propiedades asignadas, contactos y visitas próximas. */
    private function rendimientoAgentes($agentes, $idsPropiedades, Carbon $ahora): array
    {
        return $agentes->map(function ($agente) use ($idsPropiedades, $ahora) {
            return [
                'id' => $agente->id,
                'nombre' => $agente->name,
                'email' => $agente->email,
                'estado' => $agente->estado,
                'propiedades' => Propiedad::whereIn('id', $idsPropiedades)->where('agente_id', $agente->id)->count(),
                'contactos' => Lead::whereIn('propiedad_id', $idsPropiedades)->where('agente_id', $agente->id)->count(),
                'visitas' => Visita::whereIn('propiedad_id', $idsPropiedades)->where('agente_id', $agente->id)
                    ->where('fecha', '>=', $ahora)->whereIn('estado', ['pendiente', 'confirmada'])->count(),
            ];
        })->sortByDesc('contactos')->values()->all();
    }

    private function ultimosContactos($idsPropiedades): array
    {
        return Lead::with(['propiedad:id,tipo,barrio,ciudad', 'agente:id,name'])
            ->whereIn('propiedad_id', $idsPropiedades)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Lead $l) => [
                'id' => $l->id,
                'nombre' => $l->nombre,
                'contacto' => $l->contacto,
                'mensaje' => $l->mensaje,
                'estado' => $l->estado,
                'fecha' => $l->created_at?->toIso8601String(),
                'propiedad' => $this->tituloPropiedad($l->propiedad),
                'agente' => $l->agente?->name,
            ])->all();
    }

    private function proximasVisitas($idsPropiedades, Carbon $ahora): array
    {
        return Visita::with(['propiedad:id,tipo,barrio,ciudad', 'agente:id,name'])
            ->whereIn('propiedad_id', $idsPropiedades)
            ->where('fecha', '>=', $ahora)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->orderBy('fecha')
            ->limit(5)
            ->get()
            ->map(fn (Visita $v) => [
                'id' => $v->id,
                'nombre' => $v->nombre,
                'fecha' => $v->fecha->toIso8601String(),
                'estado' => $v->estado,
                'propiedad' => $this->tituloPropiedad($v->propiedad),
                'agente' => $v->agente?->name,
            ])->all();
    }

    private function tituloPropiedad(?Propiedad $p): string
    {
        return $p ? ucfirst($p->tipo) . ' en ' . $p->barrio . ', ' . $p->ciudad : 'Propiedad eliminada';
    }
}
