<?php

/**
 * Quick script to check if pre-registration routes are registered
 * Run: php check-routes.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$routes = \Illuminate\Support\Facades\Route::getRoutes();

echo "Checking pre-registration routes:\n\n";

$found = false;
foreach ($routes as $route) {
    $uri = $route->uri();
    if (strpos($uri, 'pre-registration') !== false) {
        $found = true;
        $methods = implode('|', $route->methods());
        echo sprintf("%-8s %s\n", $methods, $uri);
    }
}

if (!$found) {
    echo "No pre-registration routes found!\n";
    echo "\nTrying to clear route cache...\n";
    \Illuminate\Support\Facades\Artisan::call('route:clear');
    echo "Route cache cleared. Please restart your server.\n";
} else {
    echo "\nRoutes found! If you're still getting 404, try:\n";
    echo "1. php artisan route:clear\n";
    echo "2. php artisan config:clear\n";
    echo "3. Restart your Laravel server\n";
}

