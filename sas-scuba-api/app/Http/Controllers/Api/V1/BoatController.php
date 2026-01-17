<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Boat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BoatController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        $activeFilter = $request->has('active') ? $request->boolean('active') : null;
        
        if ($diveCenterId) {
            // Build cache key
            $cacheKey = "boats_{$diveCenterId}_" . ($activeFilter !== null ? ($activeFilter ? 'active' : 'inactive') : 'all');
            
            // Only cache if no active filter or filter is provided (boats don't change often)
            $cacheTime = 1800; // 30 minutes
            
            return Cache::remember($cacheKey, $cacheTime, function () use ($diveCenterId, $activeFilter) {
                $query = Boat::where('dive_center_id', $diveCenterId);
                
                if ($activeFilter !== null) {
                    $query->where('active', $activeFilter);
                }
                
                return $query->orderBy('name')->paginate(20);
            });
        }

        $query = Boat::query();
        if ($activeFilter !== null) {
            $query->where('active', $activeFilter);
        }
        return $query->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge(['dive_center_id' => $request->user()->dive_center_id]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'active' => 'boolean',
            'is_owned' => 'boolean',
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        $boat = Boat::create($validated);
        
        // Clear boats cache for this dive center
        $this->clearBoatsCache($boat->dive_center_id);
        
        return response()->json($boat, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Boat $boat)
    {
        // Verify boat belongs to user's dive center
        $this->authorizeDiveCenterAccess($boat, 'Unauthorized access to this boat');
        
        return $boat;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Boat $boat)
    {
        // Verify boat belongs to user's dive center
        $this->authorizeDiveCenterAccess($boat, 'Unauthorized access to this boat');
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'active' => 'boolean',
            'is_owned' => 'boolean',
        ]);

        $boat->update($validated);
        
        // Clear boats cache for this dive center
        $this->clearBoatsCache($boat->dive_center_id);
        
        return response()->json($boat);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Boat $boat)
    {
        // Verify boat belongs to user's dive center
        $this->authorizeDiveCenterAccess($boat, 'Unauthorized access to this boat');
        
        $diveCenterId = $boat->dive_center_id;
        $boat->delete();
        
        // Clear boats cache for this dive center
        $this->clearBoatsCache($diveCenterId);
        
        return response()->noContent();
    }

    /**
     * Clear boats cache for a dive center
     */
    private function clearBoatsCache($diveCenterId)
    {
        Cache::forget("boats_{$diveCenterId}_all");
        Cache::forget("boats_{$diveCenterId}_active");
        Cache::forget("boats_{$diveCenterId}_inactive");
    }
}

