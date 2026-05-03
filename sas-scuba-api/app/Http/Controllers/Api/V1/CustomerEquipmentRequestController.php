<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\EquipmentBasket;
use App\Models\BookingEquipment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CustomerEquipmentRequestController extends Controller
{
    /**
     * Get the current active equipment request (basket) for the customer.
     */
    public function show(Request $request, Customer $customer): JsonResponse
    {
        if ($customer->dive_center_id !== $request->user()->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $basket = EquipmentBasket::with('bookingEquipment')
            ->where('customer_id', $customer->id)
            ->where('status', 'Active')
            ->whereNull('booking_id') // Specifically look for requests not yet attached to a booking
            ->latest()
            ->first();

        return response()->json(['data' => $basket]);
    }

    /**
     * Create or update the equipment request (basket) for the customer.
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        if ($customer->dive_center_id !== $request->user()->dive_center_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'expected_return_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'present|array',
            'items.*.equipment_type_name' => 'required|string',
            'items.*.rent' => 'required|boolean',
            'items.*.own' => 'required|boolean',
            'items.*.note' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Find or create an active basket not attached to a booking
            $basket = EquipmentBasket::where('customer_id', $customer->id)
                ->where('status', 'Active')
                ->whereNull('booking_id')
                ->latest()
                ->first();

            if (!$basket) {
                $basket = EquipmentBasket::create([
                    'dive_center_id' => $customer->dive_center_id,
                    'customer_id' => $customer->id,
                    'basket_no' => EquipmentBasket::generateBasketNumber($customer->dive_center_id),
                    'status' => 'Active',
                    'expected_return_date' => $validated['expected_return_date'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);
            } else {
                $basket->update([
                    'expected_return_date' => $validated['expected_return_date'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);
            }

            // Clear existing unassigned items in this basket to replace them
            // We only delete items that haven't been processed yet (equipment_item_id is null)
            // Actually, since this is a pure request basket, all items should be unprocessed.
            BookingEquipment::where('basket_id', $basket->id)->delete();

            $newItems = [];
            foreach ($validated['items'] as $item) {
                if ($item['rent'] || $item['own']) {
                    $newItems[] = [
                        'booking_id' => null, // Attached when basket is assigned to a booking later
                        'basket_id' => $basket->id,
                        'equipment_item_id' => null, // Not yet assigned a specific physical item
                        'equipment_source' => $item['rent'] ? 'Center' : 'Customer Own',
                        'customer_equipment_type' => $item['equipment_type_name'],
                        'customer_equipment_notes' => $item['note'],
                        'assignment_status' => 'Pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            if (!empty($newItems)) {
                BookingEquipment::insert($newItems);
            }

            DB::commit();

            return response()->json([
                'message' => 'Equipment request saved successfully',
                'data' => $basket->load('bookingEquipment')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save equipment request', 'error' => $e->getMessage()], 500);
        }
    }
}
