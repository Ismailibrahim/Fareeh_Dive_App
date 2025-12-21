<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CountryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Cache for 1 hour (3600 seconds) - static reference data
        return Cache::remember('countries', 3600, function () {
            return Country::orderBy('name')->get();
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:countries,name',
        ]);

        $country = Country::create($validated);
        
        // Invalidate cache when new country is added
        Cache::forget('countries');
        
        return response()->json($country, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Country $country)
    {
        return $country;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Country $country)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:countries,name,' . $country->id,
        ]);

        $country->update($validated);
        
        // Invalidate cache when country is updated
        Cache::forget('countries');
        
        return response()->json($country);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Country $country)
    {
        $country->delete();
        
        // Invalidate cache when country is deleted
        Cache::forget('countries');
        
        return response()->noContent();
    }
}

