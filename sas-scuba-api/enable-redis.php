<?php

/**
 * Enable Redis Cache Script
 * 
 * This script helps enable Redis cache by updating .env file
 * 
 * Usage:
 *   php enable-redis.php
 */

echo "=== Enable Redis Cache ===\n\n";

$envPath = __DIR__ . '/.env';
$envExamplePath = __DIR__ . '/.env.example';

// Check if .env exists
if (!file_exists($envPath)) {
    echo "⚠ .env file not found!\n";
    echo "Creating from .env.example...\n";
    
    if (file_exists($envExamplePath)) {
        copy($envExamplePath, $envPath);
        echo "✓ Created .env from .env.example\n\n";
    } else {
        echo "✗ .env.example not found. Please create .env manually.\n";
        exit(1);
    }
}

// Read .env file
$envContent = file_get_contents($envPath);

// Check current cache driver
if (preg_match('/^CACHE_STORE=(.*)$/m', $envContent, $matches)) {
    $currentDriver = trim($matches[1]);
    echo "Current Cache Driver: {$currentDriver}\n";
} else {
    echo "CACHE_STORE not found in .env\n";
    $currentDriver = null;
}

// Update CACHE_STORE
if ($currentDriver !== 'redis') {
    if ($currentDriver) {
        $envContent = preg_replace('/^CACHE_STORE=.*$/m', 'CACHE_STORE=redis', $envContent);
        echo "✓ Updated CACHE_STORE to redis\n";
    } else {
        $envContent .= "\nCACHE_STORE=redis\n";
        echo "✓ Added CACHE_STORE=redis\n";
    }
} else {
    echo "✓ CACHE_STORE is already set to redis\n";
}

// Check and update REDIS_CLIENT
if (preg_match('/^REDIS_CLIENT=(.*)$/m', $envContent, $matches)) {
    $currentClient = trim($matches[1]);
    if ($currentClient !== 'predis') {
        $envContent = preg_replace('/^REDIS_CLIENT=.*$/m', 'REDIS_CLIENT=predis', $envContent);
        echo "✓ Updated REDIS_CLIENT to predis\n";
    } else {
        echo "✓ REDIS_CLIENT is already set to predis\n";
    }
} else {
    $envContent .= "\nREDIS_CLIENT=predis\n";
    echo "✓ Added REDIS_CLIENT=predis\n";
}

// Check and update REDIS_HOST
if (!preg_match('/^REDIS_HOST=/m', $envContent)) {
    $envContent .= "\nREDIS_HOST=127.0.0.1\n";
    echo "✓ Added REDIS_HOST=127.0.0.1\n";
} else {
    echo "✓ REDIS_HOST already configured\n";
}

// Check and update REDIS_PORT
if (!preg_match('/^REDIS_PORT=/m', $envContent)) {
    $envContent .= "\nREDIS_PORT=6379\n";
    echo "✓ Added REDIS_PORT=6379\n";
} else {
    echo "✓ REDIS_PORT already configured\n";
}

// Check and update REDIS_PASSWORD (optional, keep null if not set)
if (!preg_match('/^REDIS_PASSWORD=/m', $envContent)) {
    $envContent .= "\nREDIS_PASSWORD=null\n";
    echo "✓ Added REDIS_PASSWORD=null\n";
}

// Write updated .env file
file_put_contents($envPath, $envContent);
echo "\n✓ .env file updated successfully!\n\n";

// Clear config cache
echo "Clearing configuration cache...\n";
$output = [];
$returnVar = 0;
exec('php artisan config:clear 2>&1', $output, $returnVar);
if ($returnVar === 0) {
    echo "✓ Configuration cache cleared\n";
} else {
    echo "⚠ Could not clear config cache: " . implode("\n", $output) . "\n";
}

// Clear application cache
echo "\nClearing application cache...\n";
exec('php artisan cache:clear 2>&1', $output, $returnVar);
if ($returnVar === 0) {
    echo "✓ Application cache cleared\n";
} else {
    echo "⚠ Could not clear cache: " . implode("\n", $output) . "\n";
}

echo "\n=== Testing Redis Connection ===\n\n";

// Test Redis connection
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $testKey = 'redis_test_' . time();
    \Illuminate\Support\Facades\Cache::put($testKey, 'test_value', 10);
    $value = \Illuminate\Support\Facades\Cache::get($testKey);
    
    if ($value === 'test_value') {
        echo "✓ Redis cache is working!\n";
        \Illuminate\Support\Facades\Cache::forget($testKey);
        
        // Test performance
        echo "\nTesting cache performance...\n";
        $start = microtime(true);
        for ($i = 0; $i < 100; $i++) {
            \Illuminate\Support\Facades\Cache::put("perf_test_{$i}", "value_{$i}", 60);
            \Illuminate\Support\Facades\Cache::get("perf_test_{$i}");
        }
        $end = microtime(true);
        $time = ($end - $start) * 1000;
        
        // Cleanup
        for ($i = 0; $i < 100; $i++) {
            \Illuminate\Support\Facades\Cache::forget("perf_test_{$i}");
        }
        
        echo "✓ 100 cache operations completed in " . number_format($time, 2) . "ms\n";
        echo "✓ Average: " . number_format($time / 100, 2) . "ms per operation\n";
        
        if ($time < 50) {
            echo "✓ Excellent performance!\n";
        } elseif ($time < 100) {
            echo "✓ Good performance\n";
        }
        
        echo "\n✅ Redis cache is enabled and working!\n";
    } else {
        echo "✗ Redis cache test failed\n";
        echo "Check Redis server is running or use Predis\n";
    }
} catch (\Exception $e) {
    echo "✗ Redis connection failed: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting:\n";
    echo "1. If using Predis (no Redis server): Should work automatically\n";
    echo "2. If using Redis server: Check it's running (redis-cli ping)\n";
    echo "3. Verify REDIS_HOST and REDIS_PORT in .env\n";
    echo "4. Check firewall settings\n";
}

echo "\n=== Setup Complete ===\n";
echo "\nNext steps:\n";
echo "1. Run: php check-performance.php (to verify all optimizations)\n";
echo "2. Test your application\n";
echo "3. Monitor cache performance\n";

