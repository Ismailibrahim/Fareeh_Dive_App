<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\BookingDive;
use App\Models\Booking;
use App\Models\DiveGroup;
use App\Services\DivePricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingDiveController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = BookingDive::whereNull('parent_id')
            ->with(['booking.customer', 'booking.diveGroup', 'diveSite', 'boat', 'priceListItem']);

        if ($user->dive_center_id) {
            // Use join instead of whereHas for better performance
            $query->join('bookings', 'booking_dives.booking_id', '=', 'bookings.id')
                  ->where('bookings.dive_center_id', $user->dive_center_id)
                  ->select('booking_dives.*');
        }

        return $query->withCount('invoiceItems')
            ->orderBy('booking_dives.created_at', 'desc')
            ->paginate(20);
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
            'customer_ids' => 'nullable|array',
            'customer_ids.*' => 'exists:customers,id',
            'dive_group_id' => 'nullable|exists:dive_groups,id',
            'booking_date' => 'nullable|date',
            'number_of_divers' => 'nullable|integer|min:1',
            'member_diver_counts' => 'nullable|array',
            'member_diver_counts.*' => 'integer|min:1',
            'dive_site_id' => 'required|exists:dive_sites,id',
            'boat_id' => 'nullable|exists:boats,id',
            'dive_date' => 'nullable|date',
            'dive_time' => 'nullable|regex:/^([0-9]{2}:[0-9]{2})(:[0-9]{2})?$/',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'price' => 'nullable|numeric|min:0',
            'dive_duration' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'nullable|numeric|min:0|max:200',
            'status' => 'nullable|in:Scheduled,In Progress,Completed,Cancelled',
            'completed_at' => 'nullable|date',
            'dive_log_notes' => 'nullable|string',
            'additional_items' => 'nullable|array',
            'additional_items.*.price_list_item_id' => 'required|exists:price_list_items,id',
            'additional_items.*.price' => 'required|numeric|min:0',
            'additional_items.*.dive_site_id' => 'nullable|exists:dive_sites,id',
            'extra_dive_site_ids' => 'nullable|array',
            'extra_dive_site_ids.*' => 'exists:dive_sites,id',
        ]);

        // Handle multiple customer quick booking (Walk-in Group)
        if (isset($validated['customer_ids']) && !empty($validated['customer_ids'])) {
            $customers = \App\Models\Customer::whereIn('id', $validated['customer_ids'])
                ->where('dive_center_id', $diveCenterId)
                ->get();

            if ($customers->isEmpty()) {
                return response()->json(['message' => 'No valid customers found'], 422);
            }

            DB::beginTransaction();
            try {
                $bookings = [];
                $bookingDives = [];
                $pricingService = new DivePricingService($diveCenterId);

                foreach ($customers as $customer) {
                    $booking = Booking::create([
                        'dive_center_id' => $diveCenterId,
                        'customer_id' => $customer->id,
                        'agent_id' => $customer->agent_id ?? null,
                        'booking_date' => $validated['booking_date'] ?? $validated['dive_date'] ?? now()->toDateString(),
                        'number_of_divers' => 1,
                        'status' => 'Pending',
                    ]);

                    $diveData = [
                        'booking_id' => $booking->id,
                        'dive_site_id' => $validated['dive_site_id'],
                        'boat_id' => $validated['boat_id'] ?? null,
                        'dive_date' => $validated['dive_date'] ?? null,
                        'dive_time' => $validated['dive_time'] ?? null,
                        'dive_duration' => $validated['dive_duration'] ?? null,
                        'max_depth' => $validated['max_depth'] ?? null,
                        'status' => $validated['status'] ?? 'Scheduled',
                        'dive_log_notes' => $validated['dive_log_notes'] ?? null,
                    ];

                    // pricing logic (similar to group booking)
                    if (isset($validated['price_list_item_id'])) {
                        $diveData['price_list_item_id'] = $validated['price_list_item_id'];
                        $diveData['price'] = $validated['price'] ?? 0;
                    } else {
                        $existingDiveCount = $booking->bookingDives()->count();
                        $newDiveCount = $existingDiveCount + 1;
                        $customerType = $pricingService->getCustomerType($customer);
                        $priceListItem = $pricingService->getBestPrice(
                            $newDiveCount,
                            'Dive Trip',
                            $customerType,
                            $validated['dive_date'] ?? now()->toDateString()
                        );
                        
                        if ($priceListItem) {
                            $diveData['price_list_item_id'] = $priceListItem->id;
                            if ($priceListItem->pricing_model === 'TIERED') {
                                $diveData['price'] = $pricingService->calculateTieredPrice($newDiveCount, $priceListItem);
                            } else {
                                $diveData['price'] = $priceListItem->base_price ?? $priceListItem->price;
                            }
                        }
                    }

                    $bookingDive = BookingDive::create($diveData);

                    // Add extra dive sites if provided
                    if (!empty($validated['extra_dive_site_ids'])) {
                        foreach ($validated['extra_dive_site_ids'] as $extraSiteId) {
                            BookingDive::create([
                                'parent_id' => $bookingDive->id,
                                'booking_id' => $booking->id,
                                'dive_site_id' => $extraSiteId,
                                'boat_id' => $validated['boat_id'] ?? null,
                                'dive_date' => $validated['dive_date'] ?? null,
                                'dive_time' => $validated['dive_time'] ?? null,
                                'price' => 0,
                                'status' => $validated['status'] ?? 'Scheduled',
                            ]);
                        }
                    }

                    $bookings[] = $booking;
                    $bookingDives[] = $bookingDive;
                }

                DB::commit();
                return response()->json([
                    'message' => 'Multiple bookings created successfully',
                    'bookings' => $bookings,
                    'booking_dives' => $bookingDives,
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json(['message' => 'Failed to create multiple bookings', 'error' => $e->getMessage()], 500);
            }
        }

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
                $bookingDives = [];
                $memberDiverCounts = $validated['member_diver_counts'] ?? [];

                foreach ($members as $member) {
                    // Use per-member diver count if provided, otherwise fallback to number_of_divers or default to 1
                    // Handle both string and integer keys from JSON
                    $diverCount = 1;
                    if (!empty($memberDiverCounts)) {
                        // Try integer key first
                        if (isset($memberDiverCounts[$member->id])) {
                            $diverCount = (int)$memberDiverCounts[$member->id];
                        } 
                        // Try string key (JSON often sends numeric keys as strings)
                        elseif (isset($memberDiverCounts[(string)$member->id])) {
                            $diverCount = (int)$memberDiverCounts[(string)$member->id];
                        }
                        // Fallback to number_of_divers if set
                        elseif (isset($validated['number_of_divers'])) {
                            $diverCount = (int)$validated['number_of_divers'];
                        }
                    } elseif (isset($validated['number_of_divers'])) {
                        $diverCount = (int)$validated['number_of_divers'];
                    }

                    $booking = Booking::create([
                        'dive_center_id' => $diveCenterId,
                        'customer_id' => $member->id,
                        'agent_id' => $diveGroup->agent_id,
                        'dive_group_id' => $diveGroup->id,
                        'booking_date' => $validated['booking_date'] ?? $validated['dive_date'] ?? now()->toDateString(),
                        'number_of_divers' => $diverCount,
                        'status' => 'Pending',
                    ]);

                    // Prepare dive data for this member
                    $diveData = [
                        'booking_id' => $booking->id,
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

                    // Auto-select price if not provided
                    if (!isset($diveData['price_list_item_id'])) {
                        $pricingService = new DivePricingService();
                        $existingDiveCount = $booking->bookingDives()->count();
                        $newDiveCount = $existingDiveCount + 1;
                        $customerType = $pricingService->getCustomerType($member);
                        $priceListItem = $pricingService->getBestPrice(
                            $newDiveCount,
                            'Dive Trip',
                            $customerType,
                            $validated['dive_date'] ?? now()->toDateString()
                        );
                        
                        if ($priceListItem) {
                            $diveData['price_list_item_id'] = $priceListItem->id;
                            if ($priceListItem->pricing_model === 'TIERED') {
                                $diveData['price'] = $pricingService->calculateTieredPrice($newDiveCount, $priceListItem);
                            } else {
                                $diveData['price'] = $priceListItem->base_price ?? $priceListItem->price;
                            }
                        }
                    }

                    $bookingDive = BookingDive::create($diveData);
                    $bookings[] = $booking;
                    $bookingDives[] = $bookingDive;
                }

                DB::commit();
                
                return response()->json([
                    'message' => 'Bookings created successfully for group',
                    'bookings' => $bookings,
                    'booking_dives' => $bookingDives,
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
        \Log::info('Incoming BookingDive store request', $validated);
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
                'message' => 'Either booking_id, customer_id, or dive_group_id must be provided'
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

        // Auto-select price if not provided
        $priceListItem = null;
        $autoSelectedPrice = null;
        
        if (isset($validated['price_list_item_id'])) {
            // Validate manually selected price_list_item belongs to same dive center
            $priceListItem = \App\Models\PriceListItem::where('id', $validated['price_list_item_id'])
                ->whereHas('priceList', function ($q) use ($diveCenterId) {
                    $q->where('dive_center_id', $diveCenterId);
                })
                ->firstOrFail();
        } elseif (empty($validated['additional_items'])) {
            // Auto-select best price based on dive count if no manual price and no additional items
            $pricingService = new DivePricingService();
            
            // Count existing dives for this booking
            $existingDiveCount = $booking->bookingDives()->count();
            $newDiveCount = $existingDiveCount + 1;
            
            // Get customer type
            $customerType = null;
            if ($booking->customer) {
                $customerType = $pricingService->getCustomerType($booking->customer);
            }
            
            // Get best price for the dive count
            $priceListItem = $pricingService->getBestPrice(
                $newDiveCount,
                'Dive Trip', // Default service type, can be made configurable
                $customerType,
                $validated['dive_date'] ?? now()->toDateString()
            );
            
            if ($priceListItem) {
                // Calculate price based on pricing model
                if ($priceListItem->pricing_model === 'TIERED') {
                    $autoSelectedPrice = $pricingService->calculateTieredPrice($newDiveCount, $priceListItem);
                } else {
                    $autoSelectedPrice = $priceListItem->base_price ?? $priceListItem->price;
                }
            }
        }

        // Prepare dive data
        $diveData = [
            'booking_id' => $bookingId,
            'dive_site_id' => $validated['dive_site_id'],
            'boat_id' => $validated['boat_id'] ?? null,
            'dive_date' => $validated['dive_date'] ?? null,
            'dive_time' => $validated['dive_time'] ?? null,
            'price_list_item_id' => $priceListItem ? $priceListItem->id : ($validated['price_list_item_id'] ?? null),
            'price' => $validated['price'] ?? $autoSelectedPrice,
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

        // Handle additional items promotion to main if main is empty
        $additionalItems = $validated['additional_items'] ?? [];
        if (!$priceListItem && !empty($additionalItems) && !isset($validated['price_list_item_id'])) {
            $firstItem = array_shift($additionalItems);
            $diveData['price_list_item_id'] = $firstItem['price_list_item_id'];
            $diveData['price'] = $firstItem['price'];
            if (!empty($firstItem['dive_site_id'])) {
                $diveData['dive_site_id'] = $firstItem['dive_site_id'];
            }
        }

        // Auto-set completed_at if status is Completed
        if ($diveData['status'] === 'Completed' && !$diveData['completed_at']) {
            $diveData['completed_at'] = now();
        }

        DB::beginTransaction();
        try {
            $bookingDive = BookingDive::create($diveData);
            
            // Add extra dive sites for the main service
            if (!empty($validated['extra_dive_site_ids'])) {
                foreach ($validated['extra_dive_site_ids'] as $extraSiteId) {
                    $childData = $diveData;
                    $childData['parent_id'] = $bookingDive->id;
                    $childData['dive_site_id'] = $extraSiteId;
                    $childData['price'] = 0; // Extra sites for the same service are free
                    // Clear dive log fields for child sites as they will be filled later
                    $childData['dive_duration'] = null;
                    $childData['max_depth'] = null;
                    $childData['dive_log_notes'] = null;
                    $childData['status'] = 'Scheduled';
                    
                    BookingDive::create($childData);
                }
            }
            
            // Add remaining additional items
            if (!empty($additionalItems)) {
                foreach ($additionalItems as $item) {
                    $child = BookingDive::create([
                        'parent_id' => $bookingDive->id,
                        'booking_id' => $bookingId,
                        'dive_site_id' => !empty($item['dive_site_id']) ? $item['dive_site_id'] : $validated['dive_site_id'],
                        'dive_date' => $validated['dive_date'] ?? null,
                        'dive_time' => $validated['dive_time'] ?? null,
                        'price_list_item_id' => $item['price_list_item_id'],
                        'price' => $item['price'],
                        'status' => $validated['status'] ?? 'Scheduled',
                    ]);
                    \Log::info('Created child dive', ['id' => $child->id, 'site_id' => $child->dive_site_id]);
                }
            }
            
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
        // Verify dive belongs to user's dive center (via booking relationship)
        $bookingDive->load('booking');
        if (!$bookingDive->booking) {
            abort(404, 'Dive not found');
        }
        $this->authorizeDiveCenterAccess($bookingDive->booking, 'Unauthorized access to this dive');
        
        $bookingDive->load(['booking.customer', 'booking.diveGroup', 'diveSite', 'boat', 'priceListItem', 'bookingInstructors.user', 'additionalItems.priceListItem']);
        return $bookingDive;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BookingDive $bookingDive)
    {
        // Verify dive belongs to user's dive center (via booking relationship)
        $bookingDive->load('booking');
        if (!$bookingDive->booking) {
            abort(404, 'Dive not found');
        }
        $this->authorizeDiveCenterAccess($bookingDive->booking, 'Unauthorized access to this dive');
        
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'booking_id' => 'sometimes|exists:bookings,id',
            'dive_site_id' => 'sometimes|exists:dive_sites,id',
            'boat_id' => 'nullable|exists:boats,id',
            'dive_date' => 'nullable|date',
            'dive_time' => 'nullable|regex:/^([0-9]{2}:[0-9]{2})(:[0-9]{2})?$/',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'price' => 'nullable|numeric|min:0',
            'dive_duration' => 'nullable|integer|min:1|max:600',
            'max_depth' => 'nullable|numeric|min:0|max:200',
            'status' => 'nullable|in:Scheduled,In Progress,Completed,Cancelled',
            'completed_at' => 'nullable|date',
            'dive_log_notes' => 'nullable|string',
            'additional_items' => 'nullable|array',
            'additional_items.*.id' => 'nullable|exists:booking_dives,id',
            'additional_items.*.price_list_item_id' => 'required|exists:price_list_items,id',
            'additional_items.*.price' => 'required|numeric|min:0',
            'additional_items.*.dive_site_id' => 'nullable|exists:dive_sites,id',
            'extra_dive_site_ids' => 'nullable|array',
            'extra_dive_site_ids.*' => 'exists:dive_sites,id',
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

        // Handle additional items promotion to main if main is empty
        $additionalItems = $validated['additional_items'] ?? null;
        $extraDiveSiteIds = $validated['extra_dive_site_ids'] ?? null;
        $updateData = collect($validated)->except(['additional_items', 'extra_dive_site_ids'])->toArray();
        
        if ((!isset($updateData['price_list_item_id']) || $updateData['price_list_item_id'] === null) && !empty($additionalItems)) {
            $firstItem = array_shift($additionalItems);
            $updateData['price_list_item_id'] = $firstItem['price_list_item_id'];
            $updateData['price'] = $firstItem['price'];
            if (!empty($firstItem['dive_site_id'])) {
                $updateData['dive_site_id'] = $firstItem['dive_site_id'];
            }
        }

        $bookingDive->update($updateData);

        // Sync basic dive details to existing additional items
        $bookingDive->additionalItems()->update([
            'booking_id' => $bookingDive->booking_id,
            'dive_date' => $bookingDive->dive_date,
            'dive_time' => $bookingDive->dive_time,
            'status' => $bookingDive->status,
        ]);

        // Update additional items
        if ($additionalItems !== null) {
            $items = $additionalItems;
            $existingIds = [];

            foreach ($items as $item) {
                if (isset($item['id'])) {
                    // Update existing extra item
                    $extraItem = BookingDive::where('id', $item['id'])
                        ->where('parent_id', $bookingDive->id)
                        ->first();
                    if ($extraItem) {
                        $extraItem->update([
                            'price_list_item_id' => $item['price_list_item_id'],
                            'price' => $item['price'],
                            'dive_site_id' => !empty($item['dive_site_id']) ? $item['dive_site_id'] : $bookingDive->dive_site_id,
                        ]);
                        $existingIds[] = $extraItem->id;
                    }
                } else {
                    // Create new extra item
                    $newExtra = BookingDive::create([
                        'parent_id' => $bookingDive->id,
                        'booking_id' => $bookingDive->booking_id,
                        'dive_site_id' => !empty($item['dive_site_id']) ? $item['dive_site_id'] : $bookingDive->dive_site_id,
                        'dive_date' => $bookingDive->dive_date,
                        'dive_time' => $bookingDive->dive_time,
                        'price_list_item_id' => $item['price_list_item_id'],
                        'price' => $item['price'],
                        'status' => $bookingDive->status,
                    ]);
                    $existingIds[] = $newExtra->id;
                }
            }

            // Delete extra items not in the list
            $bookingDive->additionalItems()->whereNotIn('id', $existingIds)->delete();
        }

        // Update extra dive sites (price 0)
        if ($extraDiveSiteIds !== null) {
            // For extra sites, we treat them as children with price 0
            // We'll sync them by deleting existing price-0 children and re-creating
            // (Simpler than trying to match IDs for 0-price items)
            $bookingDive->additionalItems()->where('price', 0)->delete();
            
            foreach ($extraDiveSiteIds as $extraSiteId) {
                BookingDive::create([
                    'parent_id' => $bookingDive->id,
                    'booking_id' => $bookingDive->booking_id,
                    'dive_site_id' => $extraSiteId,
                    'dive_date' => $bookingDive->dive_date,
                    'dive_time' => $bookingDive->dive_time,
                    'price_list_item_id' => $bookingDive->price_list_item_id,
                    'price' => 0,
                    'status' => $bookingDive->status,
                ]);
            }
        }

        $bookingDive->load(['booking.customer', 'diveSite', 'boat', 'priceListItem', 'bookingInstructors.user', 'additionalItems.priceListItem']);
        
        return response()->json($bookingDive);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, BookingDive $bookingDive)
    {
        // Verify dive belongs to user's dive center (via booking relationship)
        $bookingDive->load('booking');
        if (!$bookingDive->booking) {
            abort(404, 'Dive not found');
        }
        $this->authorizeDiveCenterAccess($bookingDive->booking, 'Unauthorized access to this dive');

        $bookingDive->delete();
        return response()->noContent();
    }

    /**
     * Mark dive as completed and update log
     */
    public function complete(Request $request, BookingDive $bookingDive)
    {
        // Verify dive belongs to user's dive center (via booking relationship)
        $bookingDive->load('booking');
        if (!$bookingDive->booking) {
            abort(404, 'Dive not found');
        }
        $this->authorizeDiveCenterAccess($bookingDive->booking, 'Unauthorized access to this dive');

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
        // Verify dive belongs to user's dive center (via booking relationship)
        $bookingDive->load('booking');
        if (!$bookingDive->booking) {
            abort(404, 'Dive not found');
        }
        $this->authorizeDiveCenterAccess($bookingDive->booking, 'Unauthorized access to this dive');

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

