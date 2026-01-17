<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Common measurement units used in diving operations
        $units = [
                                
            // Other Common Units
            'Each',
            'Per Person',
            'Per Dive',
            'Per Day',
            'Per Week',
            'Per Month',
        ];

        $this->command->info('Seeding units...');

        $created = 0;
        $skipped = 0;

        foreach ($units as $unitName) {
            // Check if unit already exists
            $exists = Unit::where('name', $unitName)->exists();

            if (!$exists) {
                Unit::create([
                    'name' => $unitName,
                ]);
                $created++;
            } else {
                $skipped++;
            }
        }

        $this->command->info("Units seeded successfully!");
        $this->command->info("Created: {$created} units");
        if ($skipped > 0) {
            $this->command->info("Skipped (already exist): {$skipped} units");
        }
    }
}

