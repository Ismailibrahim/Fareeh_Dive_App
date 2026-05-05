<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    | For local development we dynamically add any private-network IP
    | (192.168.x.x, 10.x.x.x, 172.16-31.x.x) so login works from any
    | device on the LAN without having to restart or change config.
    |
    */

    'stateful' => (function () {
        // Base domains from .env
        $envDomains = array_filter(array_map('trim', explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
            '%s%s',
            'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
            Sanctum::currentApplicationUrlWithPort(),
        )))));

        // Detect the server's own LAN IP and add it automatically
        // This covers cases where the IP changes between sessions (DHCP)
        $serverIp = null;
        try {
            // Works on Windows and Linux
            $hostname = gethostname();
            if ($hostname) {
                $ips = gethostbynamel($hostname) ?: [];
                foreach ($ips as $ip) {
                    // Check it is a private (LAN) address
                    if (preg_match('/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/', $ip)) {
                        $serverIp = $ip;
                        break;
                    }
                }
            }
        } catch (\Throwable $e) {
            // Silently ignore — server IP detection is best-effort
        }

        $extra = [];
        if ($serverIp) {
            $extra[] = $serverIp;
            $extra[] = $serverIp . ':3000';
            $extra[] = $serverIp . ':8000';
        }

        return array_values(array_unique(array_filter(array_merge($envDomains, $extra))));
    })(),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies'      => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token'  => App\Http\Middleware\ValidateCsrfToken::class,
    ],

];
