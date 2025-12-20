<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocationController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Location::query();

        if ($user->dive_center_id) {
            $query->where('dive_center_id', $user->dive_center_id);
        }

        // Filter by active status if provided
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $diveCenterId = $request->user()->dive_center_id;
        $request->merge(['dive_center_id' => $diveCenterId]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('locations', 'name')->where('dive_center_id', $diveCenterId)
            ],
            'description' => 'nullable|string',
            'active' => 'boolean',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        $location = Location::create($validated);
        return response()->json($location, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Location $location)
    {
        // Verify location belongs to user's dive center
        $this->authorizeDiveCenterAccess($location, 'Unauthorized access to this location');

        return $location;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Location $location)
    {
        // Verify location belongs to user's dive center
        $this->authorizeDiveCenterAccess($location, 'Unauthorized access to this location');

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('locations', 'name')
                    ->ignore($location->id)
                    ->where('dive_center_id', $location->dive_center_id)
            ],
            'description' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $location->update($validated);
        return response()->json($location);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Location $location)
    {
        // Verify location belongs to user's dive center
        $this->authorizeDiveCenterAccess($location, 'Unauthorized access to this location');

        $location->delete();
        return response()->noContent();
    }
}

