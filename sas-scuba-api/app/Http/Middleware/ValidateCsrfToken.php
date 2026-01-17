<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as Middleware;

class ValidateCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/v1/pre-registration/*/submit',
        // Note: Login/register routes use Sanctum's stateful API which handles CSRF automatically
        // They should NOT be excluded here as they rely on CSRF tokens from /sanctum/csrf-cookie
    ];
}

