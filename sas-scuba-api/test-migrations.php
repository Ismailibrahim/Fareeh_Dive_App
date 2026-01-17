<?php

/**
 * Migration Test Script
 * 
 * This script helps verify that migrations can run successfully.
 * Run this before deploying to production.
 * 
 * Usage:
 *   php test-migrations.php
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Migration Test Script ===\n\n";

// Test 1: Check if migrations table exists
echo "1. Checking migrations table...\n";
try {
    if (Schema::hasTable('migrations')) {
        echo "   ✓ Migrations table exists\n";
    } else {
        echo "   ⚠ Migrations table does not exist (this is normal for fresh installs)\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error checking migrations table: " . $e->getMessage() . "\n";
}

// Test 2: Check database connection
echo "\n2. Testing database connection...\n";
try {
    DB::connection()->getPdo();
    $driver = DB::getDriverName();
    echo "   ✓ Database connected successfully\n";
    echo "   ✓ Database driver: {$driver}\n";
} catch (\Exception $e) {
    echo "   ✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 3: Check critical tables exist
echo "\n3. Checking critical tables...\n";
$criticalTables = [
    'dive_centers',
    'users',
    'customers',
    'bookings',
    'invoices',
    'equipment_items',
    'price_lists',
    'price_list_items',
];

$missingTables = [];
foreach ($criticalTables as $table) {
    try {
        if (Schema::hasTable($table)) {
            echo "   ✓ Table '{$table}' exists\n";
        } else {
            echo "   ⚠ Table '{$table}' does not exist\n";
            $missingTables[] = $table;
        }
    } catch (\Exception $e) {
        echo "   ✗ Error checking table '{$table}': " . $e->getMessage() . "\n";
    }
}

// Test 4: Check for common foreign key issues
echo "\n4. Checking foreign key constraints...\n";
$foreignKeyChecks = [
    ['table' => 'invoices', 'column' => 'booking_id'],
    ['table' => 'invoices', 'column' => 'customer_id'],
    ['table' => 'invoices', 'column' => 'agent_id'],
    ['table' => 'bookings', 'column' => 'customer_id'],
    ['table' => 'bookings', 'column' => 'agent_id'],
    ['table' => 'bookings', 'column' => 'dive_group_id'],
    ['table' => 'equipment_items', 'column' => 'location_id'],
    ['table' => 'price_list_items', 'column' => 'equipment_item_id'],
];

$driver = DB::getDriverName();
foreach ($foreignKeyChecks as $check) {
    $table = $check['table'];
    $column = $check['column'];
    
    if (!Schema::hasTable($table)) {
        continue;
    }
    
    if (!Schema::hasColumn($table, $column)) {
        continue;
    }
    
    try {
        if ($driver === 'mysql' || $driver === 'mariadb') {
            $result = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND COLUMN_NAME = ? 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ", [$table, $column]);
            
            if (!empty($result)) {
                echo "   ✓ Foreign key exists: {$table}.{$column}\n";
            } else {
                echo "   ⚠ Foreign key missing: {$table}.{$column}\n";
            }
        } else {
            echo "   ⚠ Foreign key check skipped (not MySQL/MariaDB)\n";
        }
    } catch (\Exception $e) {
        echo "   ⚠ Could not check foreign key for {$table}.{$column}: " . $e->getMessage() . "\n";
    }
}

// Test 5: Check migration status
echo "\n5. Checking migration status...\n";
try {
    if (Schema::hasTable('migrations')) {
        $migrations = DB::table('migrations')->orderBy('id')->get();
        echo "   ✓ Found " . $migrations->count() . " completed migrations\n";
        
        if ($migrations->count() > 0) {
            echo "   Latest migration: " . $migrations->last()->migration . "\n";
        }
    } else {
        echo "   ⚠ Migrations table does not exist\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error checking migration status: " . $e->getMessage() . "\n";
}

// Summary
echo "\n=== Test Summary ===\n";
if (empty($missingTables)) {
    echo "✓ All critical tables exist\n";
} else {
    echo "⚠ Missing tables: " . implode(', ', $missingTables) . "\n";
    echo "  Run 'php artisan migrate' to create them\n";
}

echo "\n=== Next Steps ===\n";
echo "1. Run 'php artisan migrate' to run pending migrations\n";
echo "2. Run 'php artisan migrate:status' to check migration status\n";
echo "3. Run 'php artisan migrate:rollback' to test rollbacks (on test database only!)\n";
echo "4. Check application logs for any migration errors\n";

echo "\n=== Test Complete ===\n";

