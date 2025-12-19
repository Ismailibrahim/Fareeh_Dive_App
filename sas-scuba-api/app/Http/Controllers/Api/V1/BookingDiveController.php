<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BookingDive;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingDiveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = BookingDive::with(['booking.customer', 'diveSite', 'boat', 'priceListItem']);

        if ($user->dive_center_id) {
            // Use join instead of whereHas for better performance
            $query->join('bookings', 'booking_dives.booking_id', '=', 'bookings.id')
                  ->where('bookings.dive_center_id', $user->dive_center_id)
                  ->select('booking_dives.*');
        }

        return $query->orderBy('booking_dives.created_at', 'desc')->paginate(20);
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
            'booking_date' => 'nullable|date',
            'number_of_divers' => 'nullable|integer|min:1',
            'dive_site_id' => 'required|exists:dive_sites,id',
            'boat_id' => 'nullable|exists:boats,id',
            'dive_date' => 'nullable|date',
            'dive_time' => 'nullable|date_format:H:i',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'price' => 'nullable|numeric|min:0',
            'dive_duration' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'nullable|numeric|min:0|max:200',
            'status' => 'nullable|in:Scheduled,In Progress,Completed,Cancelled',
            'completed_at' => 'nullable|date',
            'dive_log_notes' => 'nullable|string',
        ]);

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
                    'booking_date' => $validated['booking_date'] ?? $validated['dive_date'] ?? now()->toDateString(),
                    'number_of_divers' => $validated['number_of_divers'] ?? null,
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
                'message' => 'Either booking_id or customer_id must be provided'
            ], 422);
        }

        // Validate booking belongs to dive center
        $booking = Booking::where('id', $bookingId)
            ->where('dive_center_id', $diveCenterId)
            ->with('divePackage')
            ->firstOrFail();

        // Handle package dive if booking belongs to a package
        $divePackage = $booking->divePackage;
        if ($divePackage) {
            // Check if package can accept more dives
            if (!$divePackage->canAddDive()) {
                return response()->json([
                    'message' => 'Package has no remaining dives or is expired'
                ], 422);
            }
        }

        // Validate price_list_item belongs to same dive center if provided
        if (isset($validated['price_list_item_id'])) {
            $priceListItem = \App\Models\PriceListItem::where('id', $validated['price_list_item_id'])
                ->whereHas('priceList', function ($q) use ($diveCenterId) {
                    $q->where('dive_center_id', $diveCenterId);
                })
                ->firstOrFail();
        }

        // Prepare dive data
        $diveData = [
            'booking_id' => $bookingId,
            'dive_site_id' => $validated['dive_site_id'],
            'boat_id' => $validated['boat_id'] ?? null,
            'dive_date' => $validated['dive_date'] ?? null,
            'dive_time' => $validated['dive_time'] ?? null,
            'price_list_item_id' => $validated['price_list_item_id'] ?? null,
            'price' => $validated['price'] ?? null,
            'dive_duration' => $validated['dive_duration'] ?? null,
            'max_depth' => $validated['max_depth'] ?? null,
            'status' => $validated['status'] ?? 'Scheduled',
            'completed_at' => $validated['completed_at'] ?? null,
            'dive_log_notes' => $validated['dive_log_notes'] ?? null,
        ];

        // Handle package dive
        if ($divePackage) {
            $diveData['dive_package_id'] = $divePackage->id;
            $diveData['is_package_dive'] = true;
            $diveData['package_dive_number'] = $divePackage->package_dives_used + 1;
            
            // Set price from package if not provided
            if (!isset($diveData['price'])) {
                $diveData['price'] = $divePackage->calculatePerDivePrice();
            }
            
            // Set price_list_item_id from package if not provided
            if (!isset($diveData['price_list_item_id'])) {
                $diveData['price_list_item_id'] = $divePackage->package_price_list_item_id;
            }
        }

        // Auto-set completed_at if status is Completed
        if ($diveData['status'] === 'Completed' && !$diveData['completed_at']) {
            $diveData['completed_at'] = now();
        }

        DB::beginTransaction();
        try {
            $bookingDive = BookingDive::create($diveData);
            
            // Update package dive counter if package dive
            if ($divePackage) {
                $divePackage->increment('package_dives_used');
                
                // Update package status if all dives used
                if ($divePackage->package_dives_used >= $divePackage->package_total_dives) {
                    $divePackage->update(['status' => 'Completed']);
                }
            }
            
            DB::commit();
            
            $bookingDive->load(['booking.customer', 'diveSite', 'boat', 'priceListItem', 'bookingInstructors.user', 'divePackage']);
            
            return response()->json($bookingDive, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create dive',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, BookingDive $bookingDive)
    {
        $user = $request->user();
        
        // Verify dive belongs to user's dive center
        if ($user->dive_center_id) {
            $bookingDive->load(['booking' => function ($query) use ($user) {
                $query->where('dive_center_id', $user->dive_center_id);
            }]);
            
            if (!$bookingDive->booking) {
                return response()->json(['message' => 'Dive not found'], 404);
            }
        }
        
        $bookingDive->load(['booking.customer', 'diveSite', 'boat', 'priceListItem', 'bookingInstructors.user']);
        return $bookingDive;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BookingDive $bookingDive)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        // Verify dive belongs to user's dive center
        if ($diveCenterId) {
            $bookingDive->load('booking');
            if (!$bookingDive->booking || $bookingDive->booking->dive_center_id !== $diveCenterId) {
                return response()->json(['message' => 'Dive not found'], 404);
            }
        }

        $validated = $request->validate([
            'booking_id' => 'sometimes|exists:bookings,id',
            'dive_site_id' => 'sometimes|exists:dive_sites,id',
            'boat_id' => 'nullable|exists:boats,id',
            'dive_date' => 'nullable|date',
            'dive_time' => 'nullable|date_format:H:i',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'price' => 'nullable|numeric|min:0',
            'dive_duration' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'nullable|numeric|min:0|max:200',
            'status' => 'nullable|in:Scheduled,In Progress,Completed,Cancelled',
            'completed_at' => 'nullable|date',
            'dive_log_notes' => 'nullable|string',
        ]);

        // Validate price_list_item belongs to same dive center if provided
        if (isset($validated['price_list_item_id'])) {
            $priceListItem = \App\Models\PriceListItem::where('id', $validated['price_list_item_id'])
                ->whereHas('priceList', function ($q) use ($diveCenterId) {
                    $q->where('dive_center_id', $diveCenterId);
                })
                ->firstOrFail();
        }

        // Auto-set completed_at if status changes to Completed
        if (isset($validated['status']) && $validated['status'] === 'Completed' && !isset($validated['completed_at'])) {
            $validated['completed_at'] = now();
        }

        $bookingDive->update($validated);
        $bookingDive->load(['booking.customer', 'diveSite', 'boat', 'priceListItem', 'bookingInstructors.user']);
        
        return response()->json($bookingDive);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, BookingDive $bookingDive)
    {
        $user = $request->user();
        
        // Verify dive belongs to user's dive center
        if ($user->dive_center_id) {
            $bookingDive->load('booking');
            if (!$bookingDive->booking || $bookingDive->booking->dive_center_id !== $user->dive_center_id) {
                return response()->json(['message' => 'Dive not found'], 404);
            }
        }

        $bookingDive->delete();
        return response()->noContent();
    }

    /**
     * Mark dive as completed and update log
     */
    public function complete(Request $request, BookingDive $bookingDive)
    {
        $user = $request->user();
        
        // Verify dive belongs to user's dive center
        if ($user->dive_center_id) {
            $bookingDive->load('booking');
            if (!$bookingDive->booking || $bookingDive->booking->dive_center_id !== $user->dive_center_id) {
                return response()->json(['message' => 'Dive not found'], 404);
            }
        }

        // Prevent completing dive twice
        if ($bookingDive->status === 'Completed') {
            return response()->json([
                'message' => 'Dive is already completed'
            ], 422);
        }

        $validated = $request->validate([
            'dive_duration' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'nullable|numeric|min:0|max:200',
            'dive_log_notes' => 'nullable|string',
        ]);

        $bookingDive->update([
            'status' => 'Completed',
            'completed_at' => now(),
            'dive_duration' => $validated['dive_duration'] ?? $bookingDive->dive_duration,
            'max_depth' => $validated['max_depth'] ?? $bookingDive->max_depth,
            'dive_log_notes' => $validated['dive_log_notes'] ?? $bookingDive->dive_log_notes,
        ]);

        $bookingDive->load(['booking.customer', 'diveSite', 'boat', 'priceListItem', 'bookingInstructors.user']);
        
        return response()->json($bookingDive);
    }

    /**
     * Get dive log details with instructor info
     */
    public function log(Request $request, BookingDive $bookingDive)
    {
        $user = $request->user();
        
        // Verify dive belongs to user's dive center
        if ($user->dive_center_id) {
            $bookingDive->load('booking');
            if (!$bookingDive->booking || $bookingDive->booking->dive_center_id !== $user->dive_center_id) {
                return response()->json(['message' => 'Dive not found'], 404);
            }
        }

        $bookingDive->load([
            'booking.customer',
            'diveSite',
            'boat',
            'priceListItem',
            'bookingInstructors.user'
        ]);
        
        return response()->json([
            'dive' => $bookingDive,
            'log' => [
                'dive_site' => $bookingDive->diveSite,
                'dive_date' => $bookingDive->dive_date,
                'dive_time' => $bookingDive->dive_time,
                'instructors' => $bookingDive->bookingInstructors->map(function ($bi) {
                    return [
                        'id' => $bi->id,
                        'user_id' => $bi->user_id,
                        'user' => [
                            'full_name' => $bi->user->full_name ?? null,
                        ],
                        'role' => $bi->role,
                    ];
                }),
                'dive_duration' => $bookingDive->dive_duration,
                'max_depth' => $bookingDive->max_depth,
                'status' => $bookingDive->status,
                'completed_at' => $bookingDive->completed_at,
                'dive_log_notes' => $bookingDive->dive_log_notes,
            ]
        ]);
    }
}

