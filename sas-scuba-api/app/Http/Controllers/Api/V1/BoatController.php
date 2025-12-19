<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Boat;
use Illuminate\Http\Request;

class BoatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Boat::query();

        if ($user->dive_center_id) {
            $query->where('dive_center_id', $user->dive_center_id);
        }

        // Filter by active status if provided
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
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
            'dive_center_id' => 'required|exists:dive_centers,id',
        ]);

        $boat = Boat::create($validated);
        return response()->json($boat, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Boat $boat)
    {
        return $boat;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Boat $boat)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'active' => 'boolean',
        ]);

        $boat->update($validated);
        return response()->json($boat);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Boat $boat)
    {
        $boat->delete();
        return response()->noContent();
    }
}

