<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\DiveCenter;

class CategorySeeder extends Seeder
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

        // Common categories for dive centers
        $categories = [
            'Dive Packages',
            'Equipment Rental',
            'Training Courses',
            'Boat Dives',
            'Shore Dives',
            'Night Dives',
            'Specialty Dives',
            'Equipment Sales',
            'Accessories',
            'Maintenance Services',
            'Other',
        ];

        $totalCreated = 0;

        foreach ($diveCenters as $diveCenter) {
            $this->command->info("Seeding categories for: {$diveCenter->name}");

            foreach ($categories as $categoryName) {
                // Check if category already exists for this dive center
                $exists = Category::where('dive_center_id', $diveCenter->id)
                    ->where('name', $categoryName)
                    ->exists();

                if (!$exists) {
                    Category::create([
                        'dive_center_id' => $diveCenter->id,
                        'name' => $categoryName,
                    ]);
                    $totalCreated++;
                }
            }
        }

        $this->command->info("Categories seeded successfully! Created {$totalCreated} categories.");
    }
}

