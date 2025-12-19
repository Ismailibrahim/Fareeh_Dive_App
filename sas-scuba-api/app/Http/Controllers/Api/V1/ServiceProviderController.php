<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ServiceProviderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('service_providers', 3600, function () {
            return ServiceProvider::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_no' => 'nullable|string|max:255',
        ]);

        $serviceProvider = ServiceProvider::create($validated);
        
        // Invalidate cache when new service provider is added
        Cache::forget('service_providers');
        
        return response()->json($serviceProvider, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ServiceProvider $serviceProvider)
    {
        return $serviceProvider;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ServiceProvider $serviceProvider)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_no' => 'nullable|string|max:255',
        ]);

        $serviceProvider->update($validated);
        
        // Invalidate cache when service provider is updated
        Cache::forget('service_providers');
        
        return response()->json($serviceProvider);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceProvider $serviceProvider)
    {
        $serviceProvider->delete();
        
        // Invalidate cache when service provider is deleted
        Cache::forget('service_providers');
        
        return response()->noContent();
    }
}
