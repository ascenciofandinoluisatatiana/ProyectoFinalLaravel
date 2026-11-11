<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * El panel vive en el frontend estático; Laravel solo responde su health check.
     */
    public function test_la_aplicacion_responde(): void
    {
        $this->get('/up')->assertOk();
    }
}
