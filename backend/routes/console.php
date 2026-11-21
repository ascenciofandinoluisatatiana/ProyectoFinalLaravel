<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cada hora: vuelve a borrador las publicaciones normales vencidas y quita el posicionamiento vencido
Schedule::command('propiedades:vencer-planes')->hourly()->withoutOverlapping();
