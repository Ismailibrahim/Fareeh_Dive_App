<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\EquipmentType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class EquipmentTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $diveCenterId = $request->user()->dive_center_id;

        $types = EquipmentType::where('dive_center_id', $diveCenterId)
            ->when($request->has('active'), function ($query) use ($request) {
                $query->where('active', $request->boolean('active'));
            })
            ->orderBy('name')
            ->get();

        return response()->json($types);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $diveCenterId = $request->user()->dive_center_id;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('equipment_types')->where(fn ($query) => $query->where('dive_center_id', $diveCenterId)),
            ],
            'active' => 'boolean',
        ]);

        $validated['dive_center_id'] = $diveCenterId;

        $type = EquipmentType::create($validated);

        return response()->json($type, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, EquipmentType $equipmentType): JsonResponse
    {
        if ($equipmentType->dive_center_id !== $request->user()->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['data' => $equipmentType]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EquipmentType $equipmentType): JsonResponse
    {
        if ($equipmentType->dive_center_id !== $request->user()->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('equipment_types')
                    ->where(fn ($query) => $query->where('dive_center_id', $equipmentType->dive_center_id))
                    ->ignore($equipmentType->id),
            ],
            'active' => 'boolean',
        ]);

        $equipmentType->update($validated);

        return response()->json(['data' => $equipmentType]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, EquipmentType $equipmentType): JsonResponse
    {
        if ($equipmentType->dive_center_id !== $request->user()->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $equipmentType->delete();

        return response()->json(null, 204);
    }
}
