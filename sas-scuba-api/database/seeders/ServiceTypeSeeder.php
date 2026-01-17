<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceType;

class ServiceTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Common equipment service types
        $serviceTypes = [
            'Annual Service',
            'Visual Inspection',
            'Hydrostatic Test',
            'Regulator Service',
            'BCD Service',
            'Wetsuit Repair',
            'Mask Replacement',
            'Fin Repair',
            'Tank Inspection',
            'Valve Service',
            'O-Ring Replacement',
            'Cleaning',
            'Calibration',
            'Maintenance',
            'Repair',
            'Replacement',
            'Other',
        ];

        $this->command->info('Seeding service types...');

        $created = 0;
        $skipped = 0;

        foreach ($serviceTypes as $serviceTypeName) {
            $exists = ServiceType::where('name', $serviceTypeName)->exists();

            if (!$exists) {
                ServiceType::create(['name' => $serviceTypeName]);
                $created++;
            } else {
                $skipped++;
            }
        }

        $this->command->info("Service types seeded successfully!");
        $this->command->info("Created: {$created} service types");
        if ($skipped > 0) {
            $this->command->info("Skipped (already exist): {$skipped} service types");
        }
    }
}

