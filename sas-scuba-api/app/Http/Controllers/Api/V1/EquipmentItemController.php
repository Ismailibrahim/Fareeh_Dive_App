<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\EquipmentItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentItemController extends Controller
{
    use AuthorizesDiveCenterAccess;
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

        // Add server-side search with optimized query (avoid N+1)
        if ($request->has('search') && !empty($request->get('search'))) {
            $search = $request->get('search');
            // Sanitize search input
            $search = preg_replace('/[^a-zA-Z0-9\s.-]/', '', $search);
            $search = substr($search, 0, 100);
            $search = trim($search);
            
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('serial_no', 'like', "%{$search}%")
                      ->orWhere('size', 'like', "%{$search}%")
                      ->orWhere('inventory_code', 'like', "%{$search}%")
                      ->orWhere('brand', 'like', "%{$search}%")
                      // Use join instead of whereHas to avoid N+1 query
                      ->orWhereExists(function($subQuery) use ($search) {
                          $subQuery->select(DB::raw(1))
                              ->from('equipment')
                              ->whereColumn('equipment.id', 'equipment_items.equipment_id')
                              ->where('equipment.name', 'like', "%{$search}%");
                      });
                });
            }
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
        $user = $request->user();
        
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
    public function show(Request $request, EquipmentItem $equipmentItem)
    {
        // Verify equipment item belongs to user's dive center (via equipment relationship)
        $equipmentItem->load('equipment');
        if (!$equipmentItem->equipment) {
            abort(404, 'Equipment item not found');
        }
        $this->authorizeDiveCenterAccess($equipmentItem->equipment, 'Unauthorized access to this equipment item');
        
        return $equipmentItem->load(['equipment', 'location']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EquipmentItem $equipmentItem)
    {
        // Verify equipment item belongs to user's dive center (via equipment relationship)
        $equipmentItem->load('equipment');
        if (!$equipmentItem->equipment) {
            abort(404, 'Equipment item not found');
        }
        $this->authorizeDiveCenterAccess($equipmentItem->equipment, 'Unauthorized access to this equipment item');
        
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

        // If equipment_id is being changed, verify new equipment belongs to user's dive center
        if (isset($validated['equipment_id']) && $validated['equipment_id'] != $equipmentItem->equipment_id) {
            $newEquipment = \App\Models\Equipment::findOrFail($validated['equipment_id']);
            $this->authorizeDiveCenterAccess($newEquipment, 'Equipment does not belong to your dive center');
        }

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
        // Verify equipment item belongs to user's dive center (via equipment relationship)
        $equipmentItem->load('equipment');
        if (!$equipmentItem->equipment) {
            abort(404, 'Equipment item not found');
        }
        $this->authorizeDiveCenterAccess($equipmentItem->equipment, 'Unauthorized access to this equipment item');
        
        $equipmentItem->delete();
        return response()->noContent();
    }

    /**
     * Find available equipment items by equipment type(s)
     * Used for templates to find available items for each equipment type
     */
    public function findAvailableByEquipmentType(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'equipment_ids' => 'required|array|min:1',
            'equipment_ids.*' => 'required|integer|exists:equipment,id',
            'checkout_date' => 'required|date',
            'return_date' => 'required|date|after:checkout_date',
        ]);

        // Verify all equipment types belong to user's dive center
        $equipmentTypes = \App\Models\Equipment::whereIn('id', $validated['equipment_ids'])
            ->where('dive_center_id', $diveCenterId)
            ->pluck('id')
            ->toArray();

        if (count($equipmentTypes) !== count($validated['equipment_ids'])) {
            return response()->json([
                'message' => 'Some equipment types do not belong to your dive center'
            ], 403);
        }

        $checkoutDate = $validated['checkout_date'];
        $returnDate = $validated['return_date'];
        $availabilityService = new \App\Services\EquipmentAvailabilityService();

        // Get all equipment items for these equipment types that are Available
        $equipmentItems = EquipmentItem::whereIn('equipment_id', $equipmentTypes)
            ->where('status', 'Available')
            ->with(['equipment', 'location'])
            ->get();

        // Group by equipment_id and check availability for each
        $results = [];
        foreach ($equipmentTypes as $equipmentId) {
            $itemsForType = $equipmentItems->where('equipment_id', $equipmentId);
            $availableItems = [];

            foreach ($itemsForType as $item) {
                $isAvailable = $availabilityService->isAvailable(
                    $item->id,
                    $checkoutDate,
                    $returnDate
                );

                if ($isAvailable) {
                    $availableItems[] = $item;
                }
            }

            $equipment = \App\Models\Equipment::find($equipmentId);
            $results[] = [
                'equipment_id' => $equipmentId,
                'equipment_name' => $equipment->name ?? 'Unknown',
                'available_items' => $availableItems,
                'available_count' => count($availableItems),
                'total_items' => $itemsForType->count(),
            ];
        }

        return response()->json([
            'checkout_date' => $checkoutDate,
            'return_date' => $returnDate,
            'results' => $results,
        ]);
    }

    /**
     * Get assignment history for a specific equipment item
     */
    public function assignmentHistory(Request $request, EquipmentItem $equipmentItem)
    {
        // Verify equipment item belongs to user's dive center (via equipment relationship)
        $equipmentItem->load('equipment');
        if (!$equipmentItem->equipment) {
            abort(404, 'Equipment item not found');
        }
        $this->authorizeDiveCenterAccess($equipmentItem->equipment, 'Unauthorized access to this equipment item');

        // Get all booking equipment records for this item
        $assignments = \App\Models\BookingEquipment::where('equipment_item_id', $equipmentItem->id)
            ->with([
                'basket.customer',
                'booking.customer',
                'basket',
                'booking'
            ])
            ->orderBy('checkout_date', 'desc')
            ->get();

        return response()->json([
            'equipment_item' => $equipmentItem->load(['equipment', 'location']),
            'assignments' => $assignments,
            'total_assignments' => $assignments->count(),
            'active_assignments' => $assignments->where('assignment_status', '!=', 'Returned')->count(),
        ]);
    }
}

