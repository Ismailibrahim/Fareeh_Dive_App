<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('units', 3600, function () {
            return Unit::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units,name',
        ]);

        $unit = Unit::create($validated);
        
        // Invalidate cache when new unit is added
        Cache::forget('units');
        
        return response()->json($unit, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Unit $unit)
    {
        return $unit;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units,name,' . $unit->id,
        ]);

        $unit->update($validated);
        
        // Invalidate cache when unit is updated
        Cache::forget('units');
        
        return response()->json($unit);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Unit $unit)
    {
        $unit->delete();
        
        // Invalidate cache when unit is deleted
        Cache::forget('units');
        
        return response()->noContent();
    }
}

