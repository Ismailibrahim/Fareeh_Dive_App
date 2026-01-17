<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BookingEquipment;
use App\Services\EquipmentAvailabilityService;
use Illuminate\Http\Request;

class BookingEquipmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Use joins instead of whereHas to avoid N+1 queries
        $query = BookingEquipment::with(['booking.customer', 'equipmentItem.equipment', 'basket'])
            ->leftJoin('bookings', 'booking_equipment.booking_id', '=', 'bookings.id')
            ->leftJoin('equipment_baskets', 'booking_equipment.basket_id', '=', 'equipment_baskets.id')
            ->where(function($q) use ($user) {
                $q->where('bookings.dive_center_id', $user->dive_center_id)
                  ->orWhere('equipment_baskets.dive_center_id', $user->dive_center_id);
            })
            ->select('booking_equipment.*')
            ->distinct();

        // Get pagination parameters
        $perPage = $request->get('per_page', 20);
        $perPage = min(max($perPage, 1), 100); // Limit between 1 and 100

        return $query->orderBy('booking_equipment.created_at', 'desc')->paginate($perPage);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'booking_id' => 'nullable|exists:bookings,id',
            'basket_id' => 'nullable|exists:equipment_baskets,id',
            'equipment_item_id' => 'nullable|exists:equipment_items,id',
            'price' => 'nullable|numeric|min:0',
            'equipment_source' => 'nullable|in:Center,Customer Own',
            'checkout_date' => 'nullable|date',
            'return_date' => 'nullable|date|after_or_equal:checkout_date',
            'customer_equipment_type' => 'nullable|string|max:255',
            'customer_equipment_brand' => 'nullable|string|max:255',
            'customer_equipment_model' => 'nullable|string|max:255',
            'customer_equipment_serial' => 'nullable|string|max:255',
            'customer_equipment_notes' => 'nullable|string',
        ]);

        // Validate that either booking_id or basket_id is provided
        if (empty($validated['booking_id']) && empty($validated['basket_id'])) {
            return response()->json([
                'message' => 'Either booking_id or basket_id must be provided'
            ], 422);
        }

        // Validate that either equipment_item_id is provided (for Center equipment)
        // Customer Own equipment: all fields are optional (type, brand, model, serial, notes)
        $equipmentSource = $validated['equipment_source'] ?? 'Center';
        if ($equipmentSource === 'Center' && empty($validated['equipment_item_id'])) {
            return response()->json([
                'message' => 'equipment_item_id is required for center equipment'
            ], 422);
        }
        // Customer Own equipment: no validation required - all fields are optional

        // If basket_id is provided, verify it belongs to the user's dive center
        if (!empty($validated['basket_id'])) {
            $basket = \App\Models\EquipmentBasket::where('id', $validated['basket_id'])
                ->where('dive_center_id', $diveCenterId)
                ->first();
            
            if (!$basket) {
                return response()->json([
                    'message' => 'Basket not found or does not belong to your dive center'
                ], 404);
            }

            // If booking_id is not provided but basket has a booking, use it
            if (empty($validated['booking_id']) && $basket->booking_id) {
                $validated['booking_id'] = $basket->booking_id;
            }
        }

        // If booking_id is provided, verify it belongs to the user's dive center
        if (!empty($validated['booking_id'])) {
            $booking = \App\Models\Booking::where('id', $validated['booking_id'])
                ->where('dive_center_id', $diveCenterId)
                ->first();
            
            if (!$booking) {
                return response()->json([
                    'message' => 'Booking not found or does not belong to your dive center'
                ], 404);
            }
        }

        // Set default values for new fields
        $data = array_merge([
            'price' => $validated['price'] ?? 0,
            'equipment_source' => $validated['equipment_source'] ?? 'Center',
            'assignment_status' => 'Pending',
        ], $validated);

        // If equipment_source is 'Customer Own', equipment_item_id should be null
        if ($data['equipment_source'] === 'Customer Own') {
            $data['equipment_item_id'] = null;
        }

        // Check availability for Center equipment before creating the record
        if ($data['equipment_source'] === 'Center' && !empty($data['equipment_item_id'])) {
            // Determine checkout_date (use provided or today)
            $checkoutDate = $data['checkout_date'] ?? now()->toDateString();
            
            // Determine return_date (use provided or checkout_date + 1 day)
            $returnDate = $data['return_date'] ?? \Carbon\Carbon::parse($checkoutDate)->addDay()->toDateString();
            
            // Update data with defaults if they were missing
            if (empty($data['checkout_date'])) {
                $data['checkout_date'] = $checkoutDate;
            }
            if (empty($data['return_date'])) {
                $data['return_date'] = $returnDate;
            }
            
            // Check availability using EquipmentAvailabilityService
            $availabilityService = new EquipmentAvailabilityService();
            $isAvailable = $availabilityService->isAvailable(
                $data['equipment_item_id'],
                $checkoutDate,
                $returnDate
            );
            
            if (!$isAvailable) {
                // Get conflicting assignments for detailed error message
                $conflicts = $availabilityService->getConflicts(
                    $data['equipment_item_id'],
                    $checkoutDate,
                    $returnDate
                );
                
                // Format conflicts for response
                $conflictDetails = $conflicts->map(function ($conflict) {
                    $customerName = 'Unknown';
                    $basketNo = null;
                    
                    if ($conflict->basket && $conflict->basket->customer) {
                        $customerName = $conflict->basket->customer->full_name ?? 'Unknown';
                        $basketNo = $conflict->basket->basket_no;
                    } elseif ($conflict->booking && $conflict->booking->customer) {
                        $customerName = $conflict->booking->customer->full_name ?? 'Unknown';
                    }
                    
                    return [
                        'id' => $conflict->id,
                        'customer_name' => $customerName,
                        'checkout_date' => $conflict->checkout_date ? $conflict->checkout_date->format('Y-m-d') : null,
                        'return_date' => $conflict->return_date ? $conflict->return_date->format('Y-m-d') : null,
                        'basket_no' => $basketNo,
                        'assignment_status' => $conflict->assignment_status,
                    ];
                });
                
                return response()->json([
                    'message' => 'Equipment is not available for the requested dates',
                    'equipment_item_id' => $data['equipment_item_id'],
                    'checkout_date' => $checkoutDate,
                    'return_date' => $returnDate,
                    'conflicting_assignments' => $conflictDetails,
                ], 422);
            }
        }

        try {
            $bookingEquipment = BookingEquipment::create($data);
            
            // Update equipment item status to 'Rented' when checked out (if Center equipment)
            if ($bookingEquipment->equipment_source === 'Center' && 
                $bookingEquipment->equipment_item_id && 
                $bookingEquipment->assignment_status === 'Checked Out') {
                $equipmentItem = \App\Models\EquipmentItem::find($bookingEquipment->equipment_item_id);
                if ($equipmentItem) {
                    $equipmentItem->update(['status' => 'Rented']);
                }
            }
            
            // Load relationships safely
            $loadRelations = [];
            if ($bookingEquipment->booking_id) {
                $loadRelations[] = 'booking.customer';
            }
            if ($bookingEquipment->equipment_item_id) {
                $loadRelations[] = 'equipmentItem.equipment';
            }
            if ($bookingEquipment->basket_id) {
                $loadRelations[] = 'basket';
            }
            
            if (!empty($loadRelations)) {
                $bookingEquipment->load($loadRelations);
            }
            
            return response()->json($bookingEquipment, 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error creating booking equipment: ' . $e->getMessage(), [
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to create booking equipment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, BookingEquipment $bookingEquipment)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        // Eager load relationships upfront for better performance
        $bookingEquipment->load(['booking', 'basket']);

        // Verify equipment belongs to user's dive center
        if ($diveCenterId) {
            $belongsToDiveCenter = false;
            if ($bookingEquipment->booking && $bookingEquipment->booking->dive_center_id === $diveCenterId) {
                $belongsToDiveCenter = true;
            } elseif ($bookingEquipment->basket && $bookingEquipment->basket->dive_center_id === $diveCenterId) {
                $belongsToDiveCenter = true;
            }
            
            if (!$belongsToDiveCenter) {
                return response()->json(['message' => 'Equipment not found'], 404);
            }
        }

        // Load remaining relationships
        $bookingEquipment->load(['booking.customer', 'equipmentItem.equipment']);
        return response()->json($bookingEquipment);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BookingEquipment $bookingEquipment)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        // Verify equipment belongs to user's dive center
        // Check via booking if exists, otherwise check via basket
        if ($diveCenterId) {
            $bookingEquipment->load(['booking', 'basket']);
            
            $belongsToDiveCenter = false;
            if ($bookingEquipment->booking && $bookingEquipment->booking->dive_center_id === $diveCenterId) {
                $belongsToDiveCenter = true;
            } elseif ($bookingEquipment->basket && $bookingEquipment->basket->dive_center_id === $diveCenterId) {
                $belongsToDiveCenter = true;
            }
            
            if (!$belongsToDiveCenter) {
                return response()->json(['message' => 'Equipment not found'], 404);
            }
        }

        // Convert empty strings to null for nullable fields
        $requestData = $request->all();
        $nullableFields = ['booking_id', 'basket_id', 'equipment_item_id', 'checkout_date', 'return_date', 
                          'actual_return_date', 'customer_equipment_type', 'customer_equipment_brand', 
                          'customer_equipment_model', 'customer_equipment_serial', 'customer_equipment_notes',
                          'damage_description', 'damage_cost', 'damage_charge_amount'];
        
        foreach ($nullableFields as $field) {
            if (isset($requestData[$field]) && $requestData[$field] === '') {
                $requestData[$field] = null;
            }
        }
        
        // Merge back into request
        $request->merge($requestData);

        $validated = $request->validate([
            'booking_id' => 'sometimes|nullable|integer|exists:bookings,id',
            'basket_id' => 'sometimes|nullable|integer|exists:equipment_baskets,id',
            'equipment_item_id' => 'sometimes|nullable|integer|exists:equipment_items,id',
            'price' => 'sometimes|nullable|numeric|min:0',
            'equipment_source' => 'sometimes|in:Center,Customer Own',
            'checkout_date' => 'sometimes|nullable|date',
            'return_date' => 'sometimes|nullable|date|after_or_equal:checkout_date',
            'actual_return_date' => 'sometimes|nullable|date',
            'customer_equipment_type' => 'sometimes|nullable|string|max:255',
            'customer_equipment_brand' => 'sometimes|nullable|string|max:255',
            'customer_equipment_model' => 'sometimes|nullable|string|max:255',
            'customer_equipment_serial' => 'sometimes|nullable|string|max:255',
            'customer_equipment_notes' => 'sometimes|nullable|string',
            'assignment_status' => 'sometimes|in:Pending,Checked Out,Returned,Lost',
            'damage_reported' => 'sometimes|boolean',
            'damage_description' => 'sometimes|nullable|string',
            'damage_cost' => 'sometimes|nullable|numeric|min:0',
            'charge_customer' => 'sometimes|boolean',
            'damage_charge_amount' => 'sometimes|nullable|numeric|min:0',
        ]);

        // Validate that either booking_id or basket_id is provided (if updating these fields)
        if (isset($validated['booking_id']) && isset($validated['basket_id']) && 
            empty($validated['booking_id']) && empty($validated['basket_id'])) {
            return response()->json([
                'message' => 'Either booking_id or basket_id must be provided'
            ], 422);
        }

        // If basket_id is provided, verify it belongs to the user's dive center
        if (!empty($validated['basket_id'])) {
            $basket = \App\Models\EquipmentBasket::where('id', $validated['basket_id'])
                ->where('dive_center_id', $diveCenterId)
                ->first();
            
            if (!$basket) {
                return response()->json([
                    'message' => 'Basket not found or does not belong to your dive center'
                ], 404);
            }
        }

        // If booking_id is provided, verify it belongs to the user's dive center
        if (!empty($validated['booking_id'])) {
            $booking = \App\Models\Booking::where('id', $validated['booking_id'])
                ->where('dive_center_id', $diveCenterId)
                ->first();
            
            if (!$booking) {
                return response()->json([
                    'message' => 'Booking not found or does not belong to your dive center'
                ], 404);
            }
        }

        // If equipment_source is 'Customer Own', equipment_item_id should be null
        if (isset($validated['equipment_source']) && $validated['equipment_source'] === 'Customer Own') {
            $validated['equipment_item_id'] = null;
        }
        
        // If equipment_source is 'Center' and equipment_item_id is null, don't update equipment_item_id
        // (keep existing value)
        if (isset($validated['equipment_source']) && $validated['equipment_source'] === 'Center' && 
            !isset($validated['equipment_item_id'])) {
            // Don't change equipment_item_id if not provided
            unset($validated['equipment_item_id']);
        }

        try {
            $bookingEquipment->update($validated);
            
            // Update equipment item status based on assignment_status
            if ($bookingEquipment->equipment_source === 'Center' && $bookingEquipment->equipment_item_id) {
                $equipmentItem = \App\Models\EquipmentItem::find($bookingEquipment->equipment_item_id);
                if ($equipmentItem) {
                    if (isset($validated['assignment_status'])) {
                        if ($validated['assignment_status'] === 'Checked Out') {
                            $equipmentItem->update(['status' => 'Rented']);
                        } elseif ($validated['assignment_status'] === 'Returned') {
                            // Check if damage was reported
                            if ($bookingEquipment->damage_reported) {
                                $equipmentItem->update(['status' => 'Maintenance']);
                            } else {
                                $equipmentItem->update(['status' => 'Available']);
                            }
                        }
                    }
                }
            }
            
            // Eager load relationships upfront instead of using load() after update
            $relations = [];
            if ($bookingEquipment->booking_id) {
                $relations[] = 'booking.customer';
            }
            if ($bookingEquipment->equipment_item_id) {
                $relations[] = 'equipmentItem.equipment';
            }
            if ($bookingEquipment->basket_id) {
                $relations[] = 'basket';
            }
            
            if (!empty($relations)) {
                $bookingEquipment->load($relations);
            }
            
            return response()->json($bookingEquipment);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error updating booking equipment: ' . $e->getMessage(), [
                'id' => $bookingEquipment->id,
                'data' => $validated,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to update booking equipment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, BookingEquipment $bookingEquipment)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        // Verify equipment belongs to user's dive center
        if ($diveCenterId) {
            $bookingEquipment->load('booking');
            if ($bookingEquipment->booking && $bookingEquipment->booking->dive_center_id !== $diveCenterId) {
                return response()->json(['message' => 'Equipment not found'], 404);
            }
        }

        $bookingEquipment->delete();
        return response()->noContent();
    }

    /**
     * Check equipment availability for date range
     */
    public function checkAvailability(Request $request)
    {
        $validated = $request->validate([
            'equipment_item_id' => 'required|exists:equipment_items,id',
            'checkout_date' => 'required|date',
            'return_date' => 'required|date|after:checkout_date',
        ]);

        $availabilityService = new EquipmentAvailabilityService();
        $isAvailable = $availabilityService->isAvailable(
            $validated['equipment_item_id'],
            $validated['checkout_date'],
            $validated['return_date']
        );

        $conflicts = [];
        if (!$isAvailable) {
            $conflicts = $availabilityService->getConflicts(
                $validated['equipment_item_id'],
                $validated['checkout_date'],
                $validated['return_date']
            )->map(function ($item) {
                return [
                    'id' => $item->id,
                    'customer_name' => $item->basket->customer->full_name ?? 'Unknown',
                    'checkout_date' => $item->checkout_date,
                    'return_date' => $item->return_date,
                ];
            });
        }

        return response()->json([
            'available' => $isAvailable,
            'conflicting_assignments' => $conflicts,
        ]);
    }

    /**
     * Return equipment item
     */
    public function returnEquipment(Request $request, BookingEquipment $bookingEquipment)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        // Verify equipment belongs to user's dive center
        if ($diveCenterId) {
            $bookingEquipment->load(['booking', 'basket']);
            
            $belongsToDiveCenter = false;
            if ($bookingEquipment->booking && $bookingEquipment->booking->dive_center_id === $diveCenterId) {
                $belongsToDiveCenter = true;
            } elseif ($bookingEquipment->basket && $bookingEquipment->basket->dive_center_id === $diveCenterId) {
                $belongsToDiveCenter = true;
            }
            
            if (!$belongsToDiveCenter) {
                return response()->json(['message' => 'Equipment not found'], 404);
            }
        }

        $validated = $request->validate([
            'damage_reported' => 'sometimes|boolean',
            'damage_description' => 'nullable|string',
            'damage_cost' => 'nullable|numeric|min:0',
            'charge_customer' => 'sometimes|boolean',
            'damage_charge_amount' => 'nullable|numeric|min:0',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $updateData = [
                'assignment_status' => 'Returned',
                'actual_return_date' => now()->toDateString(),
            ];

            // Add damage fields if provided
            if (isset($validated['damage_reported'])) {
                $updateData['damage_reported'] = $validated['damage_reported'];
            }
            if (isset($validated['damage_description'])) {
                $updateData['damage_description'] = $validated['damage_description'];
            }
            if (isset($validated['damage_cost'])) {
                $updateData['damage_cost'] = $validated['damage_cost'];
            }
            if (isset($validated['charge_customer'])) {
                $updateData['charge_customer'] = $validated['charge_customer'];
            }
            if (isset($validated['damage_charge_amount'])) {
                $updateData['damage_charge_amount'] = $validated['damage_charge_amount'];
            }

            $bookingEquipment->update($updateData);
            
            // Refresh the model to get updated damage_reported value
            $bookingEquipment->refresh();

            // Update equipment item status based on damage
            if ($bookingEquipment->equipment_source === 'Center' && $bookingEquipment->equipment_item_id) {
                $equipmentItem = \App\Models\EquipmentItem::find($bookingEquipment->equipment_item_id);
                if ($equipmentItem) {
                    $damageReported = $bookingEquipment->damage_reported ?? false;
                    if ($damageReported) {
                        $equipmentItem->update(['status' => 'Maintenance']);
                    } else {
                        $equipmentItem->update(['status' => 'Available']);
                    }
                }
            }

            // Update basket status if all equipment in basket is returned
            if ($bookingEquipment->basket_id) {
                $basket = \App\Models\EquipmentBasket::find($bookingEquipment->basket_id);
                if ($basket) {
                    $basket->refresh();
                    $allReturned = $basket->bookingEquipment()
                        ->where('assignment_status', '!=', 'Returned')
                        ->count() === 0;

                    if ($allReturned && $basket->status !== 'Returned') {
                        $basket->update([
                            'status' => 'Returned',
                            'actual_return_date' => now()->toDateString(),
                        ]);
                        \Illuminate\Support\Facades\Log::info('Basket status updated to Returned (from individual return)', [
                            'basket_id' => $basket->id,
                            'basket_no' => $basket->basket_no,
                        ]);
                    }
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            $bookingEquipment->load(['booking.customer', 'equipmentItem.equipment', 'basket']);
            return response()->json($bookingEquipment);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'message' => 'Failed to return equipment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk return equipment items
     */
    public function bulkReturn(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        if (!$diveCenterId) {
            return response()->json([
                'message' => 'User must be associated with a dive center'
            ], 403);
        }

        $validated = $request->validate([
            'equipment_ids' => 'required|array|min:1',
            'equipment_ids.*' => 'required|integer|exists:booking_equipment,id',
            'damage_info' => 'sometimes|array',
            'damage_info.*.damage_reported' => 'sometimes|boolean',
            'damage_info.*.damage_description' => 'nullable|string',
            'damage_info.*.damage_cost' => 'nullable|numeric|min:0',
            'damage_info.*.charge_customer' => 'sometimes|boolean',
            'damage_info.*.damage_charge_amount' => 'nullable|numeric|min:0',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $equipmentIds = $validated['equipment_ids'];
            $damageInfo = $validated['damage_info'] ?? [];
            $returnedEquipment = [];

            foreach ($equipmentIds as $equipmentId) {
                $bookingEquipment = BookingEquipment::find($equipmentId);
                
                if (!$bookingEquipment) {
                    continue;
                }

                // Verify equipment belongs to user's dive center
                $bookingEquipment->load(['booking', 'basket']);
                $belongsToDiveCenter = false;
                
                // Check via booking
                if ($bookingEquipment->booking_id && $bookingEquipment->booking) {
                    if ($bookingEquipment->booking->dive_center_id === $diveCenterId) {
                        $belongsToDiveCenter = true;
                    }
                }
                
                // Check via basket
                if (!$belongsToDiveCenter && $bookingEquipment->basket_id && $bookingEquipment->basket) {
                    if ($bookingEquipment->basket->dive_center_id === $diveCenterId) {
                        $belongsToDiveCenter = true;
                    }
                }
                
                if (!$belongsToDiveCenter) {
                    \Illuminate\Support\Facades\Log::warning('Equipment does not belong to dive center', [
                        'equipment_id' => $equipmentId,
                        'dive_center_id' => $diveCenterId,
                        'booking_id' => $bookingEquipment->booking_id,
                        'basket_id' => $bookingEquipment->basket_id,
                    ]);
                    continue;
                }

                $updateData = [
                    'assignment_status' => 'Returned',
                    'actual_return_date' => now()->toDateString(),
                ];

                // Add damage info if provided for this equipment
                if (isset($damageInfo[$equipmentId])) {
                    $damage = $damageInfo[$equipmentId];
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

                $bookingEquipment->update($updateData);
                
                // Refresh the model to get updated damage_reported value
                $bookingEquipment->refresh();

                // Update equipment item status based on damage
                if ($bookingEquipment->equipment_source === 'Center' && $bookingEquipment->equipment_item_id) {
                    $equipmentItem = \App\Models\EquipmentItem::find($bookingEquipment->equipment_item_id);
                    if ($equipmentItem) {
                        $damageReported = $bookingEquipment->damage_reported ?? false;
                        if ($damageReported) {
                            $equipmentItem->update(['status' => 'Maintenance']);
                        } else {
                            $equipmentItem->update(['status' => 'Available']);
                        }
                    }
                }

                $bookingEquipment->load(['booking.customer', 'equipmentItem.equipment', 'basket']);
                $returnedEquipment[] = $bookingEquipment;
            }

            if (empty($returnedEquipment)) {
                \Illuminate\Support\Facades\DB::rollBack();
                return response()->json([
                    'message' => 'No equipment items were returned. Please verify the equipment belongs to your dive center.',
                ], 422);
            }

            // Update basket status if all equipment in baskets are returned
            $basketIds = array_unique(array_filter(array_map(function($eq) {
                return $eq->basket_id;
            }, $returnedEquipment)));

            foreach ($basketIds as $basketId) {
                $basket = \App\Models\EquipmentBasket::find($basketId);
                if ($basket) {
                    // Refresh the basket to get latest equipment status
                    $basket->refresh();
                    
                    // Check if all equipment in this basket is now returned
                    $allReturned = $basket->bookingEquipment()
                        ->where('assignment_status', '!=', 'Returned')
                        ->count() === 0;

                    if ($allReturned && $basket->status !== 'Returned') {
                        $basket->update([
                            'status' => 'Returned',
                            'actual_return_date' => now()->toDateString(),
                        ]);
                        \Illuminate\Support\Facades\Log::info('Basket status updated to Returned', [
                            'basket_id' => $basketId,
                            'basket_no' => $basket->basket_no,
                        ]);
                    }
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Equipment returned successfully',
                'equipment' => $returnedEquipment
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Error in bulkReturn: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'equipment_ids' => $validated['equipment_ids'] ?? [],
            ]);
            return response()->json([
                'message' => 'Failed to return equipment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk create multiple booking equipment items
     */
    public function bulkStore(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.booking_id' => 'nullable|exists:bookings,id',
            'items.*.basket_id' => 'nullable|exists:equipment_baskets,id',
            'items.*.equipment_item_id' => 'nullable|exists:equipment_items,id',
            'items.*.price' => 'nullable|numeric|min:0',
            'items.*.equipment_source' => 'nullable|in:Center,Customer Own',
            'items.*.checkout_date' => 'nullable|date',
            'items.*.return_date' => 'nullable|date',
            'items.*.customer_equipment_type' => 'nullable|string|max:255',
            'items.*.customer_equipment_brand' => 'nullable|string|max:255',
            'items.*.customer_equipment_model' => 'nullable|string|max:255',
            'items.*.customer_equipment_serial' => 'nullable|string|max:255',
            'items.*.customer_equipment_notes' => 'nullable|string',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $successItems = [];
            $failedItems = [];
            $availabilityService = new EquipmentAvailabilityService();

            foreach ($validated['items'] as $index => $item) {
                try {
                    // Validate that either booking_id or basket_id is provided
                    if (empty($item['booking_id']) && empty($item['basket_id'])) {
                        $failedItems[] = [
                            'index' => $index,
                            'item' => $item,
                            'error' => 'Either booking_id or basket_id must be provided'
                        ];
                        continue;
                    }

                    // Validate equipment_source and equipment_item_id
                    $equipmentSource = $item['equipment_source'] ?? 'Center';
                    if ($equipmentSource === 'Center' && empty($item['equipment_item_id'])) {
                        $failedItems[] = [
                            'index' => $index,
                            'item' => $item,
                            'error' => 'equipment_item_id is required for center equipment'
                        ];
                        continue;
                    }

                    // Verify basket belongs to dive center if provided
                    if (!empty($item['basket_id'])) {
                        $basket = \App\Models\EquipmentBasket::where('id', $item['basket_id'])
                            ->where('dive_center_id', $diveCenterId)
                            ->first();
                        
                        if (!$basket) {
                            $failedItems[] = [
                                'index' => $index,
                                'item' => $item,
                                'error' => 'Basket not found or does not belong to your dive center'
                            ];
                            continue;
                        }

                        // Use basket's booking_id if not provided
                        if (empty($item['booking_id']) && $basket->booking_id) {
                            $item['booking_id'] = $basket->booking_id;
                        }
                    }

                    // Verify booking belongs to dive center if provided
                    if (!empty($item['booking_id'])) {
                        $booking = \App\Models\Booking::where('id', $item['booking_id'])
                            ->where('dive_center_id', $diveCenterId)
                            ->first();
                        
                        if (!$booking) {
                            $failedItems[] = [
                                'index' => $index,
                                'item' => $item,
                                'error' => 'Booking not found or does not belong to your dive center'
                            ];
                            continue;
                        }
                    }

                    // Prepare data
                    $data = array_merge([
                        'price' => $item['price'] ?? 0,
                        'equipment_source' => $equipmentSource,
                        'assignment_status' => 'Pending',
                    ], $item);

                    // If equipment_source is 'Customer Own', equipment_item_id should be null
                    if ($data['equipment_source'] === 'Customer Own') {
                        $data['equipment_item_id'] = null;
                    }

                    // Check availability for Center equipment
                    if ($data['equipment_source'] === 'Center' && !empty($data['equipment_item_id'])) {
                        $checkoutDate = $data['checkout_date'] ?? now()->toDateString();
                        $returnDate = $data['return_date'] ?? \Carbon\Carbon::parse($checkoutDate)->addDay()->toDateString();
                        
                        if (empty($data['checkout_date'])) {
                            $data['checkout_date'] = $checkoutDate;
                        }
                        if (empty($data['return_date'])) {
                            $data['return_date'] = $returnDate;
                        }
                        
                        $isAvailable = $availabilityService->isAvailable(
                            $data['equipment_item_id'],
                            $checkoutDate,
                            $returnDate
                        );
                        
                        if (!$isAvailable) {
                            $conflicts = $availabilityService->getConflicts(
                                $data['equipment_item_id'],
                                $checkoutDate,
                                $returnDate
                            );
                            
                            $conflictDetails = $conflicts->map(function ($conflict) {
                                $customerName = 'Unknown';
                                $basketNo = null;
                                
                                if ($conflict->basket && $conflict->basket->customer) {
                                    $customerName = $conflict->basket->customer->full_name ?? 'Unknown';
                                    $basketNo = $conflict->basket->basket_no;
                                } elseif ($conflict->booking && $conflict->booking->customer) {
                                    $customerName = $conflict->booking->customer->full_name ?? 'Unknown';
                                }
                                
                                return [
                                    'id' => $conflict->id,
                                    'customer_name' => $customerName,
                                    'checkout_date' => $conflict->checkout_date ? $conflict->checkout_date->format('Y-m-d') : null,
                                    'return_date' => $conflict->return_date ? $conflict->return_date->format('Y-m-d') : null,
                                    'basket_no' => $basketNo,
                                    'assignment_status' => $conflict->assignment_status,
                                ];
                            });
                            
                            $failedItems[] = [
                                'index' => $index,
                                'item' => $item,
                                'error' => 'Equipment is not available for the requested dates',
                                'equipment_item_id' => $data['equipment_item_id'],
                                'checkout_date' => $checkoutDate,
                                'return_date' => $returnDate,
                                'conflicting_assignments' => $conflictDetails,
                            ];
                            continue;
                        }
                    }

                    // Create the booking equipment
                    $bookingEquipment = BookingEquipment::create($data);
                    
                    // Update equipment item status if needed
                    if ($bookingEquipment->equipment_source === 'Center' && 
                        $bookingEquipment->equipment_item_id && 
                        $bookingEquipment->assignment_status === 'Checked Out') {
                        $equipmentItem = \App\Models\EquipmentItem::find($bookingEquipment->equipment_item_id);
                        if ($equipmentItem) {
                            $equipmentItem->update(['status' => 'Rented']);
                        }
                    }
                    
                    // Load relationships
                    $loadRelations = [];
                    if ($bookingEquipment->booking_id) {
                        $loadRelations[] = 'booking.customer';
                    }
                    if ($bookingEquipment->equipment_item_id) {
                        $loadRelations[] = 'equipmentItem.equipment';
                    }
                    if ($bookingEquipment->basket_id) {
                        $loadRelations[] = 'basket';
                    }
                    
                    if (!empty($loadRelations)) {
                        $bookingEquipment->load($loadRelations);
                    }
                    
                    $successItems[] = $bookingEquipment;
                } catch (\Exception $e) {
                    $failedItems[] = [
                        'index' => $index,
                        'item' => $item,
                        'error' => $e->getMessage()
                    ];
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Bulk create completed',
                'success_count' => count($successItems),
                'failed_count' => count($failedItems),
                'success' => $successItems,
                'failed' => $failedItems,
            ], count($successItems) > 0 ? 201 : 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Error in bulkStore: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to create booking equipment items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk check availability for multiple equipment items
     */
    public function bulkCheckAvailability(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.equipment_item_id' => 'required|exists:equipment_items,id',
            'items.*.checkout_date' => 'required|date',
            'items.*.return_date' => 'required|date|after:items.*.checkout_date',
        ]);

        $availabilityService = new EquipmentAvailabilityService();
        $results = [];

        foreach ($validated['items'] as $index => $item) {
            $isAvailable = $availabilityService->isAvailable(
                $item['equipment_item_id'],
                $item['checkout_date'],
                $item['return_date']
            );

            $result = [
                'index' => $index,
                'equipment_item_id' => $item['equipment_item_id'],
                'checkout_date' => $item['checkout_date'],
                'return_date' => $item['return_date'],
                'available' => $isAvailable,
            ];

            if (!$isAvailable) {
                $conflicts = $availabilityService->getConflicts(
                    $item['equipment_item_id'],
                    $item['checkout_date'],
                    $item['return_date']
                );

                $conflictDetails = $conflicts->map(function ($conflict) {
                    $customerName = 'Unknown';
                    $basketNo = null;
                    
                    if ($conflict->basket && $conflict->basket->customer) {
                        $customerName = $conflict->basket->customer->full_name ?? 'Unknown';
                        $basketNo = $conflict->basket->basket_no;
                    } elseif ($conflict->booking && $conflict->booking->customer) {
                        $customerName = $conflict->booking->customer->full_name ?? 'Unknown';
                    }
                    
                    return [
                        'id' => $conflict->id,
                        'customer_name' => $customerName,
                        'checkout_date' => $conflict->checkout_date ? $conflict->checkout_date->format('Y-m-d') : null,
                        'return_date' => $conflict->return_date ? $conflict->return_date->format('Y-m-d') : null,
                        'basket_no' => $basketNo,
                        'assignment_status' => $conflict->assignment_status,
                    ];
                });

                $result['conflicting_assignments'] = $conflictDetails;
            }

            $results[] = $result;
        }

        return response()->json([
            'results' => $results
        ]);
    }
}

