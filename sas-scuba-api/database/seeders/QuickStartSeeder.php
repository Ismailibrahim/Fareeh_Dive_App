<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DiveCenter;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class QuickStartSeeder extends Seeder
{
    public function run(): void
    {
        // Check if user already exists to avoid duplicates
        if (User::where('email', 'admin@example.com')->exists()) {
             $this->command->info('User admin@example.com already exists.');
             return;
        }

        DB::transaction(function () {
            $diveCenter = DiveCenter::create([
                'name' => 'SAS Scuba Dive Center',
                'country' => 'Maldives',
                'status' => 'Active',
            ]);

            User::create([
                'dive_center_id' => $diveCenter->id,
                'full_name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'Admin',
                'active' => true,
            ]);
        });
        
        $this->command->info('User created: admin@example.com / password');
    }
}
