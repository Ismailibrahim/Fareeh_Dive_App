<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DivePackage;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DivePackageController extends Controller
{
    /**
     * Display a listing of dive packages.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = DivePackage::with(['customer', 'packagePriceListItem'])
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
     * Store a newly created dive package.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'package_price_list_item_id' => 'required|exists:price_list_items,id',
            'package_total_price' => 'required|numeric|min:0',
            'package_per_dive_price' => 'nullable|numeric|min:0',
            'package_total_dives' => 'required|integer|min:1',
            'package_duration_days' => 'required|integer|min:1',
            'package_start_date' => 'required|date',
            'package_end_date' => 'nullable|date|after:package_start_date',
            'create_bookings_now' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        // Validate customer belongs to dive center
        $customer = \App\Models\Customer::where('id', $validated['customer_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate price list item belongs to dive center and is a package type
        $priceListItem = \App\Models\PriceListItem::where('id', $validated['package_price_list_item_id'])
            ->whereHas('priceList', function ($q) use ($diveCenterId) {
                $q->where('dive_center_id', $diveCenterId);
            })
            ->firstOrFail();

        // Calculate per-dive price if not provided
        if (!isset($validated['package_per_dive_price'])) {
            $validated['package_per_dive_price'] = $validated['package_total_price'] / $validated['package_total_dives'];
        }

        DB::beginTransaction();
        try {
            $package = DivePackage::create([
                'dive_center_id' => $diveCenterId,
                'customer_id' => $validated['customer_id'],
                'package_price_list_item_id' => $validated['package_price_list_item_id'],
                'package_total_price' => $validated['package_total_price'],
                'package_per_dive_price' => $validated['package_per_dive_price'],
                'package_total_dives' => $validated['package_total_dives'],
                'package_duration_days' => $validated['package_duration_days'],
                'package_start_date' => $validated['package_start_date'],
                'package_end_date' => $validated['package_end_date'] ?? null,
                'status' => 'Active',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create bookings if requested
            if ($validated['create_bookings_now'] ?? false) {
                for ($day = 1; $day <= $validated['package_duration_days']; $day++) {
                    Booking::create([
                        'dive_center_id' => $diveCenterId,
                        'customer_id' => $validated['customer_id'],
                        'dive_package_id' => $package->id,
                        'package_day_number' => $day,
                        'booking_date' => date('Y-m-d', strtotime($validated['package_start_date'] . " +" . ($day - 1) . " days")),
                        'status' => 'Pending',
                    ]);
                }
            }

            DB::commit();

            $package->load(['customer', 'packagePriceListItem', 'bookings']);
            return response()->json($package, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create package',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified dive package.
     */
    public function show(Request $request, DivePackage $divePackage)
    {
        $user = $request->user();
        
        // Verify package belongs to user's dive center
        if ($user->dive_center_id && $divePackage->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Package not found'], 404);
        }

        $divePackage->load(['customer', 'packagePriceListItem', 'bookings.bookingDives', 'bookingDives']);
        return response()->json($divePackage);
    }

    /**
     * Update the specified dive package.
     */
    public function update(Request $request, DivePackage $divePackage)
    {
        $user = $request->user();
        
        // Verify package belongs to user's dive center
        if ($user->dive_center_id && $divePackage->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Package not found'], 404);
        }

        $validated = $request->validate([
            'package_end_date' => 'nullable|date|after:package_start_date',
            'status' => 'nullable|in:Active,Completed,Expired,Cancelled',
            'notes' => 'nullable|string',
        ]);

        $divePackage->update($validated);
        $divePackage->load(['customer', 'packagePriceListItem', 'bookings']);

        return response()->json($divePackage);
    }

    /**
     * Remove the specified dive package.
     */
    public function destroy(Request $request, DivePackage $divePackage)
    {
        $user = $request->user();
        
        // Verify package belongs to user's dive center
        if ($user->dive_center_id && $divePackage->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Package not found'], 404);
        }

        // Prevent deletion if dives have been used
        if ($divePackage->package_dives_used > 0) {
            return response()->json([
                'message' => 'Cannot delete package with used dives'
            ], 422);
        }

        $divePackage->delete();
        return response()->noContent();
    }

    /**
     * Get package status
     */
    public function status(Request $request, DivePackage $divePackage)
    {
        $user = $request->user();
        
        // Verify package belongs to user's dive center
        if ($user->dive_center_id && $divePackage->dive_center_id !== $user->dive_center_id) {
            return response()->json(['message' => 'Package not found'], 404);
        }

        return response()->json([
            'remaining_dives' => $divePackage->remainingDives(),
            'total_dives' => $divePackage->package_total_dives,
            'dives_used' => $divePackage->package_dives_used,
            'is_active' => $divePackage->isActive(),
            'can_add_dive' => $divePackage->canAddDive(),
            'status' => $divePackage->status,
            'bookings_count' => $divePackage->bookings()->count(),
            'dives_scheduled' => $divePackage->bookingDives()->count(),
        ]);
    }
}

