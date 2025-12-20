<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\DiveSite;
use Illuminate\Http\Request;

class DiveSiteController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->dive_center_id) {
            return DiveSite::where('dive_center_id', $user->dive_center_id)->paginate(20);
        }
        return DiveSite::paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['dive_center_id' => $request->user()->dive_center_id]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'max_depth' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location' => 'nullable|string|max:255',
            'pax_capacity' => 'nullable|integer|min:1',
            'attachment' => 'nullable|string|max:500',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        $diveSite = DiveSite::create($validated);
        return response()->json($diveSite, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, DiveSite $diveSite)
    {
        // Verify dive site belongs to user's dive center
        $this->authorizeDiveCenterAccess($diveSite, 'Unauthorized access to this dive site');
        
        return $diveSite;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DiveSite $diveSite)
    {
        // Verify dive site belongs to user's dive center
        $this->authorizeDiveCenterAccess($diveSite, 'Unauthorized access to this dive site');
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'max_depth' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location' => 'nullable|string|max:255',
            'pax_capacity' => 'nullable|integer|min:1',
            'attachment' => 'nullable|string|max:500',
        ]);

        $diveSite->update($validated);
        return response()->json($diveSite);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DiveSite $diveSite)
    {
        // Verify dive site belongs to user's dive center
        $this->authorizeDiveCenterAccess($diveSite, 'Unauthorized access to this dive site');
        
        $diveSite->delete();
        return response()->noContent();
    }
}

