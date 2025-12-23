<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\Package;
use App\Services\PackageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PackageController extends Controller
{
    use AuthorizesDiveCenterAccess;

    protected $packageService;

    public function __construct(PackageService $packageService)
    {
        $this->packageService = $packageService;
    }

    /**
     * Display a listing of packages.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $query = Package::with(['components', 'options', 'pricingTiers'])
            ->where('dive_center_id', $diveCenterId);

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        } else {
            $query->active(); // Default to active only
        }

        // Search by name or code
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('package_code', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('sort_order')->orderBy('name')->paginate(20);
    }

    /**
     * Store a newly created package.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;

        $validated = $request->validate([
            'package_code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'nights' => 'nullable|integer|min:0',
            'days' => 'nullable|integer|min:1',
            'total_dives' => 'nullable|integer|min:0',
            'base_price' => 'required|numeric|min:0',
            'price_per_person' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'components' => 'nullable|array',
            'components.*.component_type' => 'required|in:TRANSFER,ACCOMMODATION,DIVE,EXCURSION,MEAL,EQUIPMENT,OTHER',
            'components.*.name' => 'required|string|max:255',
            'components.*.description' => 'nullable|string',
            'components.*.item_id' => 'nullable|exists:price_list_items,id',
            'components.*.unit_price' => 'required|numeric|min:0',
            'components.*.quantity' => 'required|integer|min:1',
            'components.*.unit' => 'nullable|string|max:50',
            'components.*.is_inclusive' => 'nullable|boolean',
            'components.*.sort_order' => 'nullable|integer',
            'options' => 'nullable|array',
            'options.*.name' => 'required|string|max:255',
            'options.*.description' => 'nullable|string',
            'options.*.item_id' => 'nullable|exists:price_list_items,id',
            'options.*.price' => 'required|numeric|min:0',
            'options.*.unit' => 'nullable|string|max:50',
            'options.*.is_active' => 'nullable|boolean',
            'options.*.max_quantity' => 'nullable|integer|min:1',
            'options.*.sort_order' => 'nullable|integer',
            'pricing_tiers' => 'nullable|array',
            'pricing_tiers.*.min_persons' => 'required|integer|min:1',
            'pricing_tiers.*.max_persons' => 'nullable|integer|gte:pricing_tiers.*.min_persons',
            'pricing_tiers.*.price_per_person' => 'required|numeric|min:0',
            'pricing_tiers.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'pricing_tiers.*.is_active' => 'nullable|boolean',
        ]);

        // Check unique package_code per dive center
        $exists = Package::where('dive_center_id', $diveCenterId)
            ->where('package_code', $validated['package_code'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Package code already exists for this dive center',
            ], 422);
        }

        $packageData = array_merge($validated, [
            'dive_center_id' => $diveCenterId,
            'currency' => $validated['currency'] ?? 'USD',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $components = $validated['components'] ?? [];
        $options = $validated['options'] ?? [];
        $tiers = $validated['pricing_tiers'] ?? [];

        $package = $this->packageService->createPackage($packageData, $components, $options, $tiers);

        return response()->json($package, 201);
    }

    /**
     * Display the specified package.
     */
    public function show(Package $package)
    {
        $this->authorizeDiveCenterAccess($package, 'Unauthorized access to this package');

        $package->load(['components', 'options', 'pricingTiers', 'diveCenter']);

        return response()->json($package);
    }

    /**
     * Update the specified package.
     */
    public function update(Request $request, Package $package)
    {
        $this->authorizeDiveCenterAccess($package, 'Unauthorized access to this package');

        $validated = $request->validate([
            'package_code' => 'sometimes|string|max:50',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'nights' => 'nullable|integer|min:0',
            'days' => 'nullable|integer|min:1',
            'total_dives' => 'nullable|integer|min:0',
            'base_price' => 'sometimes|numeric|min:0',
            'price_per_person' => 'sometimes|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'components' => 'nullable|array',
            'components.*.component_type' => 'required|in:TRANSFER,ACCOMMODATION,DIVE,EXCURSION,MEAL,EQUIPMENT,OTHER',
            'components.*.name' => 'required|string|max:255',
            'components.*.description' => 'nullable|string',
            'components.*.item_id' => 'nullable|exists:price_list_items,id',
            'components.*.unit_price' => 'required|numeric|min:0',
            'components.*.quantity' => 'required|integer|min:1',
            'components.*.unit' => 'nullable|string|max:50',
            'components.*.is_inclusive' => 'nullable|boolean',
            'components.*.sort_order' => 'nullable|integer',
            'options' => 'nullable|array',
            'options.*.name' => 'required|string|max:255',
            'options.*.description' => 'nullable|string',
            'options.*.item_id' => 'nullable|exists:price_list_items,id',
            'options.*.price' => 'required|numeric|min:0',
            'options.*.unit' => 'nullable|string|max:50',
            'options.*.is_active' => 'nullable|boolean',
            'options.*.max_quantity' => 'nullable|integer|min:1',
            'options.*.sort_order' => 'nullable|integer',
            'pricing_tiers' => 'nullable|array',
            'pricing_tiers.*.min_persons' => 'required|integer|min:1',
            'pricing_tiers.*.max_persons' => 'nullable|integer|gte:pricing_tiers.*.min_persons',
            'pricing_tiers.*.price_per_person' => 'required|numeric|min:0',
            'pricing_tiers.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'pricing_tiers.*.is_active' => 'nullable|boolean',
        ]);

        // Check unique package_code if changed
        if (isset($validated['package_code']) && $validated['package_code'] !== $package->package_code) {
            $exists = Package::where('dive_center_id', $package->dive_center_id)
                ->where('package_code', $validated['package_code'])
                ->where('id', '!=', $package->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Package code already exists for this dive center',
                ], 422);
            }
        }

        $packageData = array_filter($validated, function ($key) {
            return !in_array($key, ['components', 'options', 'pricing_tiers']);
        }, ARRAY_FILTER_USE_KEY);

        $components = $validated['components'] ?? [];
        $options = $validated['options'] ?? [];
        $tiers = $validated['pricing_tiers'] ?? [];

        $package = $this->packageService->updatePackage($package, $packageData, $components, $options, $tiers);

        return response()->json($package);
    }

    /**
     * Remove the specified package (soft delete).
     */
    public function destroy(Package $package)
    {
        $this->authorizeDiveCenterAccess($package, 'Unauthorized access to this package');

        $package->delete();

        return response()->json(['message' => 'Package deleted successfully']);
    }

    /**
     * Get package breakdown.
     */
    public function breakdown(Package $package)
    {
        $this->authorizeDiveCenterAccess($package, 'Unauthorized access to this package');

        $breakdown = $this->packageService->getBreakdown($package->id);

        return response()->json([
            'package' => $package->load(['components', 'options', 'pricingTiers']),
            'breakdown' => $breakdown,
        ]);
    }

    /**
     * Calculate price for package.
     */
    public function calculate(Request $request, Package $package)
    {
        $this->authorizeDiveCenterAccess($package, 'Unauthorized access to this package');

        $validated = $request->validate([
            'persons' => 'required|integer|min:1',
            'option_ids' => 'nullable|array',
            'option_ids.*' => 'exists:package_options,id',
        ]);

        $price = $this->packageService->calculatePrice(
            $package->id,
            $validated['persons'],
            $validated['option_ids'] ?? []
        );

        return response()->json([
            'package_id' => $package->id,
            'persons' => $validated['persons'],
            'option_ids' => $validated['option_ids'] ?? [],
            'total_price' => $price,
        ]);
    }
}
