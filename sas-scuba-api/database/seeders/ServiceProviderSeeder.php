<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceProvider;

class ServiceProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Common equipment service providers
        $serviceProviders = [
            [
                'name' => 'Local Equipment Service',
                'address' => 'Malé, Maldives',
                'contact_no' => '+960 123-4567',
            ],
            [
                'name' => 'Dive Equipment Repair Center',
                'address' => 'Hulhumalé, Maldives',
                'contact_no' => '+960 234-5678',
            ],
            [
                'name' => 'Regulator Service Specialists',
                'address' => null,
                'contact_no' => '+960 345-6789',
            ],
            [
                'name' => 'BCD Repair Service',
                'address' => null,
                'contact_no' => null,
            ],
            [
                'name' => 'Tank Testing Facility',
                'address' => 'Malé Industrial Area',
                'contact_no' => '+960 456-7890',
            ],
            [
                'name' => 'Equipment Manufacturer Service',
                'address' => null,
                'contact_no' => null,
            ],
        ];

        $this->command->info('Seeding service providers...');

        $created = 0;
        $skipped = 0;

        foreach ($serviceProviders as $providerData) {
            $exists = ServiceProvider::where('name', $providerData['name'])->exists();

            if (!$exists) {
                ServiceProvider::create([
                    'name' => $providerData['name'],
                    'address' => $providerData['address'] ?? null,
                    'contact_no' => $providerData['contact_no'] ?? null,
                ]);
                $created++;
            } else {
                $skipped++;
            }
        }

        $this->command->info("Service providers seeded successfully!");
        $this->command->info("Created: {$created} service providers");
        if ($skipped > 0) {
            $this->command->info("Skipped (already exist): {$skipped} service providers");
        }
    }
}

