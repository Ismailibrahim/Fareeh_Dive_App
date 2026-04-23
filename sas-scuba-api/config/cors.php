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

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.185:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://192.168.1.185:8000',
    ],

    'allowed_origins_patterns' => [
        '#^https?://(192\.168\.|10\.|172\.)\d{1,3}\.\d{1,3}(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'X-XSRF-TOKEN',
        'Authorization',
    ],

    'max_age' => env('CORS_MAX_AGE', 86400), // 24 hours default

    'supports_credentials' => true,

];
