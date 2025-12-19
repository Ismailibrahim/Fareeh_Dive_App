<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ServiceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ServiceTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('service_types', 3600, function () {
            return ServiceType::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:service_types,name',
        ]);

        $serviceType = ServiceType::create($validated);
        
        // Invalidate cache when new service type is added
        Cache::forget('service_types');
        
        return response()->json($serviceType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ServiceType $serviceType)
    {
        return $serviceType;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ServiceType $serviceType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:service_types,name,' . $serviceType->id,
        ]);

        $serviceType->update($validated);
        
        // Invalidate cache when service type is updated
        Cache::forget('service_types');
        
        return response()->json($serviceType);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceType $serviceType)
    {
        $serviceType->delete();
        
        // Invalidate cache when service type is deleted
        Cache::forget('service_types');
        
        return response()->noContent();
    }
}

