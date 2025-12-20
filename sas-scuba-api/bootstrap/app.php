<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        // Add security headers to all API responses
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
        // Add error handling middleware
        $middleware->append(\App\Http\Middleware\ErrorHandler::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
