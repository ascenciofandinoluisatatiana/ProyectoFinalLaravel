<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role_id', 'telefono', 'tipo_documento', 'numero_documento', 'estado', 'avatar'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /** Estados posibles de una cuenta dentro del panel de administración. */
    public const ESTADOS = ['activo', 'inactivo', 'pendiente'];

    /** Roles que aparecen en el formulario del panel (soporte e invitado son internos del sistema). */
    public const ROLES_PANEL = ['administrador', 'vendedor', 'inmobiliaria', 'agente'];

    /** Rol del usuario (administrador, vendedor, inmobiliaria, agente, soporte). */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** Membresías contratadas por este vendedor o inmobiliaria. */
    public function membresias(): HasMany
    {
        return $this->hasMany(Membresia::class);
    }

    /** ¿Tiene alguno de estos roles? Ej: $user->tieneRol('administrador', 'soporte') */
    public function tieneRol(string ...$roles): bool
    {
        return in_array($this->role?->nombre, $roles, true);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}