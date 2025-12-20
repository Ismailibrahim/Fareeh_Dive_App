<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ErrorHandler
{
    /**
     * Handle an incoming request and catch exceptions.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Model not found', [
                'model' => class_basename($e->getModel()),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
            ]);

            return response()->json([
                'message' => 'Resource not found',
                'error' => class_basename($e->getModel()) . ' not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Let validation exceptions pass through (they're handled by Laravel)
            throw $e;
        } catch (\Illuminate\Auth\AuthenticationException $e) {
            return response()->json([
                'message' => 'Unauthenticated',
                'error' => 'Authentication required',
            ], 401);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'message' => 'Unauthorized',
                'error' => $e->getMessage() ?: 'You do not have permission to perform this action',
            ], 403);
        } catch (\Exception $e) {
            // Log the full exception for debugging
            Log::error('Unhandled exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
            ]);

            // Return a generic error message (don't expose internal details)
            return response()->json([
                'message' => 'An error occurred while processing your request',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

