<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\PackageBooking;
use App\Services\PackageBookingService;
use Illuminate\Http\Request;

class PackageBookingController extends Controller
{
    use AuthorizesDiveCenterAccess;

    protected $bookingService;

    public function __construct(PackageBookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    /**
     * Display a listing of package bookings.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = PackageBooking::with(['package', 'customer', 'diveCenter'])
            ->where('dive_center_id', $diveCenterId);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by package
        if ($request->has('package_id')) {
            $query->where('package_id', $request->input('package_id'));
        }

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Store a newly created package booking.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'customer_id' => 'required|exists:customers,id',
            'persons_count' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'option_ids' => 'nullable|array',
            'option_ids.*' => 'exists:package_options,id',
            'status' => 'nullable|in:PENDING,CONFIRMED,PAID,CANCELLED,COMPLETED',
            'notes' => 'nullable|string',
        ]);

        // Validate package belongs to dive center
        $package = \App\Models\Package::where('id', $validated['package_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        // Validate customer belongs to dive center
        $customer = \App\Models\Customer::where('id', $validated['customer_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        $bookingData = array_merge($validated, [
            'dive_center_id' => $diveCenterId,
            'status' => $validated['status'] ?? 'PENDING',
        ]);

        $booking = $this->bookingService->createBooking($bookingData);

        return response()->json($booking, 201);
    }

    /**
     * Display the specified package booking.
     */
    public function show(PackageBooking $packageBooking)
    {
        $this->authorizeDiveCenterAccess($packageBooking, 'Unauthorized access to this package booking');

        $packageBooking->load(['package.components', 'package.options', 'package.pricingTiers', 'customer', 'diveCenter']);

        return response()->json($packageBooking);
    }

    /**
     * Update the specified package booking.
     */
    public function update(Request $request, PackageBooking $packageBooking)
    {
        $this->authorizeDiveCenterAccess($packageBooking, 'Unauthorized access to this package booking');

        $validated = $request->validate([
            'persons_count' => 'sometimes|integer|min:1',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|in:PENDING,CONFIRMED,PAID,CANCELLED,COMPLETED',
            'notes' => 'nullable|string',
        ]);

        // Recalculate price if persons_count changed
        if (isset($validated['persons_count']) && $validated['persons_count'] !== $packageBooking->persons_count) {
            $validated['total_price'] = $packageBooking->package->calculatePrice(
                $validated['persons_count'],
                [] // Options not changed in update
            );
        }

        $packageBooking->update($validated);

        return response()->json($packageBooking->load(['package', 'customer', 'diveCenter']));
    }

    /**
     * Calculate price for package booking.
     */
    public function calculate(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'persons_count' => 'required|integer|min:1',
            'option_ids' => 'nullable|array',
            'option_ids.*' => 'exists:package_options,id',
        ]);

        // Validate package belongs to dive center
        $package = \App\Models\Package::where('id', $validated['package_id'])
            ->where('dive_center_id', $diveCenterId)
            ->firstOrFail();

        $price = $package->calculatePrice(
            $validated['persons_count'],
            $validated['option_ids'] ?? []
        );

        return response()->json([
            'package_id' => $package->id,
            'persons_count' => $validated['persons_count'],
            'option_ids' => $validated['option_ids'] ?? [],
            'total_price' => $price,
        ]);
    }

    /**
     * Create regular bookings from package booking.
     */
    public function createBookings(Request $request, PackageBooking $packageBooking)
    {
        $this->authorizeDiveCenterAccess($packageBooking, 'Unauthorized access to this package booking');

        $validated = $request->validate([
            'create_per_day' => 'nullable|boolean',
        ]);

        $createPerDay = $validated['create_per_day'] ?? true;

        $bookings = $this->bookingService->createBookingsFromPackageBooking(
            $packageBooking->id,
            $createPerDay
        );

        return response()->json([
            'message' => 'Bookings created successfully',
            'bookings' => $bookings,
            'count' => count($bookings),
        ], 201);
    }
}
