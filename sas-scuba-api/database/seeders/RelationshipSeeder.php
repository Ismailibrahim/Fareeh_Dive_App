<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Relationship;

class RelationshipSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Common relationships for emergency contacts
        $relationships = [
            'Spouse',
            'Partner',
            'Parent',
            'Mother',
            'Father',
            'Child',
            'Son',
            'Daughter',
            'Brother',
            'Sister',
            'Grandparent',
            'Grandmother',
            'Grandfather',
            'Grandchild',
            'Aunt',
            'Uncle',
            'Cousin',
            'Friend',
            'Colleague',
            'Other',
        ];

        $this->command->info('Seeding relationships...');

        $created = 0;
        $skipped = 0;

        foreach ($relationships as $relationshipName) {
            $exists = Relationship::where('name', $relationshipName)->exists();

            if (!$exists) {
                Relationship::create(['name' => $relationshipName]);
                $created++;
            } else {
                $skipped++;
            }
        }

        $this->command->info("Relationships seeded successfully!");
        $this->command->info("Created: {$created} relationships");
        if ($skipped > 0) {
            $this->command->info("Skipped (already exist): {$skipped} relationships");
        }
    }
}

