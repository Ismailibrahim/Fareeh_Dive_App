<?php

/**
 * CSRF Configuration Check Script
 * 
 * This script checks CSRF-related configuration to ensure
 * it's properly set up for deployment.
 * 
 * Usage:
 *   php check-csrf-config.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== CSRF Configuration Check ===\n\n";

$errors = [];
$warnings = [];
$passed = [];

// 1. Sanctum Stateful Domains
echo "1. Sanctum Stateful Domains Check...\n";
$statefulDomains = config('sanctum.stateful', []);
if (empty($statefulDomains)) {
    echo "   ⚠ No stateful domains configured\n";
    $warnings[] = "SANCTUM_STATEFUL_DOMAINS is not set or empty";
} else {
    echo "   ✓ Stateful domains configured:\n";
    foreach ($statefulDomains as $domain) {
        echo "     - {$domain}\n";
    }
    $passed[] = "Sanctum stateful domains";
}

// Check if frontend URL is in stateful domains
$frontendUrl = env('FRONTEND_URL');
if ($frontendUrl) {
    $frontendDomain = parse_url($frontendUrl, PHP_URL_HOST);
    $frontendPort = parse_url($frontendUrl, PHP_URL_PORT);
    $frontendDomainWithPort = $frontendPort ? "{$frontendDomain}:{$frontendPort}" : $frontendDomain;
    
    $found = false;
    foreach ($statefulDomains as $domain) {
        if ($domain === $frontendDomain || $domain === $frontendDomainWithPort || 
            $domain === $frontendUrl || str_contains($domain, $frontendDomain)) {
            $found = true;
            break;
        }
    }
    
    if ($found) {
        echo "   ✓ Frontend URL ({$frontendUrl}) is in stateful domains\n";
        $passed[] = "Frontend URL in stateful domains";
    } else {
        echo "   ✗ Frontend URL ({$frontendUrl}) is NOT in stateful domains\n";
        $errors[] = "FRONTEND_URL ({$frontendUrl}) must be included in SANCTUM_STATEFUL_DOMAINS";
    }
} else {
    echo "   ⚠ FRONTEND_URL is not set\n";
    $warnings[] = "FRONTEND_URL should be set for production";
}

// 2. CORS Configuration
echo "\n2. CORS Configuration Check...\n";
$corsOrigins = config('cors.allowed_origins', []);
$corsSupportsCredentials = config('cors.supports_credentials', false);

if (empty($corsOrigins)) {
    echo "   ⚠ No CORS origins configured\n";
    $warnings[] = "CORS allowed origins not configured";
} else {
    echo "   ✓ CORS origins configured:\n";
    foreach ($corsOrigins as $origin) {
        echo "     - {$origin}\n";
    }
    $passed[] = "CORS origins";
}

if ($corsSupportsCredentials) {
    echo "   ✓ CORS supports credentials: true\n";
    $passed[] = "CORS supports credentials";
} else {
    echo "   ✗ CORS supports credentials: false (should be true for Sanctum)\n";
    $errors[] = "CORS supports_credentials must be true for Sanctum";
}

// 3. Session Configuration
echo "\n3. Session Configuration Check...\n";
$sessionDriver = config('session.driver');
$sessionDomain = config('session.domain');
$sessionSecure = config('session.secure');
$sessionSameSite = config('session.same_site');
$sessionHttpOnly = config('session.http_only');

echo "   Session Driver: {$sessionDriver}\n";
if (in_array($sessionDriver, ['database', 'redis', 'file'])) {
    echo "   ✓ Session driver is appropriate\n";
    $passed[] = "Session driver";
} else {
    echo "   ⚠ Session driver '{$sessionDriver}' may not work well with Sanctum\n";
    $warnings[] = "Consider using 'database' or 'redis' for session driver";
}

if ($sessionDomain) {
    echo "   Session Domain: {$sessionDomain}\n";
    $passed[] = "Session domain";
} else {
    echo "   Session Domain: null (default)\n";
    $passed[] = "Session domain (default)";
}

if ($sessionSecure === null) {
    $isHttps = (parse_url(env('APP_URL', ''), PHP_URL_SCHEME) === 'https');
    echo "   Session Secure: " . ($isHttps ? 'auto (HTTPS detected)' : 'auto (HTTP)') . "\n";
} else {
    echo "   Session Secure: " . ($sessionSecure ? 'true' : 'false') . "\n";
    if (parse_url(env('APP_URL', ''), PHP_URL_SCHEME) === 'https' && !$sessionSecure) {
        echo "   ⚠ HTTPS detected but SESSION_SECURE_COOKIE is false\n";
        $warnings[] = "SESSION_SECURE_COOKIE should be true when using HTTPS";
    }
    $passed[] = "Session secure";
}

echo "   Session SameSite: {$sessionSameSite}\n";
if ($sessionSameSite === 'none' && !$sessionSecure) {
    echo "   ✗ SameSite=none requires secure cookies\n";
    $errors[] = "SESSION_SAME_SITE=none requires SESSION_SECURE_COOKIE=true";
} else {
    $passed[] = "Session SameSite";
}

echo "   Session HttpOnly: " . ($sessionHttpOnly ? 'true' : 'false') . "\n";
if ($sessionHttpOnly) {
    $passed[] = "Session HttpOnly";
} else {
    echo "   ⚠ HttpOnly should be true for security\n";
    $warnings[] = "SESSION_HTTP_ONLY should be true";
}

// 4. CSRF Token Middleware
echo "\n4. CSRF Token Middleware Check...\n";
$csrfExcept = config('sanctum.middleware.validate_csrf_token.except', []);
if (!empty($csrfExcept)) {
    echo "   ✓ CSRF exceptions configured:\n";
    foreach ($csrfExcept as $except) {
        echo "     - {$except}\n";
    }
    $passed[] = "CSRF exceptions";
} else {
    echo "   ✓ No CSRF exceptions (default)\n";
    $passed[] = "CSRF middleware";
}

// 5. Environment Variables
echo "\n5. Environment Variables Check...\n";
$requiredEnvVars = [
    'APP_URL' => 'Application URL',
    'FRONTEND_URL' => 'Frontend URL',
];

foreach ($requiredEnvVars as $var => $description) {
    $value = env($var);
    if ($value) {
        echo "   ✓ {$description} ({$var}): {$value}\n";
        $passed[] = "Env: {$var}";
    } else {
        echo "   ⚠ {$description} ({$var}) is not set\n";
        $warnings[] = "{$var} should be set for production";
    }
}

$optionalEnvVars = [
    'SANCTUM_STATEFUL_DOMAINS' => 'Sanctum Stateful Domains',
    'SESSION_DOMAIN' => 'Session Domain',
    'SESSION_SECURE_COOKIE' => 'Session Secure Cookie',
    'SESSION_SAME_SITE' => 'Session SameSite',
];

foreach ($optionalEnvVars as $var => $description) {
    $value = env($var);
    if ($value !== null && $value !== '') {
        echo "   ✓ {$description} ({$var}): {$value}\n";
    }
}

// 6. Routes Check
echo "\n6. Routes Check...\n";
try {
    $routes = \Illuminate\Support\Facades\Route::getRoutes();
    $csrfCookieRoute = null;
    foreach ($routes as $route) {
        if ($route->uri() === 'sanctum/csrf-cookie') {
            $csrfCookieRoute = $route;
            break;
        }
    }
    
    if ($csrfCookieRoute) {
        echo "   ✓ /sanctum/csrf-cookie route exists\n";
        $passed[] = "CSRF cookie route";
    } else {
        echo "   ✗ /sanctum/csrf-cookie route not found\n";
        $errors[] = "Sanctum CSRF cookie route not found";
    }
} catch (\Exception $e) {
    echo "   ⚠ Could not check routes: " . $e->getMessage() . "\n";
    $warnings[] = "Could not verify routes";
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
    echo "✅ All CSRF configuration checks passed!\n";
} elseif (empty($errors)) {
    echo "⚠️  Some warnings found, but CSRF should work.\n";
    echo "   Review warnings above.\n";
}

echo "\n=== Configuration Recommendations ===\n";

$appUrl = env('APP_URL');
$frontendUrl = env('FRONTEND_URL');

if ($appUrl && $frontendUrl) {
    $appDomain = parse_url($appUrl, PHP_URL_HOST);
    $frontendDomain = parse_url($frontendUrl, PHP_URL_HOST);
    
    if ($appDomain === $frontendDomain) {
        echo "Same domain detected - use:\n";
        echo "  SESSION_DOMAIN=null\n";
        echo "  SESSION_SAME_SITE=lax\n";
    } elseif (str_ends_with($frontendDomain, $appDomain) || str_ends_with($appDomain, $frontendDomain)) {
        echo "Subdomain detected - use:\n";
        $rootDomain = str_replace(['.' . $appDomain, '.' . $frontendDomain], '', $appDomain . '.' . $frontendDomain);
        echo "  SESSION_DOMAIN=.{$rootDomain}\n";
        echo "  SESSION_SAME_SITE=lax\n";
    } else {
        echo "Different domains detected - use:\n";
        echo "  SESSION_DOMAIN=null\n";
        echo "  SESSION_SAME_SITE=none\n";
        echo "  SESSION_SECURE_COOKIE=true\n";
    }
}

echo "\n=== Check Complete ===\n";

