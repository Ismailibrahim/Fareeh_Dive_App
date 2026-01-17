<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Agency;

class AgencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Major dive certification agencies
        $agencies = [
            'PADI',
            'SSI',
            'NAUI',
            'CMAS',
            'BSAC',
            'SDI',
            'TDI',
            'IANTD',
            'GUE',
            'RAID',
            'ACUC',
            'IDEA',
            'PDIC',
            'MDEA',
            'WRSTC',
            'Other',
        ];

        $this->command->info('Seeding agencies...');

        $created = 0;
        $skipped = 0;

        foreach ($agencies as $agencyName) {
            $exists = Agency::where('name', $agencyName)->exists();

            if (!$exists) {
                Agency::create(['name' => $agencyName]);
                $created++;
            } else {
                $skipped++;
            }
        }

        $this->command->info("Agencies seeded successfully!");
        $this->command->info("Created: {$created} agencies");
        if ($skipped > 0) {
            $this->command->info("Skipped (already exist): {$skipped} agencies");
        }
    }
}

