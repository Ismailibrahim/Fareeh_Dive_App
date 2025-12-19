<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ResetPasswordSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'admin@example.com')->first();
        
        if (!$user) {
            $this->command->warn('User admin@example.com not found. Creating new user...');
            
            // Ensure a dive center exists
            $diveCenter = \App\Models\DiveCenter::first();
            if (!$diveCenter) {
                $diveCenter = \App\Models\DiveCenter::create([
                    'name' => 'Default Dive Center',
                    'country' => 'Maldives',
                    'status' => 'Active'
                ]);
            }

            $user = User::create([
                'dive_center_id' => $diveCenter->id,
                'full_name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'Admin',
                'active' => true,
            ]);
            $this->command->info('User created with password: password');
        } else {
            $user->password = Hash::make('password');
            $user->save();
            $this->command->info('Password reset successful for: admin@example.com');
        }
    }
}
