<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DeepSeekChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** POST /api/v1/public/chatbot: asistente virtual para el perfil de invitado (usa DeepSeek desde el backend). */
class ChatbotController extends Controller
{
    /** Tope de preguntas por visitante (IP) al día, para cuidar el saldo de DeepSeek. */
    private const MAX_POR_DIA = 80;

    public function mensaje(Request $r): JsonResponse
    {
        $d = $r->validate([
            'mensajes'         => 'required|array|min:1|max:12',
            'mensajes.*.rol'   => 'required|in:user,assistant',
            'mensajes.*.texto' => 'required|string|max:600',
            'mensajes.*.buscar' => 'nullable|array',
            'idioma'           => 'nullable|in:es,en,pt,fr,ar,de,it,zh,ja,ko,ru,hi',
            // lo que hay HOY en el portal (lo manda la página con las propiedades que ya cargó)
            'ciudades'         => 'nullable|array|max:80',
            'ciudades.*'       => 'string|max:60',
            // inmueble que el visitante tiene abierto en el detalle (para "Preguntar a Umbra")
            'propiedad'              => 'nullable|array',
            'propiedad.tipo'         => 'nullable|string|max:30',
            'propiedad.operacion'    => 'nullable|in:venta,arriendo',
            'propiedad.ciudad'       => 'nullable|string|max:60',
            'propiedad.barrio'       => 'nullable|string|max:60',
            'propiedad.precio'       => 'nullable|numeric|min:0|max:100000000000',
            'propiedad.habitaciones' => 'nullable|numeric|min:0|max:99',
            'propiedad.banos'        => 'nullable|numeric|min:0|max:99',
            'propiedad.parqueaderos' => 'nullable|numeric|min:0|max:99',
            'propiedad.area'         => 'nullable|numeric|min:0|max:10000000',
            'propiedad.estrato'      => 'nullable|numeric|min:0|max:6',
            'propiedad.vendedor'     => 'nullable|string|max:60',
            'propiedad.verificada'   => 'nullable|boolean',
            'propiedad.descripcion'  => 'nullable|string|max:600',
        ]);

        $mensajes = array_values($d['mensajes']);
        if (end($mensajes)['rol'] !== 'user') {
            return response()->json(['ok' => false, 'mensaje' => 'El último mensaje debe ser del visitante.'], 422);
        }

        $llave = 'chatbot:' . $r->ip() . ':' . now()->format('Ymd');
        $usados = (int) Cache::get($llave, 0);
        if ($usados >= self::MAX_POR_DIA) {
            return response()->json(['ok' => false, 'limite' => true], 429);
        }
        Cache::put($llave, $usados + 1, now()->endOfDay());

        $res = DeepSeekChatService::responder($mensajes, $d['idioma'] ?? 'es', ['ciudades' => $d['ciudades'] ?? [], 'propiedad' => $d['propiedad'] ?? null]);

        if (! $res['disponible']) {
            return response()->json(['ok' => false, 'disponible' => false]);
        }

        return response()->json(['ok' => true, 'respuesta' => $res['respuesta'], 'buscar' => $res['buscar']]);
    }
}
