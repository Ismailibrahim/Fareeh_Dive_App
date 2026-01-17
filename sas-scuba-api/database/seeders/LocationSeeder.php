<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;
use App\Models\DiveCenter;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all dive centers or create a default one
        $diveCenters = DiveCenter::all();
        
        if ($diveCenters->isEmpty()) {
            $this->command->warn('No dive centers found. Creating a default dive center...');
            $diveCenter = DiveCenter::create([
                'name' => 'SAS Scuba Dive Center',
                'country' => 'Maldives',
                'status' => 'Active',
            ]);
            $diveCenters = collect([$diveCenter]);
        }

        // Common locations for dive centers
        $locations = [
            [
                'name' => 'Main Office',
                'description' => 'Primary dive center location',
                'active' => true,
            ],
            [
                'name' => 'Reception',
                'description' => 'Front desk and customer service area',
                'active' => true,
            ],
            [
                'name' => 'Equipment Room',
                'description' => 'Equipment storage and maintenance area',
                'active' => true,
            ],
            [
                'name' => 'Boat Dock',
                'description' => 'Main boat departure point',
                'active' => true,
            ],
            [
                'name' => 'Workshop',
                'description' => 'Equipment repair and maintenance workshop',
                'active' => true,
            ],
        ];

        $totalCreated = 0;

        foreach ($diveCenters as $diveCenter) {
            $this->command->info("Seeding locations for: {$diveCenter->name}");

            foreach ($locations as $locationData) {
                // Check if location already exists for this dive center
                $exists = Location::where('dive_center_id', $diveCenter->id)
                    ->where('name', $locationData['name'])
                    ->exists();

                if (!$exists) {
                    Location::create([
                        'dive_center_id' => $diveCenter->id,
                        'name' => $locationData['name'],
                        'description' => $locationData['description'],
                        'active' => $locationData['active'],
                    ]);
                    $totalCreated++;
                }
            }
        }

        $this->command->info("Locations seeded successfully! Created {$totalCreated} locations.");
    }
}

