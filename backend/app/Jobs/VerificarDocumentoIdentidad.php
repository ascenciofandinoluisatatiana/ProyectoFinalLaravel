<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\Verificacion;
use App\Services\CorreoCuentaService;
use App\Services\DeepSeekDocumentoService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Trabajo de segundo plano: revisa con la IA el documento que subió una cuenta nueva y decide.
 *
 *   - puntaje de 90 o más → la cuenta se aprueba sola (queda activa)
 *   - de 70 a 89          → la cuenta queda PENDIENTE para el administrador (con el puntaje y la
 *                           observación de la IA); se avisa por correo a los administradores y a la persona
 *   - menos de 70         → la cuenta se rechaza sola, con el motivo de la IA
 *   - si la IA falla (sin saldo, caída, error) → se reintenta; si sigue fallando,
 *     la cuenta queda PENDIENTE para el administrador (nunca se rechaza por un fallo de la IA)
 *
 * La decisión queda en el historial del administrador (verificaciones, origen "ia")
 * y la persona recibe un correo.
 */
class VerificarDocumentoIdentidad implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    /** Puntaje mínimo (de 0 a 100) para aprobar sin que nadie revise (se puede cambiar con DEEPSEEK_PUNTAJE_APROBAR). */
    public const PUNTAJE_APROBAR = 90;

    /** Puntaje mínimo para quedar en revisión del administrador; menos que esto se rechaza (DEEPSEEK_PUNTAJE_REVISION). */
    public const PUNTAJE_REVISION = 70;

    public int $tries = 3;
    public int $timeout = 90;

    public function __construct(public int $userId)
    {
    }

    public function handle(): void
    {
        $usuario = User::with('role')->find($this->userId);

        // Si ya no existe o alguien ya lo decidió (el administrador), no se hace nada
        if (! $usuario || $usuario->estado !== 'pendiente') {
            return;
        }

        $documento = DB::table('documentos_identidad')->where('user_id', $usuario->id)->orderByDesc('id')->first();
        if (! $documento) {
            $this->dejarPendiente(null, 'No se encontró la foto del documento.');
            return;
        }

        // Ya quedó en revisión del administrador: no se vuelve a analizar ni a avisar
        if ($documento->ia_estado === 'revision') {
            return;
        }

        // 1) Leer la foto desde el Object Storage privado
        try {
            $contenido = Storage::disk('documentos')->get($documento->archivo_url);
        } catch (\Throwable $e) {
            Log::warning('IA documento: no se pudo leer la foto', ['user_id' => $usuario->id, 'error' => mb_substr($e->getMessage(), 0, 200)]);
            $this->reintentarOPendiente($documento->id, 'No se pudo leer la foto guardada.');
            return;
        }

        $info = @getimagesizefromstring($contenido);
        if ($info === false || ! in_array($info['mime'] ?? '', ['image/jpeg', 'image/png', 'image/webp'], true)) {
            $this->dejarPendiente($documento->id, 'El archivo guardado no es una imagen válida.');
            return;
        }

        // 2) Pedirle a la IA que la lea y la compare con lo que escribió la persona
        $esInmobiliaria = $usuario->role?->nombre === 'inmobiliaria';
        $resultado = DeepSeekDocumentoService::analizar($contenido, $info['mime'], [
            'tipo_cuenta'         => $esInmobiliaria ? 'inmobiliaria' : 'persona',
            'numero_documento'    => (string) $usuario->numero_documento,
            'nombre'              => (string) $usuario->name,
            'representante_legal' => (string) $usuario->representante_legal,
        ]);

        if (! $resultado['disponible']) {
            $this->reintentarOPendiente($documento->id, $resultado['motivo']);
            return;
        }

        // 3) Decidir
        $this->decidir($usuario, $documento->id, $resultado);
    }

    /** Si ya se agotaron los intentos, el trabajo falló por una causa inesperada: la cuenta queda pendiente. */
    public function failed(\Throwable $e): void
    {
        Log::error('IA documento: el trabajo falló', ['user_id' => $this->userId, 'error' => mb_substr($e->getMessage(), 0, 300)]);

        $documento = DB::table('documentos_identidad')->where('user_id', $this->userId)->orderByDesc('id')->first();
        if ($documento) {
            $this->dejarPendiente($documento->id, 'Error inesperado al revisar el documento.');
        }
    }

    private function decidir(User $usuario, int $documentoId, array $resultado): void
    {
        $puntaje = (int) $resultado['puntaje'];
        $umbralAprobar = (int) config('services.deepseek.puntaje_aprobar', self::PUNTAJE_APROBAR);
        $umbralRevision = min((int) config('services.deepseek.puntaje_revision', self::PUNTAJE_REVISION), $umbralAprobar);

        if ($puntaje >= $umbralAprobar) {
            $nivel = 'aprobar';
        } elseif ($puntaje >= $umbralRevision) {
            $nivel = 'revision';
        } else {
            $nivel = 'rechazar';
        }

        // En revisión la cuenta sigue pendiente y no se escribe en el historial (aún nadie decidió)
        if ($nivel === 'revision') {
            $this->enviarARevision($usuario, $documentoId, $resultado);
            return;
        }

        $aprueba = $nivel === 'aprobar';
        $decision = $aprueba ? 'aprobada' : 'rechazada';
        $estadoNuevo = $aprueba ? 'activo' : 'inactivo';

        $motivo = $aprueba
            ? 'Documento verificado por la IA (puntaje ' . $puntaje . ' de 100).'
            : $resultado['motivo'];

        $registro = DB::transaction(function () use ($usuario, $documentoId, $resultado, $decision, $estadoNuevo, $motivo, $aprueba) {
            // Bloquea la fila: si el administrador decide justo ahora, solo vale la primera decisión
            $cuenta = User::whereKey($usuario->id)->lockForUpdate()->first();
            if (! $cuenta || $cuenta->estado !== 'pendiente') {
                return null;
            }

            $cuenta->estado = $estadoNuevo;
            $cuenta->save();

            DB::table('documentos_identidad')->where('id', $documentoId)->update([
                'ia_estado'      => $aprueba ? 'aprobado' : 'rechazado',
                'ia_puntaje'     => $resultado['puntaje'],
                'ia_motivo'      => mb_substr($resultado['motivo'], 0, 500),
                'ia_detalle'     => json_encode($resultado['detalle'], JSON_UNESCAPED_UNICODE),
                'ia_revisado_en' => now(),
            ]);

            return Verificacion::create([
                'user_id'         => $cuenta->id,
                'cuenta_nombre'   => $cuenta->name,
                'cuenta_email'    => $cuenta->email,
                'cuenta_rol'      => $usuario->role?->nombre,
                'decidido_por'    => null,
                'decisor_nombre'  => 'IA de soporte',
                'origen'          => 'ia',
                'decision'        => $decision,
                'motivo'          => mb_substr($motivo, 0, 500),
                'estado_anterior' => 'pendiente',
                'estado_nuevo'    => $estadoNuevo,
                'documento_id'    => $documentoId,
                'puntaje_ia'      => $resultado['puntaje'],
            ]);
        });

        if (! $registro) {
            return;   // el administrador ya la había decidido
        }

        // Aviso por correo (si no sale, la decisión ya quedó guardada)
        $aprueba
            ? CorreoCuentaService::aprobada($usuario)
            : CorreoCuentaService::rechazadaPorIA($usuario, $motivo);
    }

    /** Puntaje intermedio: la cuenta sigue pendiente, se guarda lo que dijo la IA y se avisa a los administradores y a la persona. */
    private function enviarARevision(User $usuario, int $documentoId, array $resultado): void
    {
        $guardado = DB::transaction(function () use ($usuario, $documentoId, $resultado) {
            $cuenta = User::whereKey($usuario->id)->lockForUpdate()->first();
            if (! $cuenta || $cuenta->estado !== 'pendiente') {
                return false;   // el administrador ya la había decidido
            }

            DB::table('documentos_identidad')->where('id', $documentoId)->update([
                'ia_estado'      => 'revision',
                'ia_puntaje'     => $resultado['puntaje'],
                'ia_motivo'      => mb_substr($resultado['motivo'], 0, 500),
                'ia_detalle'     => json_encode($resultado['detalle'], JSON_UNESCAPED_UNICODE),
                'ia_revisado_en' => now(),
            ]);

            return true;
        });

        if (! $guardado) {
            return;
        }

        // Los avisos nunca rompen el trabajo: si un correo no sale, queda anotado en registro_correo
        try {
            CorreoCuentaService::pendienteParaAdmins($usuario, $usuario->role?->nombre, (int) $resultado['puntaje'], $resultado['motivo']);
            CorreoCuentaService::enRevision($usuario);
        } catch (\Throwable $e) {
            Log::warning('IA documento: no se pudieron enviar los avisos de revisión', ['user_id' => $usuario->id, 'error' => mb_substr($e->getMessage(), 0, 200)]);
        }
    }

    /** La IA falló: se vuelve a intentar más tarde; en el último intento queda pendiente para el administrador. */
    private function reintentarOPendiente(int $documentoId, string $motivo): void
    {
        if ($this->attempts() < $this->tries) {
            $this->release(60 * $this->attempts());   // 1 min, luego 2 min
            return;
        }

        $this->dejarPendiente($documentoId, $motivo);
    }

    /** La cuenta se queda pendiente y se anota por qué la IA no pudo decidir. */
    private function dejarPendiente(?int $documentoId, string $motivo): void
    {
        Log::warning('IA documento: la cuenta queda pendiente para el administrador', ['user_id' => $this->userId, 'motivo' => $motivo]);

        if ($documentoId) {
            DB::table('documentos_identidad')->where('id', $documentoId)->update([
                'ia_estado'      => 'no_disponible',
                'ia_motivo'      => mb_substr('La IA no estuvo disponible: ' . $motivo, 0, 500),
                'ia_revisado_en' => now(),
            ]);
        }
    }
}
