<?php

namespace App\Services;

use App\Models\Category;
use App\Models\DiveCenter;
use App\Models\Location;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DiveCenterProvisioningService
{
    /**
     * Create a new dive center (tenant) and its first admin user.
     *
     * Expected $diveCenterInput: ['name' => string, 'country' => string]
     * Expected $adminUserInput: ['full_name' => string, 'email' => string, 'password' => string]
     */
    public function createDiveCenterWithAdmin(array $diveCenterInput, array $adminUserInput): User
    {
        $diveCenterName = trim((string) ($diveCenterInput['name'] ?? ''));
        $country = trim((string) ($diveCenterInput['country'] ?? ''));

        $adminFullName = trim((string) ($adminUserInput['full_name'] ?? ''));
        $adminEmail = trim((string) ($adminUserInput['email'] ?? ''));
        $adminPassword = (string) ($adminUserInput['password'] ?? '');

        return DB::transaction(function () use (
            $diveCenterName,
            $country,
            $adminFullName,
            $adminEmail,
            $adminPassword
        ) {
            $diveCenter = DiveCenter::create([
                'name' => $diveCenterName,
                'country' => $country,
                'status' => 'Active',
            ]);

            $adminUser = User::create([
                'dive_center_id' => $diveCenter->id,
                'full_name' => $adminFullName,
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'role' => 'Admin',
                'active' => true,
            ]);

            $this->provisionBaselineTenantData($diveCenter->id);

            return $adminUser;
        });
    }

    /**
     * Seed minimal baseline data for a newly created tenant.
     *
     * This mirrors the defaults in the seeders, but scopes them to one dive center
     * (so signup stays deterministic and doesn't touch other tenants).
     */
    private function provisionBaselineTenantData(int $diveCenterId): void
    {
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

        foreach ($locations as $locationData) {
            Location::firstOrCreate(
                ['dive_center_id' => $diveCenterId, 'name' => $locationData['name']],
                [
                    'description' => $locationData['description'],
                    'active' => $locationData['active'],
                ]
            );
        }

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

        foreach ($categories as $categoryName) {
            Category::firstOrCreate(
                ['dive_center_id' => $diveCenterId, 'name' => $categoryName]
            );
        }

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

        foreach ($paymentMethods as $methodData) {
            PaymentMethod::firstOrCreate(
                ['dive_center_id' => $diveCenterId, 'name' => $methodData['name']],
                [
                    'method_type' => $methodData['method_type'],
                    'is_active' => $methodData['is_active'],
                    'settings' => $methodData['settings'] ?? null,
                ]
            );
        }
    }
}

