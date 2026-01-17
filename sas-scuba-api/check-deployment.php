<?php

/**
 * Deployment Readiness Check Script
 * 
 * This script checks various aspects of the Laravel application
 * to ensure it's ready for deployment.
 * 
 * Usage:
 *   php check-deployment.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Deployment Readiness Check ===\n\n";

$errors = [];
$warnings = [];
$passed = [];

// Helper function to check PHP extension
function checkExtension($name, $required = true) {
    $loaded = extension_loaded($name);
    if (!$loaded && $required) {
        return ['status' => 'error', 'message' => "Required PHP extension '{$name}' is not loaded"];
    } elseif (!$loaded && !$required) {
        return ['status' => 'warning', 'message' => "Optional PHP extension '{$name}' is not loaded"];
    }
    return ['status' => 'ok', 'message' => "PHP extension '{$name}' is loaded"];
}

// 1. PHP Version Check
echo "1. PHP Version Check...\n";
$phpVersion = PHP_VERSION;
$requiredVersion = '8.2.0';
if (version_compare($phpVersion, $requiredVersion, '>=')) {
    echo "   ✓ PHP version {$phpVersion} meets requirement (>= {$requiredVersion})\n";
    $passed[] = "PHP version";
} else {
    echo "   ✗ PHP version {$phpVersion} does not meet requirement (>= {$requiredVersion})\n";
    $errors[] = "PHP version {$phpVersion} is below required {$requiredVersion}";
}

// 2. Required PHP Extensions
echo "\n2. PHP Extensions Check...\n";
$requiredExtensions = [
    'pdo' => true,
    'pdo_mysql' => true,
    'mbstring' => true,
    'openssl' => true,
    'json' => true,
    'xml' => true,
    'curl' => true,
    'zip' => true,
    'fileinfo' => true,
    'tokenizer' => true,
    'ctype' => true,
    'bcmath' => true,
];

$optionalExtensions = [
    'gd' => false,
    'imagick' => false,
    'redis' => false,
];

foreach ($requiredExtensions as $ext => $required) {
    $result = checkExtension($ext, $required);
    if ($result['status'] === 'ok') {
        echo "   ✓ {$result['message']}\n";
        $passed[] = "Extension: {$ext}";
    } elseif ($result['status'] === 'error') {
        echo "   ✗ {$result['message']}\n";
        $errors[] = $result['message'];
    }
}

foreach ($optionalExtensions as $ext => $required) {
    $result = checkExtension($ext, $required);
    if ($result['status'] === 'ok') {
        echo "   ✓ {$result['message']}\n";
    } elseif ($result['status'] === 'warning') {
        echo "   ⚠ {$result['message']}\n";
        $warnings[] = $result['message'];
    }
}

// 3. Environment Configuration
echo "\n3. Environment Configuration Check...\n";
$requiredEnvVars = [
    'APP_NAME',
    'APP_ENV',
    'APP_KEY',
    'APP_DEBUG',
    'APP_URL',
    'DB_CONNECTION',
    'DB_HOST',
    'DB_DATABASE',
    'DB_USERNAME',
];

foreach ($requiredEnvVars as $var) {
    $value = env($var);
    if ($value === null || $value === '') {
        echo "   ✗ Environment variable '{$var}' is not set\n";
        $errors[] = "Environment variable '{$var}' is not set";
    } else {
        // Don't show sensitive values
        $displayValue = in_array($var, ['DB_PASSWORD', 'APP_KEY']) ? '***' : $value;
        echo "   ✓ Environment variable '{$var}' is set ({$displayValue})\n";
        $passed[] = "Env var: {$var}";
    }
}

// Check critical values
if (env('APP_ENV') === 'production' && env('APP_DEBUG') === 'true') {
    echo "   ⚠ APP_DEBUG is enabled in production environment!\n";
    $warnings[] = "APP_DEBUG should be false in production";
}

if (empty(env('APP_KEY'))) {
    echo "   ✗ APP_KEY is not set. Run 'php artisan key:generate'\n";
    $errors[] = "APP_KEY is not set";
}

// 4. Database Connection
echo "\n4. Database Connection Check...\n";
try {
    \Illuminate\Support\Facades\DB::connection()->getPdo();
    $driver = \Illuminate\Support\Facades\DB::getDriverName();
    echo "   ✓ Database connection successful\n";
    echo "   ✓ Database driver: {$driver}\n";
    $passed[] = "Database connection";
} catch (\Exception $e) {
    echo "   ✗ Database connection failed: " . $e->getMessage() . "\n";
    $errors[] = "Database connection failed: " . $e->getMessage();
}

// 5. Storage Directories
echo "\n5. Storage Directories Check...\n";
$storagePaths = [
    'storage/app' => storage_path('app'),
    'storage/framework' => storage_path('framework'),
    'storage/logs' => storage_path('logs'),
    'bootstrap/cache' => base_path('bootstrap/cache'),
];

foreach ($storagePaths as $name => $path) {
    if (!is_dir($path)) {
        echo "   ✗ Directory '{$name}' does not exist\n";
        $errors[] = "Directory '{$name}' does not exist";
    } elseif (!is_writable($path)) {
        echo "   ✗ Directory '{$name}' is not writable\n";
        $errors[] = "Directory '{$name}' is not writable";
    } else {
        echo "   ✓ Directory '{$name}' exists and is writable\n";
        $passed[] = "Directory: {$name}";
    }
}

// 6. Migrations Status
echo "\n6. Migrations Status Check...\n";
try {
    $migrations = \Illuminate\Support\Facades\DB::table('migrations')->count();
    echo "   ✓ Found {$migrations} completed migrations\n";
    $passed[] = "Migrations";
    
    // Check for pending migrations
    $pendingMigrations = \Illuminate\Support\Facades\Artisan::call('migrate:status');
    $output = \Illuminate\Support\Facades\Artisan::output();
    if (strpos($output, 'Pending') !== false) {
        echo "   ⚠ There are pending migrations. Run 'php artisan migrate'\n";
        $warnings[] = "Pending migrations detected";
    }
} catch (\Exception $e) {
    echo "   ⚠ Could not check migrations: " . $e->getMessage() . "\n";
    $warnings[] = "Could not check migrations";
}

// 7. Composer Autoload
echo "\n7. Composer Autoload Check...\n";
$autoloadFile = base_path('vendor/autoload.php');
if (file_exists($autoloadFile)) {
    echo "   ✓ Composer autoload file exists\n";
    $passed[] = "Composer autoload";
} else {
    echo "   ✗ Composer autoload file not found. Run 'composer install'\n";
    $errors[] = "Composer autoload file not found";
}

// 8. Configuration Cache
echo "\n8. Configuration Cache Check...\n";
$configCache = base_path('bootstrap/cache/config.php');
if (file_exists($configCache)) {
    echo "   ✓ Configuration cache exists\n";
    $passed[] = "Config cache";
} else {
    echo "   ⚠ Configuration cache not found. Run 'php artisan config:cache' for production\n";
    $warnings[] = "Configuration cache not found";
}

// 9. Routes Cache
echo "\n9. Routes Cache Check...\n";
$routesCache = base_path('bootstrap/cache/routes-v7.php');
if (file_exists($routesCache)) {
    echo "   ✓ Routes cache exists\n";
    $passed[] = "Routes cache";
} else {
    echo "   ⚠ Routes cache not found. Run 'php artisan route:cache' for production\n";
    $warnings[] = "Routes cache not found";
}

// 10. Views Cache
echo "\n10. Views Cache Check...\n";
$viewsCache = storage_path('framework/views');
if (is_dir($viewsCache) && count(glob($viewsCache . '/*')) > 0) {
    echo "   ✓ Views cache directory exists\n";
    $passed[] = "Views cache";
} else {
    echo "   ⚠ Views cache not found. Run 'php artisan view:cache' for production\n";
    $warnings[] = "Views cache not found";
}

// 11. Critical Tables Check
echo "\n11. Critical Tables Check...\n";
$criticalTables = [
    'dive_centers',
    'users',
    'customers',
    'bookings',
    'invoices',
];

foreach ($criticalTables as $table) {
    try {
        if (\Illuminate\Support\Facades\Schema::hasTable($table)) {
            echo "   ✓ Table '{$table}' exists\n";
            $passed[] = "Table: {$table}";
        } else {
            echo "   ✗ Table '{$table}' does not exist\n";
            $errors[] = "Table '{$table}' does not exist";
        }
    } catch (\Exception $e) {
        echo "   ⚠ Could not check table '{$table}': " . $e->getMessage() . "\n";
        $warnings[] = "Could not check table '{$table}'";
    }
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
    echo "Errors (must fix before deployment):\n";
    foreach ($errors as $error) {
        echo "  ✗ {$error}\n";
    }
    echo "\n";
    exit(1);
}

if (empty($errors) && empty($warnings)) {
    echo "✅ All checks passed! Application is ready for deployment.\n";
} elseif (empty($errors)) {
    echo "⚠️  Some warnings found, but application should be deployable.\n";
    echo "   Review warnings above and fix if needed.\n";
}

echo "\n=== Next Steps ===\n";
if (env('APP_ENV') === 'production') {
    echo "1. Ensure APP_DEBUG=false\n";
    echo "2. Run 'php artisan optimize' for production\n";
    echo "3. Verify all environment variables are set\n";
    echo "4. Test on staging environment first\n";
    echo "5. Backup database before deployment\n";
} else {
    echo "1. Set APP_ENV=production for production deployment\n";
    echo "2. Set APP_DEBUG=false\n";
    echo "3. Run 'php artisan optimize'\n";
    echo "4. Test all functionality\n";
}

echo "\n=== Check Complete ===\n";

