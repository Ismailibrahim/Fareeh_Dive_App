<?php

/**
 * Redis Setup Helper Script
 * 
 * This script helps verify Redis setup and provides guidance.
 * 
 * Usage:
 *   php setup-redis.php
 */

echo "=== Redis Setup Helper ===\n\n";

// Check if Redis extension is available
echo "1. Checking PHP Redis Extension...\n";
if (extension_loaded('redis')) {
    echo "   ✓ Redis PHP extension is loaded\n";
    $redisExtension = true;
} elseif (extension_loaded('phpredis')) {
    echo "   ✓ PHPRedis extension is loaded\n";
    $redisExtension = true;
} else {
    echo "   ⚠ Redis PHP extension is not loaded\n";
    echo "   Options:\n";
    echo "     a) Install extension: pecl install redis\n";
    echo "     b) Use Predis (no extension): composer require predis/predis\n";
    $redisExtension = false;
}

// Check if Predis is available
echo "\n2. Checking Predis Package...\n";
$predisPath = __DIR__ . '/vendor/predis/predis/src/Client.php';
if (file_exists($predisPath)) {
    echo "   ✓ Predis package is installed\n";
    $predisAvailable = true;
} else {
    echo "   ⚠ Predis package is not installed\n";
    echo "   Install with: composer require predis/predis\n";
    $predisAvailable = false;
}

// Check current cache driver
echo "\n3. Checking Current Cache Configuration...\n";
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cacheDriver = config('cache.default');
echo "   Current Cache Driver: {$cacheDriver}\n";

if ($cacheDriver === 'redis') {
    echo "   ✓ Redis is configured as cache driver\n";
    
    // Test Redis connection
    echo "\n4. Testing Redis Connection...\n";
    try {
        $testKey = 'redis_test_' . time();
        \Illuminate\Support\Facades\Cache::store('redis')->put($testKey, 'test_value', 10);
        $value = \Illuminate\Support\Facades\Cache::store('redis')->get($testKey);
        
        if ($value === 'test_value') {
            echo "   ✓ Redis connection is working!\n";
            \Illuminate\Support\Facades\Cache::store('redis')->forget($testKey);
            
            // Test performance
            echo "\n5. Testing Cache Performance...\n";
            $start = microtime(true);
            for ($i = 0; $i < 100; $i++) {
                \Illuminate\Support\Facades\Cache::store('redis')->put("perf_test_{$i}", "value_{$i}", 60);
                \Illuminate\Support\Facades\Cache::store('redis')->get("perf_test_{$i}");
            }
            $end = microtime(true);
            $time = ($end - $start) * 1000; // Convert to milliseconds
            
            // Cleanup
            for ($i = 0; $i < 100; $i++) {
                \Illuminate\Support\Facades\Cache::store('redis')->forget("perf_test_{$i}");
            }
            
            echo "   ✓ 100 cache operations completed in " . number_format($time, 2) . "ms\n";
            echo "   ✓ Average: " . number_format($time / 100, 2) . "ms per operation\n";
            
            if ($time < 50) {
                echo "   ✓ Excellent performance!\n";
            } elseif ($time < 100) {
                echo "   ✓ Good performance\n";
            } else {
                echo "   ⚠ Performance could be better (check Redis server)\n";
            }
        } else {
            echo "   ✗ Redis connection test failed\n";
            echo "   Check Redis server is running and configuration is correct\n";
        }
    } catch (\Exception $e) {
        echo "   ✗ Redis connection failed: " . $e->getMessage() . "\n";
        echo "\n   Troubleshooting:\n";
        echo "   1. Check Redis server is running: redis-cli ping\n";
        echo "   2. Verify REDIS_HOST and REDIS_PORT in .env\n";
        echo "   3. Check firewall settings\n";
        echo "   4. Try using Predis: composer require predis/predis\n";
    }
} else {
    echo "   ⚠ Redis is not configured as cache driver\n";
    echo "\n   To enable Redis:\n";
    echo "   1. Install Redis server or use Predis\n";
    echo "   2. Update .env:\n";
    echo "      CACHE_STORE=redis\n";
    echo "      REDIS_HOST=127.0.0.1\n";
    echo "      REDIS_PORT=6379\n";
    if (!$redisExtension && $predisAvailable) {
        echo "      REDIS_CLIENT=predis\n";
    }
    echo "   3. Run: php artisan config:clear\n";
}

// Check Redis configuration
echo "\n6. Redis Configuration Check...\n";
$redisHost = env('REDIS_HOST', '127.0.0.1');
$redisPort = env('REDIS_PORT', 6379);
$redisClient = env('REDIS_CLIENT', 'phpredis');

echo "   REDIS_HOST: {$redisHost}\n";
echo "   REDIS_PORT: {$redisPort}\n";
echo "   REDIS_CLIENT: {$redisClient}\n";

if ($redisClient === 'predis' && !$predisAvailable) {
    echo "   ⚠ Predis is configured but not installed\n";
    echo "   Run: composer require predis/predis\n";
} elseif ($redisClient === 'phpredis' && !$redisExtension) {
    echo "   ⚠ PHPRedis is configured but extension not loaded\n";
    echo "   Install extension or switch to Predis\n";
}

// Recommendations
echo "\n=== Recommendations ===\n";

if ($cacheDriver !== 'redis') {
    echo "1. Switch to Redis cache for better performance:\n";
    echo "   - Install Redis server or use Predis\n";
    echo "   - Update .env: CACHE_STORE=redis\n";
    echo "   - Run: php artisan config:clear\n\n";
}

if (!$redisExtension && !$predisAvailable) {
    echo "2. Install Redis client:\n";
    echo "   Option A (Predis - recommended, no extension):\n";
    echo "     composer require predis/predis\n";
    echo "     Set REDIS_CLIENT=predis in .env\n\n";
    echo "   Option B (PHP Extension):\n";
    echo "     pecl install redis\n";
    echo "     Set REDIS_CLIENT=phpredis in .env\n\n";
}

if ($cacheDriver === 'redis') {
    echo "✅ Redis is configured and working!\n";
    echo "\nNext steps:\n";
    echo "1. Monitor cache performance\n";
    echo "2. Consider using Redis for sessions: SESSION_DRIVER=redis\n";
    echo "3. Consider using Redis for queues: QUEUE_CONNECTION=redis\n";
}

echo "\n=== Setup Complete ===\n";

