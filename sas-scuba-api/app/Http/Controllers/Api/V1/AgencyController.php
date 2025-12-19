<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AgencyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('agencies', 3600, function () {
            return Agency::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:agencies,name',
        ]);

        $agency = Agency::create($validated);
        
        // Invalidate cache when new agency is added
        Cache::forget('agencies');
        
        return response()->json($agency, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Agency $agency)
    {
        return $agency;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Agency $agency)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:agencies,name,' . $agency->id,
        ]);

        $agency->update($validated);
        
        // Invalidate cache when agency is updated
        Cache::forget('agencies');
        
        return response()->json($agency);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Agency $agency)
    {
        $agency->delete();
        
        // Invalidate cache when agency is deleted
        Cache::forget('agencies');
        
        return response()->noContent();
    }
}
