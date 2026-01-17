<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMethod;
use App\Models\DiveCenter;

class PaymentMethodSeeder extends Seeder
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

        // Common payment methods to seed for each dive center
        $paymentMethods = [
            [
                'method_type' => 'Cash',
                'name' => 'Cash (USD)',
                'is_active' => true,
                'settings' => [
                    'currency' => 'USD',
                    'description' => 'Petty cash box at reception',
                ],
            ],
            [
                'method_type' => 'Cash',
                'name' => 'Cash (MVR)',
                'is_active' => true,
                'settings' => [
                    'currency' => 'MVR',
                    'description' => 'Local currency cash payments',
                ],
            ],
            [
                'method_type' => 'Credit Card',
                'name' => 'POS Terminal #1',
                'is_active' => true,
                'settings' => [
                    'terminal_id' => 'POS-001',
                    'description' => 'Visa/Mastercard Terminal',
                    'fee_percentage' => 0,
                ],
            ],
            [
                'method_type' => 'Credit Card',
                'name' => 'POS Terminal #2',
                'is_active' => true,
                'settings' => [
                    'terminal_id' => 'POS-002',
                    'description' => 'Backup card terminal',
                    'fee_percentage' => 0,
                ],
            ],
            [
                'method_type' => 'Bank Transfer',
                'name' => 'BML Transfer',
                'is_active' => true,
                'settings' => [
                    'bank_name' => 'Bank of Maldives',
                    'account_number' => '****1234',
                    'description' => 'Bank of Maldives Account',
                ],
            ],
            [
                'method_type' => 'Bank Transfer',
                'name' => 'Wire Transfer',
                'is_active' => true,
                'settings' => [
                    'bank_name' => 'International Wire',
                    'description' => 'International bank transfer',
                ],
            ],
            [
                'method_type' => 'Wallet',
                'name' => 'Mobile Wallet',
                'is_active' => true,
                'settings' => [
                    'wallet_type' => 'Mobile',
                    'description' => 'Mobile payment wallet',
                ],
            ],
            [
                'method_type' => 'Crypto',
                'name' => 'Bitcoin',
                'is_active' => false,
                'settings' => [
                    'crypto_type' => 'BTC',
                    'description' => 'Bitcoin cryptocurrency payments',
                ],
            ],
        ];

        $totalCreated = 0;

        foreach ($diveCenters as $diveCenter) {
            $this->command->info("Seeding payment methods for: {$diveCenter->name}");

            foreach ($paymentMethods as $methodData) {
                // Check if payment method already exists for this dive center
                $exists = PaymentMethod::where('dive_center_id', $diveCenter->id)
                    ->where('name', $methodData['name'])
                    ->exists();

                if (!$exists) {
                    PaymentMethod::create([
                        'dive_center_id' => $diveCenter->id,
                        'method_type' => $methodData['method_type'],
                        'name' => $methodData['name'],
                        'is_active' => $methodData['is_active'],
                        'settings' => $methodData['settings'] ?? null,
                    ]);
                    $totalCreated++;
                }
            }
        }

        $this->command->info("Payment methods seeded successfully! Created {$totalCreated} payment methods.");
    }
}

