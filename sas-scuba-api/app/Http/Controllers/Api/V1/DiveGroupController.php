<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\DiveGroup;
use App\Models\Booking;
use App\Models\BookingDive;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiveGroupController extends Controller
{
    use AuthorizesDiveCenterAccess;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;

            if (!$diveCenterId) {
                return response()->json([
                    'message' => 'User dive center not found'
                ], 400);
            }

            $query = DiveGroup::where('dive_center_id', $diveCenterId)
                ->with(['agent'])
                ->withCount('members');

            // Search
            if ($request->has('search') && !empty($request->get('search'))) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('group_name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by agent
            if ($request->has('agent_id')) {
                $query->where('agent_id', $request->get('agent_id'));
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->get('status'));
            }

            $perPage = $request->get('per_page', 20);
            $perPage = min(max($perPage, 1), 100);

            $groups = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Add member count from withCount
            $groups->getCollection()->transform(function ($group) {
                $group->member_count = $group->members_count ?? 0;
                return $group;
            });

            return $groups;
        } catch (\Exception $e) {
            \Log::error('DiveGroup index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to fetch dive groups',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'group_name' => 'required|string|max:255|unique:dive_groups,group_name,NULL,id,dive_center_id,' . $diveCenterId,
            'agent_id' => 'nullable|exists:agents,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:Active,Inactive',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:customers,id',
        ]);

        // Validate agent belongs to dive center if provided
        if (isset($validated['agent_id'])) {
            $agent = \App\Models\Agent::where('id', $validated['agent_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }

        DB::beginTransaction();
        try {
            $group = DiveGroup::create([
                'dive_center_id' => $diveCenterId,
                'group_name' => $validated['group_name'],
                'agent_id' => $validated['agent_id'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'Active',
                'created_by' => $user->id,
            ]);

            // Add members if provided
            if (isset($validated['member_ids']) && !empty($validated['member_ids'])) {
                foreach ($validated['member_ids'] as $customerId) {
                    // Validate customer belongs to dive center
                    $customer = \App\Models\Customer::where('id', $customerId)
                        ->where('dive_center_id', $diveCenterId)
                        ->firstOrFail();

                    // Check if customer can be added
                    if (!$group->canAddMember($customerId)) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Customer {$customer->full_name} is already in another active group",
                            'customer_id' => $customerId
                        ], 422);
                    }

                    $group->members()->attach($customerId, ['joined_at' => now()]);
                }
            }

            DB::commit();

            $group->load(['agent', 'members', 'createdBy']);
            $group->member_count = $group->members ? $group->members->count() : 0;

            return response()->json($group, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create dive group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, DiveGroup $diveGroup)
    {
        $this->authorizeDiveCenterAccess($diveGroup, 'Unauthorized access to this dive group');

        $diveGroup->load(['agent', 'members', 'createdBy', 'bookings.customer', 'bookings.bookingDives']);

        // Get related invoices for group members
        $customerIds = $diveGroup->members ? $diveGroup->members->pluck('id')->toArray() : [];
        $bookings = [];
        if (!empty($customerIds)) {
            $bookings = Booking::whereIn('customer_id', $customerIds)
                ->where('dive_center_id', $diveGroup->dive_center_id)
                ->with('invoices')
                ->get();
        }

        $diveGroup->related_invoices = collect($bookings)->pluck('invoices')->flatten()->unique('id')->values();

        $diveGroup->member_count = $diveGroup->members ? $diveGroup->members->count() : 0;

        return $diveGroup;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DiveGroup $diveGroup)
    {
        $this->authorizeDiveCenterAccess($diveGroup, 'Unauthorized access to this dive group');

        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'group_name' => 'sometimes|string|max:255|unique:dive_groups,group_name,' . $diveGroup->id . ',id,dive_center_id,' . $diveCenterId,
            'agent_id' => 'nullable|exists:agents,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:Active,Inactive',
        ]);

        // Validate agent belongs to dive center if provided
        if (isset($validated['agent_id'])) {
            $agent = \App\Models\Agent::where('id', $validated['agent_id'])
                ->where('dive_center_id', $diveCenterId)
                ->firstOrFail();
        }

        $diveGroup->update($validated);

        $diveGroup->load(['agent', 'members', 'createdBy']);
        $diveGroup->member_count = $diveGroup->members ? $diveGroup->members->count() : 0;

        return response()->json($diveGroup);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DiveGroup $diveGroup)
    {
        $this->authorizeDiveCenterAccess($diveGroup, 'Unauthorized access to this dive group');

        $diveGroup->delete();

        return response()->noContent();
    }

    /**
     * Add a member to the dive group.
     */
    public function addMember(Request $request, DiveGroup $diveGroup)
    {
        $this->authorizeDiveCenterAccess($diveGroup, 'Unauthorized access to this dive group');

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
        ]);

        // Validate customer belongs to dive center
        $customer = \App\Models\Customer::where('id', $validated['customer_id'])
            ->where('dive_center_id', $diveGroup->dive_center_id)
            ->firstOrFail();

        // Check if customer can be added
        if (!$diveGroup->canAddMember($validated['customer_id'])) {
            return response()->json([
                'message' => "Customer {$customer->full_name} is already in another active group",
                'customer_id' => $validated['customer_id']
            ], 422);
        }

        $diveGroup->members()->syncWithoutDetaching([$validated['customer_id'] => ['joined_at' => now()]]);

        $diveGroup->load(['agent', 'members', 'createdBy']);
        $diveGroup->member_count = $diveGroup->members ? $diveGroup->members->count() : 0;

        return response()->json($diveGroup);
    }

    /**
     * Remove a member from the dive group.
     */
    public function removeMember(Request $request, DiveGroup $diveGroup, $customerId)
    {
        $this->authorizeDiveCenterAccess($diveGroup, 'Unauthorized access to this dive group');

        // Validate customer belongs to dive center
        $customer = \App\Models\Customer::where('id', $customerId)
            ->where('dive_center_id', $diveGroup->dive_center_id)
            ->firstOrFail();

        $diveGroup->members()->detach($customerId);

        $diveGroup->load(['agent', 'members', 'createdBy']);
        $diveGroup->member_count = $diveGroup->members ? $diveGroup->members->count() : 0;

        return response()->json($diveGroup);
    }

    /**
     * Book dives for all group members.
     */
    public function bookGroup(Request $request, DiveGroup $diveGroup)
    {
        $this->authorizeDiveCenterAccess($diveGroup, 'Unauthorized access to this dive group');

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

        $validated = $request->validate([
            'booking_type' => 'required|in:individual,group',
            'dive_site_id' => 'required|exists:dive_sites,id',
            'boat_id' => 'nullable|exists:boats,id',
            'dive_date' => 'nullable|date',
            'dive_time' => 'nullable|date_format:H:i',
            'price_list_item_id' => 'nullable|exists:price_list_items,id',
            'price' => 'nullable|numeric|min:0',
            'booking_date' => 'nullable|date',
            'number_of_divers' => 'nullable|integer|min:1',
            'status' => 'nullable|in:Scheduled,In Progress,Completed,Cancelled',
        ]);

        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        // Validate dive site belongs to dive center
        $diveSite = \App\Models\DiveSite::where('id', $validated['dive_site_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $bookings = [];
            $bookingDives = [];

            if ($validated['booking_type'] === 'individual') {
                // Create one booking per customer
                foreach ($members as $member) {
                    $booking = Booking::create([
                        'dive_center_id' => $diveCenterId,
                        'customer_id' => $member->id,
                        'agent_id' => $diveGroup->agent_id,
                        'dive_group_id' => $diveGroup->id,
                        'booking_date' => $validated['booking_date'] ?? $validated['dive_date'] ?? now()->toDateString(),
                        'number_of_divers' => $validated['number_of_divers'] ?? 1,
                        'status' => 'Pending',
                    ]);

                    $bookingDive = BookingDive::create([
                        'booking_id' => $booking->id,
                        'dive_site_id' => $validated['dive_site_id'],
                        'boat_id' => $validated['boat_id'] ?? null,
                        'dive_date' => $validated['dive_date'] ?? null,
                        'dive_time' => $validated['dive_time'] ?? null,
                        'price_list_item_id' => $validated['price_list_item_id'] ?? null,
                        'price' => $validated['price'] ?? null,
                        'status' => $validated['status'] ?? 'Scheduled',
                    ]);

                    $bookings[] = $booking;
                    $bookingDives[] = $bookingDive;
                }
            } else {
                // Create one booking for the group (using first member as primary)
                $primaryMember = $members->first();
                $booking = Booking::create([
                    'dive_center_id' => $diveCenterId,
                    'customer_id' => $primaryMember->id,
                    'agent_id' => $diveGroup->agent_id,
                    'dive_group_id' => $diveGroup->id,
                    'booking_date' => $validated['booking_date'] ?? $validated['dive_date'] ?? now()->toDateString(),
                    'number_of_divers' => $validated['number_of_divers'] ?? $members->count(),
                    'status' => 'Pending',
                    'notes' => "Group booking for: {$diveGroup->group_name}",
                ]);

                // Create one dive for the group booking
                $bookingDive = BookingDive::create([
                    'booking_id' => $booking->id,
                    'dive_site_id' => $validated['dive_site_id'],
                    'boat_id' => $validated['boat_id'] ?? null,
                    'dive_date' => $validated['dive_date'] ?? null,
                    'dive_time' => $validated['dive_time'] ?? null,
                    'price_list_item_id' => $validated['price_list_item_id'] ?? null,
                    'price' => $validated['price'] ?? null,
                    'status' => $validated['status'] ?? 'Scheduled',
                ]);

                $bookings[] = $booking;
                $bookingDives[] = $bookingDive;
            }

            DB::commit();

            return response()->json([
                'message' => 'Bookings created successfully',
                'bookings' => $bookings,
                'booking_dives' => $bookingDives,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create bookings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate invoice(s) for the dive group.
     */
    public function generateInvoice(Request $request, DiveGroup $diveGroup)
    {
        $this->authorizeDiveCenterAccess($diveGroup, 'Unauthorized access to this dive group');

        if (!$diveGroup->agent_id) {
            return response()->json([
                'message' => 'Group must have an agent to generate invoice'
            ], 422);
        }

        $validated = $request->validate([
            'invoice_type' => 'required|in:single,separate',
            'booking_ids' => 'nullable|array',
            'booking_ids.*' => 'exists:bookings,id',
            'invoice_type_detail' => 'nullable|in:Advance,Final,Full',
            'include_dives' => 'nullable|boolean',
            'include_equipment' => 'nullable|boolean',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        // Get bookings for group members
        $customerIds = $diveGroup->members()->pluck('customers.id');
        $query = Booking::whereIn('customer_id', $customerIds)
            ->where('dive_center_id', $diveCenterId)
            ->with(['bookingDives', 'bookingEquipment', 'diveCenter']);

        // Filter by booking_ids if provided
        if (isset($validated['booking_ids']) && !empty($validated['booking_ids'])) {
            $query->whereIn('id', $validated['booking_ids']);
        }

        $bookings = $query->get();

        if ($bookings->isEmpty()) {
            return response()->json([
                'message' => 'No bookings found for group members'
            ], 422);
        }

        $includeDives = $validated['include_dives'] ?? true;
        $includeEquipment = $validated['include_equipment'] ?? true;
        $invoiceTypeDetail = $validated['invoice_type_detail'] ?? 'Full';

        // Get tax percentage
        $diveCenter = $diveGroup->diveCenter;
        $diveCenterSettings = $diveCenter->settings ?? [];
        $defaultTaxPercentage = is_array($diveCenterSettings) && isset($diveCenterSettings['tax_percentage'])
            ? $diveCenterSettings['tax_percentage']
            : 0;
        $taxPercentage = $validated['tax_percentage'] ?? $defaultTaxPercentage;

        DB::beginTransaction();
        try {
            $invoices = [];

            if ($validated['invoice_type'] === 'single') {
                // Create one invoice covering all bookings
                $invoice = Invoice::create([
                    'dive_center_id' => $diveCenterId,
                    'agent_id' => $diveGroup->agent_id,
                    'invoice_no' => null,
                    'invoice_date' => now()->toDateString(),
                    'invoice_type' => $invoiceTypeDetail,
                    'status' => 'Draft',
                    'currency' => $diveCenter->currency ?? 'USD',
                ]);

                $invoice->invoice_no = $invoice->generateInvoiceNumber();
                $invoice->save();

                $subtotal = 0;

                // Add items from all bookings
                foreach ($bookings as $booking) {
                    // Add completed dives
                    if ($includeDives) {
                        $completedDives = $booking->bookingDives()
                            ->where('status', 'Completed')
                            ->whereDoesntHave('invoiceItems')
                            ->with(['diveSite', 'priceListItem'])
                            ->get();

                        foreach ($completedDives as $dive) {
                            $price = $dive->price ?? 0;
                            InvoiceItem::create([
                                'invoice_id' => $invoice->id,
                                'booking_dive_id' => $dive->id,
                                'price_list_item_id' => $dive->price_list_item_id,
                                'description' => 'Dive - ' . ($dive->diveSite->name ?? 'Unknown') . ' - ' . ($dive->dive_date ? date('M d, Y', strtotime($dive->dive_date)) : '') . ' (' . ($booking->customer->full_name ?? 'Unknown') . ')',
                                'quantity' => 1,
                                'unit_price' => $price,
                                'total' => $price,
                            ]);
                            $subtotal += $price;
                        }
                    }

                    // Add equipment rentals
                    if ($includeEquipment) {
                        $equipment = $booking->bookingEquipment()
                            ->whereDoesntHave('invoiceItems')
                            ->with(['equipmentItem.equipment'])
                            ->get();

                        foreach ($equipment as $eq) {
                            $price = $eq->price ?? 0;
                            InvoiceItem::create([
                                'invoice_id' => $invoice->id,
                                'booking_equipment_id' => $eq->id,
                                'description' => ($eq->equipmentItem->equipment->name ?? 'Equipment') . ($eq->equipmentItem->size ? ' - ' . $eq->equipmentItem->size : '') . ' (' . ($booking->customer->full_name ?? 'Unknown') . ')',
                                'quantity' => 1,
                                'unit_price' => $price,
                                'total' => $price,
                            ]);
                            $subtotal += $price;
                        }
                    }
                }

                // Calculate totals
                $subtotal = round($subtotal, 2);
                $tax = round($subtotal * ($taxPercentage / 100), 2);
                $total = round($subtotal + $tax, 2);

                $invoice->update([
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total' => $total,
                ]);

                $invoice->load(['agent', 'invoiceItems']);
                $invoices[] = $invoice;
            } else {
                // Create separate invoice per booking
                foreach ($bookings as $booking) {
                    $invoice = Invoice::create([
                        'dive_center_id' => $diveCenterId,
                        'booking_id' => $booking->id,
                        'customer_id' => $booking->customer_id,
                        'agent_id' => $diveGroup->agent_id,
                        'invoice_no' => null,
                        'invoice_date' => now()->toDateString(),
                        'invoice_type' => $invoiceTypeDetail,
                        'status' => 'Draft',
                        'currency' => $diveCenter->currency ?? 'USD',
                    ]);

                    $invoice->invoice_no = $invoice->generateInvoiceNumber();
                    $invoice->save();

                    $subtotal = 0;

                    // Add completed dives
                    if ($includeDives) {
                        $completedDives = $booking->bookingDives()
                            ->where('status', 'Completed')
                            ->whereDoesntHave('invoiceItems')
                            ->with(['diveSite', 'priceListItem'])
                            ->get();

                        foreach ($completedDives as $dive) {
                            $price = $dive->price ?? 0;
                            InvoiceItem::create([
                                'invoice_id' => $invoice->id,
                                'booking_dive_id' => $dive->id,
                                'price_list_item_id' => $dive->price_list_item_id,
                                'description' => 'Dive - ' . ($dive->diveSite->name ?? 'Unknown') . ' - ' . ($dive->dive_date ? date('M d, Y', strtotime($dive->dive_date)) : ''),
                                'quantity' => 1,
                                'unit_price' => $price,
                                'total' => $price,
                            ]);
                            $subtotal += $price;
                        }
                    }

                    // Add equipment rentals
                    if ($includeEquipment) {
                        $equipment = $booking->bookingEquipment()
                            ->whereDoesntHave('invoiceItems')
                            ->with(['equipmentItem.equipment'])
                            ->get();

                        foreach ($equipment as $eq) {
                            $price = $eq->price ?? 0;
                            InvoiceItem::create([
                                'invoice_id' => $invoice->id,
                                'booking_equipment_id' => $eq->id,
                                'description' => ($eq->equipmentItem->equipment->name ?? 'Equipment') . ($eq->equipmentItem->size ? ' - ' . $eq->equipmentItem->size : ''),
                                'quantity' => 1,
                                'unit_price' => $price,
                                'total' => $price,
                            ]);
                            $subtotal += $price;
                        }
                    }

                    // Calculate totals
                    $subtotal = round($subtotal, 2);
                    $tax = round($subtotal * ($taxPercentage / 100), 2);
                    $total = round($subtotal + $tax, 2);

                    $invoice->update([
                        'subtotal' => $subtotal,
                        'tax' => $tax,
                        'total' => $total,
                    ]);

                    $invoice->load(['booking.customer', 'agent', 'invoiceItems']);
                    $invoices[] = $invoice;
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Invoices created successfully',
                'invoices' => $invoices,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

