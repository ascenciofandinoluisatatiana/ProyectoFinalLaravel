<?php

namespace App\Http\Controllers\Api\V1\Agente;

use App\Http\Controllers\Api\V1\Inmobiliaria\MovimientoController as MovimientoInmobiliaria;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Movimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Historial de un contacto del agente: qué se le hizo y quién (sin IP ni dispositivo). */
class ContactoMovimientoController extends Controller
{
    /** GET /api/v1/agente/contactos/{id}/movimientos */
    public function index(Request $request, MovimientoInmobiliaria $ayuda, $id): JsonResponse
    {
        $yo = $request->user();

        // Solo un contacto suyo (si no lo es, 404)
        $lead = Lead::where('agente_id', $yo->id)
            ->whereHas('propiedad', fn ($q) => $q->where('user_id', $yo->inmobiliaria_id))
            ->findOrFail($id);

        $f = $ayuda->filtros($request);
        $base = Movimiento::where('inmobiliaria_id', $yo->inmobiliaria_id)->where('entidad', 'contacto')->where('entidad_id', $lead->id);

        return response()->json($ayuda->responder($ayuda->aplicar($base, $f), $f));
    }
}
