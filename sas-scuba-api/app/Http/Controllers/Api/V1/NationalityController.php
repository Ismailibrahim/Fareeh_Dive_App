<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Nationality;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NationalityController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('nationalities', 3600, function () {
            return Nationality::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:nationalities,name',
        ]);

        $nationality = Nationality::create($validated);
        
        // Invalidate cache when new nationality is added
        Cache::forget('nationalities');
        
        return response()->json($nationality, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Nationality $nationality)
    {
        return $nationality;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Nationality $nationality)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:nationalities,name,' . $nationality->id,
        ]);

        $nationality->update($validated);
        
        // Invalidate cache when nationality is updated
        Cache::forget('nationalities');
        
        return response()->json($nationality);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Nationality $nationality)
    {
        $nationality->delete();
        
        // Invalidate cache when nationality is deleted
        Cache::forget('nationalities');
        
        return response()->noContent();
    }
}
