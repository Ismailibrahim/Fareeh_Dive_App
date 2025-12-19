<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EquipmentItem;
use App\Models\EquipmentServiceHistory;
use Illuminate\Http\Request;

class EquipmentServiceHistoryController extends Controller
{
    /**
     * Display a listing of service history for an equipment item.
     */
    public function index(Request $request, $equipmentItemId)
    {
        $equipmentItem = EquipmentItem::findOrFail($equipmentItemId);
        
        $query = EquipmentServiceHistory::where('equipment_item_id', $equipmentItemId)
            ->with('equipmentItem');

        return $query->latest('service_date')->paginate(20);
    }

    /**
     * Store a newly created service record.
     */
    public function store(Request $request, $equipmentItemId)
    {
        $equipmentItem = EquipmentItem::findOrFail($equipmentItemId);

        $validated = $request->validate([
            'service_date' => 'required|date',
            'service_type' => 'nullable|string|max:255',
            'technician' => 'nullable|string|max:255',
            'service_provider' => 'nullable|string|max:255',
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'parts_replaced' => 'nullable|string',
            'warranty_info' => 'nullable|string',
            'next_service_due_date' => 'nullable|date',
        ]);

        // Auto-calculate next_service_due_date if not provided
        if (!isset($validated['next_service_due_date']) && 
            $equipmentItem->requires_service && 
            $equipmentItem->service_interval_days) {
            
            $validated['next_service_due_date'] = \Carbon\Carbon::parse($validated['service_date'])
                ->addDays($equipmentItem->service_interval_days)
                ->format('Y-m-d');
        }

        $serviceHistory = EquipmentServiceHistory::create([
            ...$validated,
            'equipment_item_id' => $equipmentItemId,
        ]);

        // Update equipment item's last_service_date and next_service_date
        $equipmentItem->last_service_date = $validated['service_date'];
        $equipmentItem->next_service_date = $validated['next_service_due_date'] ?? 
            ($equipmentItem->service_interval_days 
                ? \Carbon\Carbon::parse($validated['service_date'])
                    ->addDays($equipmentItem->service_interval_days)
                    ->format('Y-m-d')
                : null);
        $equipmentItem->save();

        return response()->json($serviceHistory->load('equipmentItem'), 201);
    }

    /**
     * Display the specified service record.
     */
    public function show($equipmentItemId, $id)
    {
        $serviceHistory = EquipmentServiceHistory::where('equipment_item_id', $equipmentItemId)
            ->findOrFail($id);
        
        return $serviceHistory->load('equipmentItem');
    }

    /**
     * Update the specified service record.
     */
    public function update(Request $request, $equipmentItemId, $id)
    {
        $serviceHistory = EquipmentServiceHistory::where('equipment_item_id', $equipmentItemId)
            ->findOrFail($id);

        $validated = $request->validate([
            'service_date' => 'sometimes|date',
            'service_type' => 'nullable|string|max:255',
            'technician' => 'nullable|string|max:255',
            'service_provider' => 'nullable|string|max:255',
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'parts_replaced' => 'nullable|string',
            'warranty_info' => 'nullable|string',
            'next_service_due_date' => 'nullable|date',
        ]);

        // Auto-calculate next_service_due_date if service_date changed and not manually provided
        if (isset($validated['service_date']) && 
            !isset($validated['next_service_due_date']) && 
            $serviceHistory->equipmentItem->requires_service && 
            $serviceHistory->equipmentItem->service_interval_days) {
            
            $validated['next_service_due_date'] = \Carbon\Carbon::parse($validated['service_date'])
                ->addDays($serviceHistory->equipmentItem->service_interval_days)
                ->format('Y-m-d');
        }

        $serviceHistory->update($validated);

        // Update equipment item's last_service_date if this is the most recent service
        $equipmentItem = $serviceHistory->equipmentItem;
        $mostRecentService = EquipmentServiceHistory::where('equipment_item_id', $equipmentItemId)
            ->latest('service_date')
            ->first();
        
        if ($mostRecentService && $mostRecentService->id === $serviceHistory->id) {
            $equipmentItem->last_service_date = $serviceHistory->service_date;
            $equipmentItem->next_service_date = $serviceHistory->next_service_due_date ?? 
                ($equipmentItem->service_interval_days 
                    ? \Carbon\Carbon::parse($serviceHistory->service_date)
                        ->addDays($equipmentItem->service_interval_days)
                        ->format('Y-m-d')
                    : null);
            $equipmentItem->save();
        }

        return response()->json($serviceHistory->load('equipmentItem'));
    }

    /**
     * Remove the specified service record.
     */
    public function destroy($equipmentItemId, $id)
    {
        $serviceHistory = EquipmentServiceHistory::where('equipment_item_id', $equipmentItemId)
            ->findOrFail($id);
        
        $serviceHistory->delete();

        // Update equipment item's last_service_date if this was the most recent service
        $equipmentItem = $serviceHistory->equipmentItem;
        $mostRecentService = EquipmentServiceHistory::where('equipment_item_id', $equipmentItemId)
            ->latest('service_date')
            ->first();
        
        if ($mostRecentService) {
            $equipmentItem->last_service_date = $mostRecentService->service_date;
            $equipmentItem->next_service_date = $mostRecentService->next_service_due_date ?? 
                ($equipmentItem->service_interval_days 
                    ? \Carbon\Carbon::parse($mostRecentService->service_date)
                        ->addDays($equipmentItem->service_interval_days)
                        ->format('Y-m-d')
                    : null);
        } else {
            $equipmentItem->last_service_date = null;
            $equipmentItem->next_service_date = null;
        }
        $equipmentItem->save();

        return response()->noContent();
    }

    /**
     * Store service records for multiple equipment items at once.
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'equipment_item_ids' => 'required|array|min:1',
            'equipment_item_ids.*' => 'required|integer|exists:equipment_items,id',
            'service_date' => 'required|date',
            'service_type' => 'nullable|string|max:255',
            'technician' => 'nullable|string|max:255',
            'service_provider' => 'nullable|string|max:255',
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'next_service_due_date' => 'nullable|date',
        ]);

        $equipmentItemIds = $validated['equipment_item_ids'];
        $serviceData = [
            'service_date' => $validated['service_date'],
            'service_type' => $validated['service_type'] ?? null,
            'technician' => $validated['technician'] ?? null,
            'service_provider' => $validated['service_provider'] ?? null,
            'cost' => $validated['cost'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'next_service_due_date' => $validated['next_service_due_date'] ?? null,
        ];

        $createdRecords = [];
        $errors = [];

        \DB::beginTransaction();
        try {
            foreach ($equipmentItemIds as $equipmentItemId) {
                try {
                    $equipmentItem = EquipmentItem::findOrFail($equipmentItemId);

                    // Auto-calculate next_service_due_date if not provided
                    $nextServiceDueDate = $serviceData['next_service_due_date'];
                    if (!$nextServiceDueDate && 
                        $equipmentItem->requires_service && 
                        $equipmentItem->service_interval_days) {
                        
                        $nextServiceDueDate = \Carbon\Carbon::parse($serviceData['service_date'])
                            ->addDays($equipmentItem->service_interval_days)
                            ->format('Y-m-d');
                    }

                    // Create service history record
                    $serviceHistory = EquipmentServiceHistory::create([
                        ...$serviceData,
                        'equipment_item_id' => $equipmentItemId,
                        'next_service_due_date' => $nextServiceDueDate,
                    ]);

                    // Update equipment item's last_service_date and next_service_date
                    $equipmentItem->last_service_date = $serviceData['service_date'];
                    $equipmentItem->next_service_date = $nextServiceDueDate ?? 
                        ($equipmentItem->service_interval_days 
                            ? \Carbon\Carbon::parse($serviceData['service_date'])
                                ->addDays($equipmentItem->service_interval_days)
                                ->format('Y-m-d')
                            : null);
                    $equipmentItem->save();

                    $createdRecords[] = $serviceHistory->load('equipmentItem');
                } catch (\Exception $e) {
                    $errors[] = [
                        'equipment_item_id' => $equipmentItemId,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($createdRecords) . ' service record(s) created successfully',
                'created_count' => count($createdRecords),
                'records' => $createdRecords,
                'errors' => $errors,
            ], 201);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service records',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

