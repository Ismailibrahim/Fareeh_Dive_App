<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterCreatesDiveCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_dive_center_and_admin_user(): void
    {
        $payload = [
            'name' => 'Owner Admin',
            'dive_center_name' => 'New Dive Center Co',
            'country' => 'Maldives',
            'email' => 'owner@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/v1/register', $payload);

        $response
            ->assertStatus(201)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'dive_center_id',
                    'full_name',
                    'email',
                    'phone',
                    'role',
                    'active',
                    'created_at',
                    'updated_at',
                ],
            ]);

        $diveCenterId = $response->json('user.dive_center_id');
        $this->assertNotNull($diveCenterId);

        $this->assertDatabaseHas('dive_centers', [
            'id' => $diveCenterId,
            'name' => 'New Dive Center Co',
            'country' => 'Maldives',
            'status' => 'Active',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'owner@example.com',
            'dive_center_id' => $diveCenterId,
            'role' => 'Admin',
            'active' => 1,
        ]);

        // Baseline tenant data should be provisioned
        $this->assertDatabaseHas('locations', [
            'dive_center_id' => $diveCenterId,
            'name' => 'Main Office',
        ]);
    }
}

