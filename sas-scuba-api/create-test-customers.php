<?php

/**
 * Script to create 10 test customers with all related data
 * 
 * Usage:
 *   php artisan tinker < create-test-customers.php
 *   OR
 *   php create-test-customers.php (if run from sas-scuba-api directory)
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\DiveCenter;
use App\Models\EmergencyContact;
use App\Models\CustomerInsurance;
use App\Models\CustomerAccommodation;
use Illuminate\Support\Facades\DB;

// Sample data for customers
$customersData = [
    [
        'full_name' => 'Sarah Johnson',
        'email' => 'sarah.johnson@example.com',
        'phone' => '+1-555-0101',
        'address' => '123 Ocean Drive',
        'city' => 'Miami',
        'zip_code' => '33139',
        'country' => 'United States',
        'passport_no' => 'US123456789',
        'date_of_birth' => '1990-05-15',
        'gender' => 'Female',
        'nationality' => 'American',
        'departure_date' => '2025-12-30',
        'departure_flight' => 'EK123',
        'departure_to' => 'New York',
        'emergency_contact' => [
            'name' => 'John Johnson',
            'email' => 'john.johnson@example.com',
            'phone_1' => '+1-555-0102',
            'relationship' => 'Spouse',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN',
            'insurance_no' => 'DAN-2025-001',
            'insurance_hotline_no' => '+1-800-446-2671',
            'expiry_date' => '2026-05-15',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Paradise Resort',
            'address' => 'Malé Atoll',
            'contact_no' => '+960-123-4567',
            'island' => 'Malé',
            'room_no' => '101',
        ],
    ],
    [
        'full_name' => 'Michael Chen',
        'email' => 'michael.chen@example.com',
        'phone' => '+86-138-0013-8000',
        'address' => '456 Beijing Road',
        'city' => 'Shanghai',
        'zip_code' => '200000',
        'country' => 'China',
        'passport_no' => 'CN987654321',
        'date_of_birth' => '1985-08-22',
        'gender' => 'Male',
        'nationality' => 'Chinese',
        'departure_date' => '2025-12-28',
        'departure_flight' => 'MU501',
        'departure_to' => 'Shanghai',
        'emergency_contact' => [
            'name' => 'Li Chen',
            'email' => 'li.chen@example.com',
            'phone_1' => '+86-139-0013-8001',
            'relationship' => 'Sibling',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DiveAssure',
            'insurance_no' => 'DA-2025-002',
            'insurance_hotline_no' => '+86-400-123-4567',
            'expiry_date' => '2026-08-22',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Sunset Beach Hotel',
            'address' => 'Ari Atoll',
            'contact_no' => '+960-234-5678',
            'island' => 'Ari',
            'room_no' => '205',
        ],
    ],
    [
        'full_name' => 'Emma Williams',
        'email' => 'emma.williams@example.com',
        'phone' => '+44-20-7946-0958',
        'address' => '789 High Street',
        'city' => 'London',
        'zip_code' => 'SW1A 1AA',
        'country' => 'United Kingdom',
        'passport_no' => 'GB456789123',
        'date_of_birth' => '1992-03-10',
        'gender' => 'Female',
        'nationality' => 'British',
        'departure_date' => '2026-01-05',
        'departure_flight' => 'BA123',
        'departure_to' => 'London',
        'emergency_contact' => [
            'name' => 'James Williams',
            'email' => 'james.williams@example.com',
            'phone_1' => '+44-20-7946-0959',
            'relationship' => 'Partner',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN Europe',
            'insurance_no' => 'DAN-EU-2025-003',
            'insurance_hotline_no' => '+39-06-4211-8685',
            'expiry_date' => '2026-03-10',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Coral Reef Resort',
            'address' => 'Baa Atoll',
            'contact_no' => '+960-345-6789',
            'island' => 'Baa',
            'room_no' => '312',
        ],
    ],
    [
        'full_name' => 'David Rodriguez',
        'email' => 'david.rodriguez@example.com',
        'phone' => '+34-91-123-4567',
        'address' => '321 Calle Mayor',
        'city' => 'Madrid',
        'zip_code' => '28012',
        'country' => 'Spain',
        'passport_no' => 'ES789123456',
        'date_of_birth' => '1988-11-25',
        'gender' => 'Male',
        'nationality' => 'Spanish',
        'departure_date' => '2025-12-29',
        'departure_flight' => 'IB1234',
        'departure_to' => 'Madrid',
        'emergency_contact' => [
            'name' => 'Maria Rodriguez',
            'email' => 'maria.rodriguez@example.com',
            'phone_1' => '+34-91-123-4568',
            'relationship' => 'Spouse',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN Europe',
            'insurance_no' => 'DAN-EU-2025-004',
            'insurance_hotline_no' => '+39-06-4211-8685',
            'expiry_date' => '2026-11-25',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Blue Lagoon Resort',
            'address' => 'Lhaviyani Atoll',
            'contact_no' => '+960-456-7890',
            'island' => 'Lhaviyani',
            'room_no' => '418',
        ],
    ],
    [
        'full_name' => 'Sophie Martin',
        'email' => 'sophie.martin@example.com',
        'phone' => '+33-1-42-86-83-26',
        'address' => '654 Rue de Rivoli',
        'city' => 'Paris',
        'zip_code' => '75001',
        'country' => 'France',
        'passport_no' => 'FR321654987',
        'date_of_birth' => '1995-07-08',
        'gender' => 'Female',
        'nationality' => 'French',
        'departure_date' => '2026-01-02',
        'departure_flight' => 'AF456',
        'departure_to' => 'Paris',
        'emergency_contact' => [
            'name' => 'Pierre Martin',
            'email' => 'pierre.martin@example.com',
            'phone_1' => '+33-1-42-86-83-27',
            'relationship' => 'Brother',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN Europe',
            'insurance_no' => 'DAN-EU-2025-005',
            'insurance_hotline_no' => '+39-06-4211-8685',
            'expiry_date' => '2026-07-08',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Tropical Paradise Resort',
            'address' => 'Noonu Atoll',
            'contact_no' => '+960-567-8901',
            'island' => 'Noonu',
            'room_no' => '525',
        ],
    ],
    [
        'full_name' => 'Thomas Anderson',
        'email' => 'thomas.anderson@example.com',
        'phone' => '+1-555-0201',
        'address' => '987 Sunset Boulevard',
        'city' => 'Los Angeles',
        'zip_code' => '90028',
        'country' => 'United States',
        'passport_no' => 'US987654321',
        'date_of_birth' => '1987-12-03',
        'gender' => 'Male',
        'nationality' => 'American',
        'departure_date' => '2025-12-31',
        'departure_flight' => 'AA789',
        'departure_to' => 'Los Angeles',
        'emergency_contact' => [
            'name' => 'Linda Anderson',
            'email' => 'linda.anderson@example.com',
            'phone_1' => '+1-555-0202',
            'relationship' => 'Mother',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN',
            'insurance_no' => 'DAN-2025-006',
            'insurance_hotline_no' => '+1-800-446-2671',
            'expiry_date' => '2026-12-03',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Ocean View Resort',
            'address' => 'Raa Atoll',
            'contact_no' => '+960-678-9012',
            'island' => 'Raa',
            'room_no' => '630',
        ],
    ],
    [
        'full_name' => 'Lisa Tanaka',
        'email' => 'lisa.tanaka@example.com',
        'phone' => '+81-3-1234-5678',
        'address' => '159 Ginza Street',
        'city' => 'Tokyo',
        'zip_code' => '104-0061',
        'country' => 'Japan',
        'passport_no' => 'JP147258369',
        'date_of_birth' => '1993-04-18',
        'gender' => 'Female',
        'nationality' => 'Japanese',
        'departure_date' => '2026-01-03',
        'departure_flight' => 'JL456',
        'departure_to' => 'Tokyo',
        'emergency_contact' => [
            'name' => 'Hiroshi Tanaka',
            'email' => 'hiroshi.tanaka@example.com',
            'phone_1' => '+81-3-1234-5679',
            'relationship' => 'Father',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN Asia-Pacific',
            'insurance_no' => 'DAN-AP-2025-007',
            'insurance_hotline_no' => '+81-3-1234-5670',
            'expiry_date' => '2026-04-18',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Seaside Villa',
            'address' => 'Vaavu Atoll',
            'contact_no' => '+960-789-0123',
            'island' => 'Vaavu',
            'room_no' => '741',
        ],
    ],
    [
        'full_name' => 'Robert Brown',
        'email' => 'robert.brown@example.com',
        'phone' => '+61-2-9876-5432',
        'address' => '753 Bondi Beach Road',
        'city' => 'Sydney',
        'zip_code' => '2026',
        'country' => 'Australia',
        'passport_no' => 'AU258369147',
        'date_of_birth' => '1989-09-14',
        'gender' => 'Male',
        'nationality' => 'Australian',
        'departure_date' => '2026-01-04',
        'departure_flight' => 'QF123',
        'departure_to' => 'Sydney',
        'emergency_contact' => [
            'name' => 'Jennifer Brown',
            'email' => 'jennifer.brown@example.com',
            'phone_1' => '+61-2-9876-5433',
            'relationship' => 'Wife',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN Asia-Pacific',
            'insurance_no' => 'DAN-AP-2025-008',
            'insurance_hotline_no' => '+61-2-9876-5434',
            'expiry_date' => '2026-09-14',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Island Paradise Resort',
            'address' => 'Meemu Atoll',
            'contact_no' => '+960-890-1234',
            'island' => 'Meemu',
            'room_no' => '852',
        ],
    ],
    [
        'full_name' => 'Anna Schmidt',
        'email' => 'anna.schmidt@example.com',
        'phone' => '+49-30-12345678',
        'address' => '456 Unter den Linden',
        'city' => 'Berlin',
        'zip_code' => '10117',
        'country' => 'Germany',
        'passport_no' => 'DE369147258',
        'date_of_birth' => '1991-06-20',
        'gender' => 'Female',
        'nationality' => 'German',
        'departure_date' => '2026-01-01',
        'departure_flight' => 'LH789',
        'departure_to' => 'Berlin',
        'emergency_contact' => [
            'name' => 'Klaus Schmidt',
            'email' => 'klaus.schmidt@example.com',
            'phone_1' => '+49-30-12345679',
            'relationship' => 'Husband',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN Europe',
            'insurance_no' => 'DAN-EU-2025-009',
            'insurance_hotline_no' => '+39-06-4211-8685',
            'expiry_date' => '2026-06-20',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Crystal Clear Resort',
            'address' => 'Faafu Atoll',
            'contact_no' => '+960-901-2345',
            'island' => 'Faafu',
            'room_no' => '963',
        ],
    ],
    [
        'full_name' => 'Marco Rossi',
        'email' => 'marco.rossi@example.com',
        'phone' => '+39-06-12345678',
        'address' => '789 Via del Corso',
        'city' => 'Rome',
        'zip_code' => '00186',
        'country' => 'Italy',
        'passport_no' => 'IT741852963',
        'date_of_birth' => '1986-10-30',
        'gender' => 'Male',
        'nationality' => 'Italian',
        'departure_date' => '2025-12-27',
        'departure_flight' => 'AZ234',
        'departure_to' => 'Rome',
        'emergency_contact' => [
            'name' => 'Giulia Rossi',
            'email' => 'giulia.rossi@example.com',
            'phone_1' => '+39-06-12345679',
            'relationship' => 'Sister',
            'is_primary' => true,
        ],
        'insurance' => [
            'insurance_provider' => 'DAN Europe',
            'insurance_no' => 'DAN-EU-2025-010',
            'insurance_hotline_no' => '+39-06-4211-8685',
            'expiry_date' => '2026-10-30',
            'status' => true,
        ],
        'accommodation' => [
            'name' => 'Aqua Blue Resort',
            'address' => 'Dhaalu Atoll',
            'contact_no' => '+960-012-3456',
            'island' => 'Dhaalu',
            'room_no' => '1074',
        ],
    ],
];

try {
    DB::beginTransaction();

    // Get or create a dive center
    $diveCenter = DiveCenter::first();
    if (!$diveCenter) {
        $diveCenter = DiveCenter::create([
            'name' => 'SAS Scuba Dive Center',
            'country' => 'Maldives',
            'status' => 'Active',
        ]);
        echo "Created dive center: {$diveCenter->name} (ID: {$diveCenter->id})\n";
    } else {
        echo "Using existing dive center: {$diveCenter->name} (ID: {$diveCenter->id})\n";
    }

    $createdCount = 0;

    foreach ($customersData as $index => $data) {
        // Extract related data
        $emergencyContactData = $data['emergency_contact'] ?? null;
        $insuranceData = $data['insurance'] ?? null;
        $accommodationData = $data['accommodation'] ?? null;

        // Remove related data from customer data
        unset($data['emergency_contact'], $data['insurance'], $data['accommodation']);

        // Add dive center ID
        $data['dive_center_id'] = $diveCenter->id;

        // Create customer
        $customer = Customer::create($data);
        $createdCount++;

        echo "\n[{$createdCount}/10] Created customer: {$customer->full_name} (ID: {$customer->id})\n";

        // Create emergency contact
        if ($emergencyContactData) {
            $emergencyContactData['customer_id'] = $customer->id;
            $emergencyContact = EmergencyContact::create($emergencyContactData);
            echo "  ✓ Emergency contact: {$emergencyContact->name} ({$emergencyContact->relationship})\n";
        }

        // Create insurance
        if ($insuranceData) {
            $insuranceData['customer_id'] = $customer->id;
            $insurance = CustomerInsurance::create($insuranceData);
            echo "  ✓ Insurance: {$insurance->insurance_provider} ({$insurance->insurance_no})\n";
        }

        // Create accommodation
        if ($accommodationData) {
            $accommodationData['customer_id'] = $customer->id;
            $accommodation = CustomerAccommodation::create($accommodationData);
            echo "  ✓ Accommodation: {$accommodation->name} (Room {$accommodation->room_no})\n";
        }
    }

    DB::commit();

    echo "\n" . str_repeat('=', 60) . "\n";
    echo "SUCCESS: Created {$createdCount} customers with all related data!\n";
    echo str_repeat('=', 60) . "\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "\nERROR: Failed to create customers\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}

