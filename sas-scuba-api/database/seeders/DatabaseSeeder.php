<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed countries and nationalities first
        $this->call([
            CountrySeeder::class,
            NationalitySeeder::class,
        ]);

        // Seed units (measurement units)
        $this->call([
            UnitSeeder::class,
        ]);

        // Seed reference data (islands, relationships, agencies, service types, service providers)
        $this->call([
            IslandSeeder::class,
            RelationshipSeeder::class,
            AgencySeeder::class,
            ServiceTypeSeeder::class,
            ServiceProviderSeeder::class,
        ]);

        // Seed dive center specific data (locations, categories, payment methods)
        $this->call([
            LocationSeeder::class,
            CategorySeeder::class,
            PaymentMethodSeeder::class,
        ]);

        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
    }
}
