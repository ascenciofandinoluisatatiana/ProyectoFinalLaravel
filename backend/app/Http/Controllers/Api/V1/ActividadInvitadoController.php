<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * POST /api/v1/public/actividad
 * Recibe lo que hace un visitante sin cuenta (invitado) para el historial del administrador.
 *
 *  huella       código anónimo que guarda el navegador (obligatorio)
 *  tipo         visita | ver_publicacion | favorito_agregado | favorito_quitado | contacto
 *  propiedad_id publicación (obligatorio salvo en "visita")
 *  idioma, zona_horaria  opcionales
 *  nombre, contacto      solo en "contacto" (los escribió la persona en el formulario)
 *
 * Reglas:
 *  - Una "visita" = una sesión: si pasan más de 30 min sin actividad y vuelve, cuenta otra.
 *  - Ver varias veces la misma publicación en una sesión cuenta una sola vez.
 *  - La IP se guarda enmascarada y los robots se ignoran.
 */
class ActividadInvitadoController extends Controller
{
    private const MINUTOS_SESION = 30;
    private const TIPOS = ['visita', 'ver_publicacion', 'favorito_agregado', 'favorito_quitado', 'contacto'];

    public function store(Request $r): JsonResponse
    {
        $d = $r->validate([
            'huella'       => ['required', 'string', 'between:16,64', 'regex:/^[A-Za-z0-9_-]+$/'],
            'tipo'         => ['required', 'in:' . implode(',', self::TIPOS)],
            'propiedad_id' => ['nullable', 'integer', 'min:1'],
            'idioma'       => ['nullable', 'string', 'max:10'],
            'zona_horaria' => ['nullable', 'string', 'max:60'],
            'nombre'       => ['nullable', 'string', 'max:120'],
            'contacto'     => ['nullable', 'string', 'max:150'],
        ]);

        $agente = (string) $r->userAgent();
        if ($agente === '' || preg_match('/bot|crawl|spider|slurp|headless|curl|wget|preview|monitor/i', $agente)) {
            return response()->json(['ok' => true, 'ignorado' => true]);
        }

        $tipo = $d['tipo'];
        if ($tipo !== 'visita' && empty($d['propiedad_id'])) {
            return response()->json(['message' => 'Falta la publicación.'], 422);
        }
        if ($tipo === 'contacto' && (empty($d['nombre']) || empty($d['contacto']))) {
            return response()->json(['message' => 'Faltan el nombre y el contacto.'], 422);
        }
        if (! empty($d['propiedad_id']) && ! DB::table('propiedades')->where('id', $d['propiedad_id'])->exists()) {
            return response()->json(['message' => 'La publicación no existe.'], 422);
        }

        $ahora = now();
        $datos = [
            'ip'           => $this->enmascarar((string) $r->ip()),
            'idioma'       => isset($d['idioma']) ? substr($d['idioma'], 0, 10) : null,
            'zona_horaria' => $d['zona_horaria'] ?? null,
            'dispositivo'  => mb_substr($agente, 0, 150),
        ];

        $invitado = DB::table('invitados')->where('huella', $d['huella'])->first();
        $inicioSesion = $ahora;

        if (! $invitado) {
            $id = DB::table('invitados')->insertGetId($datos + [
                'huella' => $d['huella'], 'visitas' => 1,
                'primera_visita' => $ahora, 'ultima_visita' => $ahora, 'ultima_actividad' => $ahora,
            ]);
            $this->evento($id, 'visita', null, $ahora);
        } else {
            $id = $invitado->id;
            $ultima = \Illuminate\Support\Carbon::parse($invitado->ultima_actividad);
            if ($ultima->lt($ahora->copy()->subMinutes(self::MINUTOS_SESION))) {
                DB::table('invitados')->where('id', $id)->update($datos + [
                    'visitas' => $invitado->visitas + 1, 'ultima_visita' => $ahora, 'ultima_actividad' => $ahora,
                ]);
                $this->evento($id, 'visita', null, $ahora);
            } else {
                $inicioSesion = \Illuminate\Support\Carbon::parse($invitado->ultima_visita);
                DB::table('invitados')->where('id', $id)->update($datos + ['ultima_actividad' => $ahora]);
            }
        }

        if ($tipo === 'ver_publicacion') {
            // Misma publicación dentro de la misma sesión: se cuenta una sola vez
            $ya = DB::table('invitado_eventos')
                ->where('invitado_id', $id)->where('tipo', 'ver_publicacion')
                ->where('propiedad_id', $d['propiedad_id'])->where('fecha', '>=', $inicioSesion)->exists();
            if (! $ya) {
                $this->evento($id, $tipo, $d['propiedad_id'], $ahora);
            }
        } elseif ($tipo === 'favorito_agregado' || $tipo === 'favorito_quitado') {
            $this->evento($id, $tipo, $d['propiedad_id'], $ahora);
        } elseif ($tipo === 'contacto') {
            $nombre = trim($d['nombre']);
            $contacto = trim($d['contacto']);
            DB::table('invitados')->where('id', $id)->update(['nombre' => $nombre, 'contacto' => $contacto]);
            $this->evento($id, $tipo, $d['propiedad_id'], $ahora, $nombre, $contacto);
        }

        return response()->json(['ok' => true]);
    }

    private function evento(int $invitadoId, string $tipo, ?int $propiedadId, $fecha, ?string $nombre = null, ?string $contacto = null): void
    {
        DB::table('invitado_eventos')->insert([
            'invitado_id' => $invitadoId, 'tipo' => $tipo, 'propiedad_id' => $propiedadId,
            'nombre' => $nombre, 'contacto' => $contacto, 'fecha' => $fecha,
        ]);
    }

    /** 190.25.33.7 → 190.25.x.x   |   2800:1:2:3:... → 2800:1:2:x */
    private function enmascarar(string $ip): ?string
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $p = explode('.', $ip);
            return $p[0] . '.' . $p[1] . '.x.x';
        }
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $p = explode(':', $ip);
            return implode(':', array_slice($p, 0, 3)) . ':x';
        }
        return null;
    }
}
