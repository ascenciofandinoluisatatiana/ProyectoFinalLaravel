<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
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

        Lead::create($d + ['consentimiento' => true]);

        return response()->json(['ok' => true], 201);
    }
}
