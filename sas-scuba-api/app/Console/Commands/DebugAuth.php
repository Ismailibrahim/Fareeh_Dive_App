<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class DebugAuth extends Command
{
    protected $signature = 'debug:auth';
    protected $description = 'Debug authentication issues';

    public function handle()
    {
        $this->info('Starting Auth Debug...');

        $email = 'admin@example.com';
        $password = 'password';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User {$email} NOT FOUND in database.");
            return;
        }

        $this->info("User found: ID {$user->id}");
        $this->info("Stored Password Hash: " . substr($user->password, 0, 10) . "...");

        // Check Hash
        if (Hash::check($password, $user->password)) {
            $this->info("Hash::check PASSED for '{$password}'");
        } else {
            $this->error("Hash::check FAILED for '{$password}'");
        }

        // Check Auth::attempt
        if (Auth::attempt(['email' => $email, 'password' => $password])) {
             $this->info("Auth::attempt SUCCEEDED");
        } else {
             $this->error("Auth::attempt FAILED");
             // Check if active column exists?
        }
    }
}
