<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Propiedad extends Model
{
    protected $table = 'propiedades';

    protected $guarded = [];

    /**
     * Características y servicios que se pueden marcar (RF-043).
     * Se guardan las claves; el texto es el que se muestra.
     */
    public const CARACTERISTICAS = [
        'ascensor'        => 'Ascensor',
        'porteria'        => 'Portería / vigilancia 24 h',
        'piscina'         => 'Piscina',
        'gimnasio'        => 'Gimnasio',
        'zona_bbq'        => 'Zona BBQ',
        'salon_comunal'   => 'Salón comunal',
        'parque_infantil' => 'Parque infantil',
        'balcon'          => 'Balcón',
        'terraza'         => 'Terraza',
        'jardin'          => 'Jardín o patio',
        'chimenea'        => 'Chimenea',
        'deposito'        => 'Depósito',
        'amoblado'        => 'Amoblado',
        'mascotas'        => 'Acepta mascotas',
        'gas_natural'     => 'Gas natural',
        'internet'        => 'Internet / fibra óptica',
    ];

    /** Máximo de fotos adicionales (además de la principal). */
    public const MAX_FOTOS = 9;

    protected $casts = [
        'verificada'      => 'boolean',
        'precio'          => 'integer',
        'lat'             => 'float',
        'lng'             => 'float',
        'caracteristicas' => 'array',
    ];

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Agente de la inmobiliaria asignado a esta propiedad. */
    public function agente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agente_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visita::class);
    }

    /** Fotos adicionales, en el orden en que se subieron. */
    public function fotos(): HasMany
    {
        return $this->hasMany(PropiedadFoto::class)->orderBy('orden')->orderBy('id');
    }
}
