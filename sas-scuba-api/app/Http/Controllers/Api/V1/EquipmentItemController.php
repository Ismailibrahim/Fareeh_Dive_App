<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EquipmentItem;
use Illuminate\Http\Request;

class EquipmentItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = EquipmentItem::query()->with(['equipment', 'location']);

        // Filter by equipment_id if provided
        if ($request->has('equipment_id')) {
            $query->where('equipment_id', $request->equipment_id);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Add server-side search
        if ($request->has('search') && !empty($request->get('search'))) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('serial_no', 'like', "%{$search}%")
                  ->orWhere('size', 'like', "%{$search}%")
                  ->orWhere('inventory_code', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function($equipmentQuery) use ($search) {
                      $equipmentQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Get pagination parameters
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100); // Limit between 1 and 100

        return $query->latest()->paginate($perPage);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipment,id',
            'location_id' => 'nullable|exists:locations,id',
            'size' => 'nullable|string|max:255',
            'serial_no' => 'nullable|string|max:255',
            'inventory_code' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'image_url' => 'nullable|string|url|max:500',
            'status' => 'required|in:Available,Rented,Maintenance',
            'purchase_date' => 'nullable|date',
            'requires_service' => 'nullable|boolean',
            'service_interval_days' => 'nullable|integer|min:1',
            'last_service_date' => 'nullable|date',
            'next_service_date' => 'nullable|date',
        ]);

        // Auto-calculate next_service_date if not provided and conditions are met
        if (!isset($validated['next_service_date']) && 
            isset($validated['requires_service']) && 
            $validated['requires_service'] && 
            isset($validated['service_interval_days']) && 
            $validated['service_interval_days'] > 0) {
            
            $baseDate = $validated['last_service_date'] ?? $validated['purchase_date'] ?? null;
            if ($baseDate) {
                $validated['next_service_date'] = \Carbon\Carbon::parse($baseDate)
                    ->addDays($validated['service_interval_days'])
                    ->format('Y-m-d');
            }
        }

        $equipmentItem = EquipmentItem::create($validated);
        return response()->json($equipmentItem->load(['equipment', 'location']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(EquipmentItem $equipmentItem)
    {
        return $equipmentItem->load(['equipment', 'location']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EquipmentItem $equipmentItem)
    {
        $validated = $request->validate([
            'equipment_id' => 'sometimes|exists:equipment,id',
            'location_id' => 'nullable|exists:locations,id',
            'size' => 'nullable|string|max:255',
            'serial_no' => 'nullable|string|max:255',
            'inventory_code' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'image_url' => 'nullable|string|url|max:500',
            'status' => 'sometimes|in:Available,Rented,Maintenance',
            'purchase_date' => 'nullable|date',
            'requires_service' => 'nullable|boolean',
            'service_interval_days' => 'nullable|integer|min:1',
            'last_service_date' => 'nullable|date',
            'next_service_date' => 'nullable|date',
        ]);

        // Auto-calculate next_service_date if not provided and conditions are met
        if (!isset($validated['next_service_date']) && 
            ($request->has('requires_service') || $request->has('service_interval_days') || $request->has('last_service_date') || $request->has('purchase_date'))) {
            
            $requiresService = $validated['requires_service'] ?? $equipmentItem->requires_service;
            $serviceInterval = $validated['service_interval_days'] ?? $equipmentItem->service_interval_days;
            
            if ($requiresService && $serviceInterval && $serviceInterval > 0) {
                $baseDate = $validated['last_service_date'] ?? $equipmentItem->last_service_date 
                         ?? $validated['purchase_date'] ?? $equipmentItem->purchase_date;
                
                if ($baseDate) {
                    $validated['next_service_date'] = \Carbon\Carbon::parse($baseDate)
                        ->addDays($serviceInterval)
                        ->format('Y-m-d');
                }
            }
        }

        $equipmentItem->update($validated);
        return response()->json($equipmentItem->load(['equipment', 'location']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EquipmentItem $equipmentItem)
    {
        $equipmentItem->delete();
        return response()->noContent();
    }
}

