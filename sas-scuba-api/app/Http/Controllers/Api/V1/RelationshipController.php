<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Relationship;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RelationshipController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('relationships', 3600, function () {
            return Relationship::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:relationships,name',
        ]);

        $relationship = Relationship::create($validated);
        
        // Invalidate cache when new relationship is added
        Cache::forget('relationships');
        
        return response()->json($relationship, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Relationship $relationship)
    {
        return $relationship;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Relationship $relationship)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:relationships,name,' . $relationship->id,
        ]);

        $relationship->update($validated);
        
        // Invalidate cache when relationship is updated
        Cache::forget('relationships');
        
        return response()->json($relationship);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Relationship $relationship)
    {
        $relationship->delete();
        
        // Invalidate cache when relationship is deleted
        Cache::forget('relationships');
        
        return response()->noContent();
    }
}
