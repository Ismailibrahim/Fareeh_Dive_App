<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Predis\Connection\ConnectionException;
use Predis\Connection\Resource\Exception\StreamInitException;
use Symfony\Component\HttpFoundation\Response;

class ThrottleRequestsWithFallback extends ThrottleRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle($request, Closure $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = ''): Response
    {
        // Rate limiting is now enabled with Redis
        // The fallback will handle Redis connection failures gracefully

        try {
            return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
        } catch (ConnectionException | StreamInitException $e) {
            // Redis connection failed - log warning and proceed without rate limiting in development
            Log::warning('Rate limiting unavailable - Redis connection failed', [
                'error' => $e->getMessage(),
                'url' => $request->fullUrl(),
            ]);

            // In development, allow requests to proceed without rate limiting
            if (config('app.debug')) {
                return $next($request);
            }

            // In production, return 503 Service Unavailable
            return response()->json([
                'message' => 'Service temporarily unavailable',
                'error' => 'Rate limiting service is unavailable',
            ], 503);
        } catch (\Exception $e) {
            // Check if it's a Redis-related error
            if (str_contains($e->getMessage(), 'Redis') || 
                str_contains($e->getMessage(), '127.0.0.1:6379') ||
                str_contains($e->getMessage(), 'Connection refused') ||
                str_contains($e->getMessage(), 'No connection could be made')) {
                
                Log::warning('Rate limiting unavailable - Redis error', [
                    'error' => $e->getMessage(),
                    'url' => $request->fullUrl(),
                ]);

                if (config('app.debug')) {
                    return $next($request);
                }

                return response()->json([
                    'message' => 'Service temporarily unavailable',
                    'error' => 'Rate limiting service is unavailable',
                ], 503);
            }

            // Re-throw other exceptions
            throw $e;
        }
    }
}

