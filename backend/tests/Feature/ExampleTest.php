<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * La página principal redirige al panel de administración.
     */
    public function test_the_application_redirects_to_the_admin_panel(): void
    {
        $response = $this->get('/');

        $response->assertRedirect(route('admin.panel'));
    }
}