<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EquipmentBasket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EquipmentBasketController extends Controller
{
    /**
     * Display a listing of equipment baskets.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = EquipmentBasket::with(['customer', 'booking', 'bookingEquipment'])
            ->where('dive_center_id', $diveCenterId);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Store a newly created equipment basket.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'center_bucket_no' => 'nullable|string|max:255',
            'expected_return_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        // Validate customer belongs to dive center
        $customer = \App\Models\Customer::where('id', $validated['customer_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate booking belongs to dive center if provided
        if (isset($validated['booking_id'])) {
            $booking = \App\Models\Booking::where('id', $validated['booking_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }

        $basket = EquipmentBasket::create([
            'dive_center_id' => $diveCenterId,
            'customer_id' => $validated['customer_id'],
            'booking_id' => $validated['booking_id'] ?? null,
            'basket_no' => EquipmentBasket::generateBasketNumber($diveCenterId),
            'center_bucket_no' => $validated['center_bucket_no'] ?? null,
            'checkout_date' => now()->toDateString(),
            'expected_return_date' => $validated['expected_return_date'] ?? null,
            'status' => 'Active',
            'notes' => $validated['notes'] ?? null,
        ]);

        $basket->load(['customer', 'booking']);
        return response()->json($basket, 201);
    }

    /**
     * Display the specified equipment basket.
     */
    public function show(Request $request, EquipmentBasket $equipmentBasket)
    {
        $user = $request->user();
        
        // Verify basket belongs to user's dive center
        if ($user->dive_center_id && $equipmentBasket->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Basket not found'], 404);
        }

        // Load relationships - equipmentItem can be null for customer-owned equipment
        $equipmentBasket->load([
            'customer', 
            'booking', 
            'bookingEquipment.equipmentItem.equipment'
        ]);
        
        return response()->json($equipmentBasket);
    }

    /**
     * Update the specified equipment basket.
     */
    public function update(Request $request, EquipmentBasket $equipmentBasket)
    {
        $user = $request->user();
        
        // Verify basket belongs to user's dive center
        if ($user->dive_center_id && $equipmentBasket->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Basket not found'], 404);
        }

        $validated = $request->validate([
            'center_bucket_no' => 'sometimes|nullable|string|max:255',
            'expected_return_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $equipmentBasket->update($validated);
        $equipmentBasket->load(['customer', 'booking', 'bookingEquipment']);

        return response()->json($equipmentBasket);
    }

    /**
     * Return the equipment basket.
     */
    public function returnBasket(Request $request, EquipmentBasket $equipmentBasket)
    {
        $user = $request->user();
        
        // Verify basket belongs to user's dive center
        if ($user->dive_center_id && $equipmentBasket->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Basket not found'], 404);
        }

        $validated = $request->validate([
            'equipment_ids' => 'sometimes|array',
            'equipment_ids.*' => 'integer|exists:booking_equipment,id',
            'damage_info' => 'sometimes|array',
            'damage_info.*.damage_reported' => 'sometimes|boolean',
            'damage_info.*.damage_description' => 'nullable|string',
            'damage_info.*.damage_cost' => 'nullable|numeric|min:0',
            'damage_info.*.charge_customer' => 'sometimes|boolean',
            'damage_info.*.damage_charge_amount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $equipmentIds = $validated['equipment_ids'] ?? null;
            $damageInfo = $validated['damage_info'] ?? [];
            
            // Get equipment to return
            $equipmentToReturn = $equipmentBasket->bookingEquipment;
            if ($equipmentIds) {
                // Only return selected equipment
                $equipmentToReturn = $equipmentBasket->bookingEquipment()
                    ->whereIn('id', $equipmentIds)
                    ->get();
            }

            // Update equipment items
            foreach ($equipmentToReturn as $equipment) {
                $updateData = [
                    'assignment_status' => 'Returned',
                    'actual_return_date' => now()->toDateString(),
                ];

                // Add damage info if provided for this equipment
                if (isset($damageInfo[$equipment->id])) {
                    $damage = $damageInfo[$equipment->id];
                    if (isset($damage['damage_reported'])) {
                        $updateData['damage_reported'] = $damage['damage_reported'];
                    }
                    if (isset($damage['damage_description'])) {
                        $updateData['damage_description'] = $damage['damage_description'];
                    }
                    if (isset($damage['damage_cost'])) {
                        $updateData['damage_cost'] = $damage['damage_cost'];
                    }
                    if (isset($damage['charge_customer'])) {
                        $updateData['charge_customer'] = $damage['charge_customer'];
                    }
                    if (isset($damage['damage_charge_amount'])) {
                        $updateData['damage_charge_amount'] = $damage['damage_charge_amount'];
                    }
                }

                $equipment->update($updateData);
                
                // Refresh the model to get updated damage_reported value
                $equipment->refresh();

                // Update equipment item status based on damage
                if ($equipment->equipment_source === 'Center' && $equipment->equipment_item_id) {
                    $equipmentItem = \App\Models\EquipmentItem::find($equipment->equipment_item_id);
                    if ($equipmentItem) {
                        $damageReported = $equipment->damage_reported ?? false;
                        if ($damageReported) {
                            $equipmentItem->update(['status' => 'Maintenance']);
                        } else {
                            $equipmentItem->update(['status' => 'Available']);
                        }
                    }
                }
            }

            // Check if all equipment in basket is returned
            $allReturned = $equipmentBasket->bookingEquipment()
                ->where('assignment_status', '!=', 'Returned')
                ->count() === 0;

            // Update basket status if all equipment is returned
            if ($allReturned) {
                $equipmentBasket->update([
                    'status' => 'Returned',
                    'actual_return_date' => now()->toDateString(),
                ]);
            }

            DB::commit();

            $equipmentBasket->load(['customer', 'booking', 'bookingEquipment.equipmentItem.equipment']);
            return response()->json($equipmentBasket);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to return basket',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

