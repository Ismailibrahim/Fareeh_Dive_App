<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:3000'),
        env('APP_URL', null),
        // Support multiple origins from environment variable (comma-separated)
        ...(env('CORS_ALLOWED_ORIGINS') ? explode(',', env('CORS_ALLOWED_ORIGINS')) : []),
    ]),

    'allowed_origins_patterns' => [
        // Allow any subdomain of the main domain
        env('CORS_ALLOWED_ORIGIN_PATTERN', null),
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'X-XSRF-TOKEN',
        'Authorization',
    ],

    'max_age' => env('CORS_MAX_AGE', 86400), // 24 hours default

    'supports_credentials' => true,

];
