<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CompressResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only compress JSON and text responses
        $contentType = $response->headers->get('Content-Type', '');
        
        if (!str_contains($contentType, 'application/json') && 
            !str_contains($contentType, 'text/') &&
            !str_contains($contentType, 'application/javascript')) {
            return $response;
        }

        // Check if client accepts gzip encoding
        $acceptEncoding = $request->header('Accept-Encoding', '');
        
        if (!str_contains($acceptEncoding, 'gzip')) {
            return $response;
        }

        // Get response content
        $content = $response->getContent();
        
        // Compress content
        $compressed = gzencode($content, 6); // Compression level 6 (balanced)
        
        if ($compressed === false) {
            return $response;
        }

        // Set compressed content
        $response->setContent($compressed);
        
        // Set headers
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Vary', 'Accept-Encoding');
        
        // Update Content-Length
        $response->headers->set('Content-Length', strlen($compressed));

        return $response;
    }
}

