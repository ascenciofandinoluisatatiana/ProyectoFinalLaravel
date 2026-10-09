<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departamento extends Model
{
    protected $fillable = ['codigo_dane', 'nombre', 'activo'];

    public function municipios(): HasMany
    {
        return $this->hasMany(Municipio::class);
    }
}