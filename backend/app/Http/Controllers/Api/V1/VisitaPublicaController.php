<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ManejaVisitas;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Propiedad;
use App\Models\Visita;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * POST /api/v1/public/visitas: el visitante (sin cuenta) pide ver un inmueble en una fecha y hora.
 *
 * Se guarda como un contacto (lead) y una visita "pendiente" del inmueble, igual que si la hubiera
 * programado el equipo: así aparece sola en los paneles de la inmobiliaria o del agente
 * (Contactos, Visitas y la campana de avisos), que la confirman o la cambian de fecha.
 * La fecha llega en hora de Colombia ("2026-11-20T10:00") y se guarda en UTC.
 */
class VisitaPublicaController extends Controller
{
    use ManejaVisitas;

    /** Horario en que se pueden pedir visitas (hora de Colombia) y hasta cuántos días adelante. */
    private const HORA_DESDE = 7;
    private const HORA_HASTA = 19;
    private const DIAS_MAX = 60;

    public function store(Request $r): JsonResponse
    {
        $d = $r->validate([
            'propiedad_id' => ['required', 'integer'],
            'nombre'       => ['required', 'string', 'max:120'],
            'contacto'     => ['required', 'string', 'max:120'],
            'fecha'        => ['required', 'date_format:Y-m-d\TH:i', $this->reglaFutura(), $this->reglaHorario()],
            'nota'         => ['nullable', 'string', 'max:300'],
        ], [
            'nombre.required'   => 'Escribe tu nombre.',
            'contacto.required' => 'Escribe tu teléfono o correo.',
            'fecha.required'    => 'Elige el día y la hora.',
            'fecha.date_format' => 'La fecha no es válida.',
        ]);

        $propiedad = Propiedad::disponibleAlPublico()->find($d['propiedad_id']);
        if (! $propiedad) {
            return response()->json(['message' => 'Este inmueble ya no está disponible.'], 404);
        }

        $fecha = $this->aUtc($d['fecha']);
        $contacto = trim($d['contacto']);

        // Evita que la misma persona pida dos veces el mismo inmueble mientras la primera sigue vigente
        $repetida = Visita::where('propiedad_id', $propiedad->id)->where('contacto', $contacto)
            ->whereIn('estado', ['pendiente', 'confirmada'])->where('fecha', '>=', now())->exists();
        if ($repetida) {
            return response()->json(['message' => 'Ya pediste una visita a este inmueble. El vendedor te contactará para confirmarla.'], 422);
        }

        $cuando = $fecha->copy()->setTimezone(self::$zonaColombia)->locale('es')->isoFormat('dddd D [de] MMMM [a las] h:mm a');
        $nota = trim((string) ($d['nota'] ?? ''));

        DB::transaction(function () use ($propiedad, $d, $contacto, $fecha, $cuando, $nota) {
            $lead = Lead::create([
                'propiedad_id'   => $propiedad->id,
                'nombre'         => trim($d['nombre']),
                'contacto'       => $contacto,
                'mensaje'        => 'Solicita una visita: ' . $cuando . ($nota !== '' ? '. ' . $nota : '.'),
                'consentimiento' => true,
                'agente_id'      => $propiedad->agente_id,
                'estado'         => 'nuevo',
            ]);

            Visita::create([
                'propiedad_id' => $propiedad->id,
                'lead_id'      => $lead->id,
                'agente_id'    => $propiedad->agente_id,
                'nombre'       => $lead->nombre,
                'contacto'     => $contacto,
                'fecha'        => $fecha,
                'estado'       => 'pendiente',
                'nota'         => $nota !== '' ? $nota : null,
            ]);
        });

        return response()->json(['ok' => true, 'cuando' => $cuando], 201);
    }

    /** La visita debe caer entre las 7:00 y las 19:00 (hora de Colombia) y dentro de los próximos 60 días. */
    private function reglaHorario(): \Closure
    {
        return function (string $atributo, $valor, \Closure $falla) {
            try {
                $f = $this->aUtc((string) $valor)->setTimezone(self::$zonaColombia);
            } catch (\Throwable $e) {
                return;
            }
            if ($f->hour < self::HORA_DESDE || $f->hour > self::HORA_HASTA || ($f->hour === self::HORA_HASTA && $f->minute > 0)) {
                $falla('Elige una hora entre las 7:00 a. m. y las 7:00 p. m.');
            } elseif ($f->gt(now()->addDays(self::DIAS_MAX))) {
                $falla('Elige una fecha dentro de los próximos ' . self::DIAS_MAX . ' días.');
            }
        };
    }
}
