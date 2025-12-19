<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TaxController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('taxes', 3600, function () {
            return Tax::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
        ]);

        $tax = Tax::create($validated);
        
        // Invalidate cache when new tax is added
        Cache::forget('taxes');
        
        return response()->json($tax, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Tax $tax)
    {
        return $tax;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tax $tax)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
        ]);

        $tax->update($validated);
        
        // Invalidate cache when tax is updated
        Cache::forget('taxes');
        
        return response()->json($tax);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tax $tax)
    {
        $tax->delete();
        
        // Invalidate cache when tax is deleted
        Cache::forget('taxes');
        
        return response()->noContent();
    }
}

