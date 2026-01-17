<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Excursion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ExcursionController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        if ($diveCenterId) {
            // Cache excursions for 30 minutes (1800 seconds)
            $cacheKey = "excursions_{$diveCenterId}";
            return Cache::remember($cacheKey, 1800, function () use ($diveCenterId) {
                return Excursion::where('dive_center_id', $diveCenterId)
                    ->orderBy('name')
                    ->paginate(20);
            });
        }
        return Excursion::paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['dive_center_id' => $request->user()->dive_center_id]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'meeting_point' => 'nullable|string|max:255',
            'departure_time' => 'nullable|date_format:H:i',
            'is_active' => 'nullable|boolean',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        $excursion = Excursion::create($validated);
        
        // Clear excursions cache for this dive center
        Cache::forget("excursions_{$excursion->dive_center_id}");
        
        return response()->json($excursion, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Excursion $excursion)
    {
        // Verify excursion belongs to user's dive center
        $this->authorizeDiveCenterAccess($excursion, 'Unauthorized access to this excursion');
        
        return $excursion;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Excursion $excursion)
    {
        // Verify excursion belongs to user's dive center
        $this->authorizeDiveCenterAccess($excursion, 'Unauthorized access to this excursion');
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'duration' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'meeting_point' => 'nullable|string|max:255',
            'departure_time' => 'nullable|date_format:H:i',
            'is_active' => 'nullable|boolean',
        ]);

        $excursion->update($validated);
        
        // Clear excursions cache for this dive center
        Cache::forget("excursions_{$excursion->dive_center_id}");
        
        return response()->json($excursion);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Excursion $excursion)
    {
        // Verify excursion belongs to user's dive center
        $this->authorizeDiveCenterAccess($excursion, 'Unauthorized access to this excursion');
        
        $diveCenterId = $excursion->dive_center_id;
        $excursion->delete();
        
        // Clear excursions cache for this dive center
        Cache::forget("excursions_{$diveCenterId}");
        
        return response()->noContent();
    }
}
