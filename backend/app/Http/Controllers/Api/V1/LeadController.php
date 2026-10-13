<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Propiedad;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function store(Request $r)
    {
        $d = $r->validate([
            'propiedad_id' => 'required|exists:propiedades,id',
            'nombre'       => 'required|string|max:120',
            'contacto'     => 'required|string|max:120',
            'mensaje'      => 'nullable|string|max:1000',
        ]);

        // Si la propiedad ya tiene agente (inmobiliaria), el contacto le llega directo a él
        $agenteId = Propiedad::whereKey($d['propiedad_id'])->value('agente_id');

        Lead::create($d + ['consentimiento' => true, 'agente_id' => $agenteId, 'estado' => 'nuevo']);

        return response()->json(['ok' => true], 201);
    }
}
