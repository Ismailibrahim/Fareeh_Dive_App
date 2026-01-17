<?php

/**
 * Performance & Caching Check Script
 * 
 * This script checks caching configuration and performance optimizations.
 * 
 * Usage:
 *   php check-performance.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Performance & Caching Check ===\n\n";

$passed = [];
$warnings = [];
$errors = [];

// 1. Cache Driver Check
echo "1. Cache Driver Check...\n";
$cacheDriver = config('cache.default');
$cacheStores = config('cache.stores', []);

echo "   Cache Driver: {$cacheDriver}\n";

if ($cacheDriver === 'redis') {
    echo "   ✓ Using Redis cache (optimal for performance)\n";
    $passed[] = "Redis cache";
} elseif ($cacheDriver === 'database') {
    echo "   ⚠ Using database cache (consider switching to Redis for better performance)\n";
    $warnings[] = "Consider switching to Redis cache for 3-5x better performance";
} elseif ($cacheDriver === 'file') {
    echo "   ⚠ Using file cache (consider switching to Redis)\n";
    $warnings[] = "Consider switching to Redis cache";
} else {
    echo "   ✓ Cache driver: {$cacheDriver}\n";
    $passed[] = "Cache driver";
}

// Check Redis availability if configured
if (isset($cacheStores['redis']) && $cacheDriver === 'redis') {
    try {
        if (!extension_loaded('redis') && !extension_loaded('phpredis')) {
            echo "   ⚠ Redis PHP extension not installed\n";
            $warnings[] = "Install Redis PHP extension (phpredis) to use Redis cache";
        } else {
            \Illuminate\Support\Facades\Cache::store('redis')->put('test_key', 'test_value', 1);
            $value = \Illuminate\Support\Facades\Cache::store('redis')->get('test_key');
            if ($value === 'test_value') {
                echo "   ✓ Redis cache is working\n";
                $passed[] = "Redis connection";
            } else {
                echo "   ✗ Redis cache test failed\n";
                $errors[] = "Redis cache is not working properly";
            }
            \Illuminate\Support\Facades\Cache::store('redis')->forget('test_key');
        }
    } catch (\Exception $e) {
        echo "   ⚠ Redis configured but not available: " . $e->getMessage() . "\n";
        $warnings[] = "Redis is configured but not available - " . $e->getMessage();
    }
}

// 2. Caching Implementation Check
echo "\n2. Caching Implementation Check...\n";
$cachedControllers = [
    'PriceListController' => 'Price Lists',
    'EquipmentController' => 'Equipment',
    'DiveSiteController' => 'Dive Sites',
    'BoatController' => 'Boats',
    'NationalityController' => 'Nationalities',
    'RelationshipController' => 'Relationships',
    'AgencyController' => 'Agencies',
    'ServiceTypeController' => 'Service Types',
    'TaxController' => 'Taxes',
    'DiveCenterController' => 'Dive Center Settings',
];

foreach ($cachedControllers as $controller => $name) {
    $file = app_path("Http/Controllers/Api/V1/{$controller}.php");
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (strpos($content, 'Cache::remember') !== false || strpos($content, 'Cache::forget') !== false) {
            echo "   ✓ {$name} - Caching implemented\n";
            $passed[] = "Caching: {$name}";
        } else {
            echo "   ⚠ {$name} - No caching found\n";
            $warnings[] = "{$name} controller does not use caching";
        }
    }
}

// 3. Database Indexes Check
echo "\n3. Database Indexes Check...\n";
$criticalTables = [
    'bookings' => ['dive_center_id', 'customer_id', 'status', 'booking_date'],
    'customers' => ['dive_center_id', 'email', 'passport_no'],
    'invoices' => ['dive_center_id', 'booking_id', 'status'],
    'equipment_items' => ['equipment_id', 'status'],
    'booking_equipment' => ['booking_id', 'equipment_item_id', 'basket_id'],
];

foreach ($criticalTables as $table => $columns) {
    try {
        if (\Illuminate\Support\Facades\Schema::hasTable($table)) {
            $indexes = \Illuminate\Support\Facades\DB::select("SHOW INDEXES FROM `{$table}`");
            $indexColumns = array_column($indexes, 'Column_name');
            
            $missingIndexes = [];
            foreach ($columns as $column) {
                if (!in_array($column, $indexColumns)) {
                    $missingIndexes[] = $column;
                }
            }
            
            if (empty($missingIndexes)) {
                echo "   ✓ Table '{$table}' has required indexes\n";
                $passed[] = "Indexes: {$table}";
            } else {
                echo "   ⚠ Table '{$table}' missing indexes on: " . implode(', ', $missingIndexes) . "\n";
                $warnings[] = "Table '{$table}' missing indexes";
            }
        }
    } catch (\Exception $e) {
        echo "   ⚠ Could not check indexes for '{$table}': " . $e->getMessage() . "\n";
        $warnings[] = "Could not check indexes for '{$table}'";
    }
}

// 4. Response Compression Check
echo "\n4. Response Compression Check...\n";
$compressionEnabled = env('ENABLE_RESPONSE_COMPRESSION', false);
$isProduction = app()->environment('production');

if ($compressionEnabled || $isProduction) {
    $middlewareFile = base_path('bootstrap/app.php');
    $middlewareContent = file_get_contents($middlewareFile);
    
    if (strpos($middlewareContent, 'CompressResponse') !== false) {
        echo "   ✓ Response compression middleware is enabled\n";
        $passed[] = "Response compression";
    } else {
        echo "   ⚠ Response compression is configured but middleware not added\n";
        $warnings[] = "Add CompressResponse middleware to bootstrap/app.php";
    }
} else {
    echo "   ⚠ Response compression is not enabled\n";
    echo "   Set ENABLE_RESPONSE_COMPRESSION=true in .env to enable\n";
    $warnings[] = "Response compression not enabled";
}

// 5. Frontend Caching Check
echo "\n5. Frontend Caching Check...\n";
$queryProviderFile = base_path('../sas-scuba-web/src/lib/providers/query-provider.tsx');
if (file_exists($queryProviderFile)) {
    $content = file_get_contents($queryProviderFile);
    if (strpos($content, 'staleTime') !== false && strpos($content, 'useQuery') !== false) {
        echo "   ✓ React Query is configured with staleTime\n";
        $passed[] = "Frontend caching";
    } else {
        echo "   ⚠ React Query may not be properly configured\n";
        $warnings[] = "Check React Query configuration";
    }
} else {
    echo "   ⚠ Could not find query provider file\n";
    $warnings[] = "Query provider file not found";
}

// 6. Configuration Cache Check
echo "\n6. Configuration Cache Check...\n";
$configCache = base_path('bootstrap/cache/config.php');
if (file_exists($configCache)) {
    echo "   ✓ Configuration is cached\n";
    $passed[] = "Config cache";
} else {
    echo "   ⚠ Configuration cache not found. Run 'php artisan config:cache' for production\n";
    $warnings[] = "Configuration cache not found";
}

// 7. Route Cache Check
echo "\n7. Route Cache Check...\n";
$routeCache = base_path('bootstrap/cache/routes-v7.php');
if (file_exists($routeCache)) {
    echo "   ✓ Routes are cached\n";
    $passed[] = "Route cache";
} else {
    echo "   ⚠ Route cache not found. Run 'php artisan route:cache' for production\n";
    $warnings[] = "Route cache not found";
}

// 8. View Cache Check
echo "\n8. View Cache Check...\n";
$viewsCache = storage_path('framework/views');
if (is_dir($viewsCache) && count(glob($viewsCache . '/*')) > 0) {
    echo "   ✓ Views are cached\n";
    $passed[] = "View cache";
} else {
    echo "   ⚠ View cache not found. Run 'php artisan view:cache' for production\n";
    $warnings[] = "View cache not found";
}

// Summary
echo "\n=== Summary ===\n";
echo "✓ Passed: " . count($passed) . "\n";
echo "⚠ Warnings: " . count($warnings) . "\n";
echo "✗ Errors: " . count($errors) . "\n\n";

if (!empty($warnings)) {
    echo "Warnings:\n";
    foreach ($warnings as $warning) {
        echo "  ⚠ {$warning}\n";
    }
    echo "\n";
}

if (!empty($errors)) {
    echo "Errors:\n";
    foreach ($errors as $error) {
        echo "  ✗ {$error}\n";
    }
    echo "\n";
}

if (empty($errors) && empty($warnings)) {
    echo "✅ All performance optimizations are in place!\n";
} elseif (empty($errors)) {
    echo "⚠️  Some optimizations can be improved.\n";
    echo "   Review warnings above.\n";
}

echo "\n=== Recommendations ===\n";

if ($cacheDriver !== 'redis') {
    echo "1. Switch to Redis cache for better performance:\n";
    echo "   CACHE_STORE=redis\n";
    echo "   REDIS_HOST=127.0.0.1\n";
    echo "   REDIS_PORT=6379\n\n";
}

if (!$compressionEnabled && !$isProduction) {
    echo "2. Enable response compression:\n";
    echo "   ENABLE_RESPONSE_COMPRESSION=true\n\n";
}

if (!file_exists($configCache)) {
    echo "3. Cache configuration for production:\n";
    echo "   php artisan config:cache\n\n";
}

if (!file_exists($routeCache)) {
    echo "4. Cache routes for production:\n";
    echo "   php artisan route:cache\n\n";
}

echo "=== Check Complete ===\n";

