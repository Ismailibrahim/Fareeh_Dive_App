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

    // Specific origins (always allowed)
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ],

    // Pattern-based origins: allow ANY private network IP on any port
    // This covers 192.168.x.x, 10.x.x.x, 172.16-31.x.x and localhost variants
    'allowed_origins_patterns' => [
        // All RFC-1918 private ranges (any port)
        '#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#',
        '#^https?://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$#',
        '#^https?://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$#',
        '#^https?://172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'X-XSRF-TOKEN',
        'Authorization',
    ],

    'max_age' => env('CORS_MAX_AGE', 86400), // 24 hours

    'supports_credentials' => true,

];
