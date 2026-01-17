<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Island;

class IslandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Common Maldives islands (since this appears to be a Maldives-based dive center)
        $islands = [
            'Malé',
            'Hulhumalé',
            'Vilimalé',
            'Maafushi',
            'Rasdhoo',
            'Thoddoo',
            'Huraa',
            'Thulusdhoo',
            'Gulhi',
        ];

        $this->command->info('Seeding islands...');

        $created = 0;
        $skipped = 0;

        foreach ($islands as $islandName) {
            $exists = Island::where('name', $islandName)->exists();

            if (!$exists) {
                Island::create(['name' => $islandName]);
                $created++;
            } else {
                $skipped++;
            }
        }

        $this->command->info("Islands seeded successfully!");
        $this->command->info("Created: {$created} islands");
        if ($skipped > 0) {
            $this->command->info("Skipped (already exist): {$skipped} islands");
        }
    }
}

