<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\BookingExcursion;
use App\Models\Booking;
use App\Models\DiveGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingExcursionController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = BookingExcursion::with(['booking.customer', 'booking.diveGroup', 'excursion', 'priceListItem']);

        if ($user->dive_center_id) {
            // Use join instead of whereHas for better performance
            $query->join('bookings', 'booking_excursions.booking_id', '=', 'bookings.id')
                  ->where('bookings.dive_center_id', $user->dive_center_id)
                  ->select('booking_excursions.*');
        }

        return $query->orderBy('booking_excursions.created_at', 'desc')->paginate(20);
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
            'customer_id' => 'nullable|exists:customers,id',
            'dive_group_id' => 'nullable|exists:dive_groups,id',
            'booking_date' => 'nullable|date',
            'number_of_participants' => 'nullable|integer|min:1',
            'excursion_id' => 'required|exists:excursions,id',
            'excursion_date' => 'nullable|date',
            'excursion_time' => 'nullable|date_format:H:i',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'price' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:Scheduled,In Progress,Completed,Cancelled',
            'completed_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        // Handle dive group booking
        if (isset($validated['dive_group_id'])) {
            $diveGroup = DiveGroup::where('id', $validated['dive_group_id'])
                ->where('dive_center_id', $diveCenterId)
                ->with('members')
                ->firstOrFail();

            if (!$diveGroup->isActive()) {
                return response()->json([
                    'message' => 'Cannot book for inactive group'
                ], 422);
            }

            $members = $diveGroup->members;
            if ($members->isEmpty()) {
                return response()->json([
                    'message' => 'Group has no members'
                ], 422);
            }

            // Create bookings for all group members
            DB::beginTransaction();
            try {
                $bookings = [];
                $bookingExcursions = [];
                $numberOfParticipants = $validated['number_of_participants'] ?? 1;

                foreach ($members as $member) {
                    $booking = Booking::create([
                        'dive_center_id' => $diveCenterId,
                        'customer_id' => $member->id,
                        'agent_id' => $diveGroup->agent_id,
                        'dive_group_id' => $diveGroup->id,
                        'booking_date' => $validated['booking_date'] ?? $validated['excursion_date'] ?? now()->toDateString(),
                        'number_of_divers' => $numberOfParticipants,
                        'status' => 'Pending',
                    ]);

                    // Prepare excursion data for this member
                    $excursionData = [
                        'booking_id' => $booking->id,
                        'excursion_id' => $validated['excursion_id'],
                        'excursion_date' => $validated['excursion_date'] ?? null,
                        'excursion_time' => $validated['excursion_time'] ?? null,
                        'price_list_item_id' => $validated['price_list_item_id'] ?? null,
                        'price' => $validated['price'] ?? null,
                        'status' => $validated['status'] ?? 'Scheduled',
                        'completed_at' => $validated['completed_at'] ?? null,
                        'notes' => $validated['notes'] ?? null,
                        'number_of_participants' => $numberOfParticipants,
                    ];

                    // Auto-select price if not provided
                    if (!isset($excursionData['price_list_item_id'])) {
                        $priceListItem = \App\Models\PriceListItem::where('service_type', 'Excursion Trip')
                            ->where('is_active', true)
                            ->whereHas('priceList', function ($q) use ($diveCenterId) {
                                $q->where('dive_center_id', $diveCenterId);
                            })
                            ->orderBy('price', 'asc')
                            ->first();
                        
                        if ($priceListItem) {
                            $excursionData['price_list_item_id'] = $priceListItem->id;
                            $excursionData['price'] = $priceListItem->base_price ?? $priceListItem->price;
                        }
                    }

                    $bookingExcursion = BookingExcursion::create($excursionData);
                    $bookings[] = $booking;
                    $bookingExcursions[] = $bookingExcursion;
                }

                DB::commit();
                
                return response()->json([
                    'message' => 'Bookings created successfully for group',
                    'bookings' => $bookings,
                    'booking_excursions' => $bookingExcursions,
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Failed to create group bookings',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        // Walk-in support: Auto-create booking if booking_id not provided
        $bookingId = $validated['booking_id'] ?? null;
        
        if (!$bookingId && isset($validated['customer_id'])) {
            // Validate customer belongs to dive center
            $customer = \App\Models\Customer::where('id', $validated['customer_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();

            // Create booking in transaction
            DB::beginTransaction();
            try {
                $booking = Booking::create([
                    'dive_center_id' => $diveCenterId,
                    'customer_id' => $validated['customer_id'],
                    'agent_id' => $customer->agent_id ?? null,
                    'booking_date' => $validated['booking_date'] ?? $validated['excursion_date'] ?? now()->toDateString(),
                    'number_of_divers' => $validated['number_of_participants'] ?? 1,
                    'status' => 'Pending',
                ]);
                $bookingId = $booking->id;
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Failed to create booking',
                    'error' => $e->getMessage()
                ], 500);
            }
        } elseif (!$bookingId) {
            return response()->json([
                'message' => 'Either booking_id, customer_id, or dive_group_id must be provided'
            ], 422);
        }

        // Validate booking belongs to dive center
        $booking = Booking::where('id', $bookingId)
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate excursion belongs to dive center
        $excursion = \App\Models\Excursion::where('id', $validated['excursion_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Auto-select price if not provided
        $priceListItem = null;
        $autoSelectedPrice = null;
        
        if (isset($validated['price_list_item_id'])) {
            // Validate manually selected price_list_item belongs to same dive center
            $priceListItem = \App\Models\PriceListItem::where('id', $validated['price_list_item_id'])
                ->where('service_type', 'Excursion Trip')
                ->whereHas('priceList', function ($q) use ($diveCenterId) {
                    $q->where('dive_center_id', $diveCenterId);
                })
                ->firstOrFail();
        } else {
            // Auto-select first available excursion trip price
            $priceListItem = \App\Models\PriceListItem::where('service_type', 'Excursion Trip')
                ->where('is_active', true)
                ->whereHas('priceList', function ($q) use ($diveCenterId) {
                    $q->where('dive_center_id', $diveCenterId);
                })
                ->orderBy('price', 'asc')
                ->first();
            
            if ($priceListItem) {
                $autoSelectedPrice = $priceListItem->base_price ?? $priceListItem->price;
            }
        }

        // Prepare excursion data
        $excursionData = [
            'booking_id' => $bookingId,
            'excursion_id' => $validated['excursion_id'],
            'excursion_date' => $validated['excursion_date'] ?? null,
            'excursion_time' => $validated['excursion_time'] ?? null,
            'price_list_item_id' => $priceListItem ? $priceListItem->id : ($validated['price_list_item_id'] ?? null),
            'price' => $validated['price'] ?? $autoSelectedPrice,
            'status' => $validated['status'] ?? 'Scheduled',
            'completed_at' => $validated['completed_at'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'number_of_participants' => $validated['number_of_participants'] ?? 1,
        ];

        // Auto-set completed_at if status is Completed
        if ($excursionData['status'] === 'Completed' && !$excursionData['completed_at']) {
            $excursionData['completed_at'] = now();
        }

        DB::beginTransaction();
        try {
            $bookingExcursion = BookingExcursion::create($excursionData);
            
            DB::commit();
            
            $bookingExcursion->load(['booking.customer', 'excursion', 'priceListItem']);
            
            return response()->json($bookingExcursion, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create excursion booking',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, BookingExcursion $bookingExcursion)
    {
        // Verify excursion belongs to user's dive center (via booking relationship)
        $bookingExcursion->load('booking');
        if (!$bookingExcursion->booking) {
            abort(404, 'Excursion booking not found');
        }
        $this->authorizeDiveCenterAccess($bookingExcursion->booking, 'Unauthorized access to this excursion booking');
        
        $bookingExcursion->load(['booking.customer', 'booking.diveGroup', 'excursion', 'priceListItem']);
        return $bookingExcursion;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BookingExcursion $bookingExcursion)
    {
        // Verify excursion belongs to user's dive center (via booking relationship)
        $bookingExcursion->load('booking');
        if (!$bookingExcursion->booking) {
            abort(404, 'Excursion booking not found');
        }
        $this->authorizeDiveCenterAccess($bookingExcursion->booking, 'Unauthorized access to this excursion booking');
        
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'booking_id' => 'sometimes|exists:bookings,id',
            'excursion_id' => 'sometimes|exists:excursions,id',
            'excursion_date' => 'nullable|date',
            'excursion_time' => 'nullable|date_format:H:i',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'price' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:Scheduled,In Progress,Completed,Cancelled',
            'completed_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'number_of_participants' => 'nullable|integer|min:1',
        ]);

        // Validate price_list_item belongs to same dive center if provided
        if (isset($validated['price_list_item_id'])) {
            $priceListItem = \App\Models\PriceListItem::where('id', $validated['price_list_item_id'])
                ->where('service_type', 'Excursion Trip')
                ->whereHas('priceList', function ($q) use ($diveCenterId) {
                    $q->where('dive_center_id', $diveCenterId);
                })
                ->firstOrFail();
        }

        // Auto-set completed_at if status changes to Completed
        if (isset($validated['status']) && $validated['status'] === 'Completed' && !isset($validated['completed_at'])) {
            $validated['completed_at'] = now();
        }

        $bookingExcursion->update($validated);
        $bookingExcursion->load(['booking.customer', 'excursion', 'priceListItem']);
        
        return response()->json($bookingExcursion);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, BookingExcursion $bookingExcursion)
    {
        // Verify excursion belongs to user's dive center (via booking relationship)
        $bookingExcursion->load('booking');
        if (!$bookingExcursion->booking) {
            abort(404, 'Excursion booking not found');
        }
        $this->authorizeDiveCenterAccess($bookingExcursion->booking, 'Unauthorized access to this excursion booking');

        $bookingExcursion->delete();
        return response()->noContent();
    }

    /**
     * Mark excursion as completed
     */
    public function complete(Request $request, BookingExcursion $bookingExcursion)
    {
        // Verify excursion belongs to user's dive center (via booking relationship)
        $bookingExcursion->load('booking');
        if (!$bookingExcursion->booking) {
            abort(404, 'Excursion booking not found');
        }
        $this->authorizeDiveCenterAccess($bookingExcursion->booking, 'Unauthorized access to this excursion booking');

        // Prevent completing excursion twice
        if ($bookingExcursion->status === 'Completed') {
            return response()->json([
                'message' => 'Excursion is already completed'
            ], 422);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $bookingExcursion->update([
            'status' => 'Completed',
            'completed_at' => now(),
            'notes' => $validated['notes'] ?? $bookingExcursion->notes,
        ]);

        $bookingExcursion->load(['booking.customer', 'excursion', 'priceListItem']);
        
        return response()->json($bookingExcursion);
    }
}
