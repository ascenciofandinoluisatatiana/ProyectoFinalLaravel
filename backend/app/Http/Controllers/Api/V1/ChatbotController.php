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
            'idioma'           => 'nullable|in:es,en,pt,fr',
            // lo que hay HOY en el portal (lo manda la página con las propiedades que ya cargó)
            'ciudades'         => 'nullable|array|max:80',
            'ciudades.*'       => 'string|max:60',
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

        $res = DeepSeekChatService::responder($mensajes, $d['idioma'] ?? 'es', ['ciudades' => $d['ciudades'] ?? []]);

        if (! $res['disponible']) {
            return response()->json(['ok' => false, 'disponible' => false]);
        }

        return response()->json(['ok' => true, 'respuesta' => $res['respuesta'], 'buscar' => $res['buscar']]);
    }
}
