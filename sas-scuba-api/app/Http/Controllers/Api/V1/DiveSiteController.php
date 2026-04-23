<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\DiveSite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DiveSiteController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        $perPage = $request->get('per_page', 20);
        $search = $request->get('search');
        $page = $request->get('page', 1);
        
        // Get cache version
        $version = Cache::get("dive_sites_{$diveCenterId}_version", 1);
        
        // Cache key based on parameters and version
        $cacheKey = "dive_sites_{$diveCenterId}_v{$version}_{$perPage}_p{$page}_" . md5($search);
        $shouldCache = empty($search);
        
        if ($shouldCache && $diveCenterId) {
            return Cache::remember($cacheKey, 1800, function () use ($diveCenterId, $perPage) {
                return DiveSite::where('dive_center_id', $diveCenterId)
                    ->orderBy('name')
                    ->paginate($perPage);
            });
        }
        
        $query = DiveSite::query();
        
        if ($diveCenterId) {
            $query->where('dive_center_id', $diveCenterId);
        }
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        return $query->orderBy('name')->paginate($perPage);
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
        
        // Increment cache version to invalidate all paginated results for this dive center
        Cache::increment("dive_sites_{$diveSite->dive_center_id}_version");
        
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
        
        // Increment cache version to invalidate all paginated results for this dive center
        Cache::increment("dive_sites_{$diveSite->dive_center_id}_version");
        
        return response()->json($diveSite);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DiveSite $diveSite)
    {
        // Verify dive site belongs to user's dive center
        $this->authorizeDiveCenterAccess($diveSite, 'Unauthorized access to this dive site');
        
        $diveCenterId = $diveSite->dive_center_id;
        $diveSite->delete();
        
        // Increment cache version to invalidate all paginated results for this dive center
        Cache::increment("dive_sites_{$diveCenterId}_version");
        
        return response()->noContent();
    }
}

