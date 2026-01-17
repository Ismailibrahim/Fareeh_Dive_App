<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\PriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PriceListController extends Controller
{
    use AuthorizesDiveCenterAccess;
    /**
     * Display a listing of price lists for the authenticated user's dive center.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;
            
            if (!$diveCenterId) {
                return response()->json(['message' => 'Dive center not found'], 404);
            }

            // Get pagination parameters
            $perPage = $request->get('per_page', 20);
            $perPage = min(max($perPage, 1), 100);
            
            // Cache key includes dive center ID and pagination
            $cacheKey = "price_lists_{$diveCenterId}_{$perPage}";
            
            // Cache for 30 minutes (1800 seconds)
            $priceLists = Cache::remember($cacheKey, 1800, function () use ($diveCenterId, $perPage) {
                return PriceList::where('dive_center_id', $diveCenterId)
                    ->with('items')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);
            });

            $diveCenter = $user->diveCenter;
            // Add base currency info to each price list
            foreach ($priceLists->items() as $priceList) {
                $priceList->base_currency = $diveCenter?->currency ?? 'USD';
            }

            return response()->json($priceLists);
        } catch (\Exception $e) {
            \Log::error('PriceListController::index error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created price list.
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;
            
            if (!$diveCenterId) {
                return response()->json(['message' => 'Dive center not found'], 404);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'notes' => 'nullable|string',
            ]);

            $priceList = PriceList::create([
                'dive_center_id' => $diveCenterId,
                'name' => $validated['name'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $priceList->load('items');
            $diveCenter = $user->diveCenter;
            $priceList->base_currency = $diveCenter?->currency ?? 'USD';

            // Invalidate price lists cache for this dive center
            $this->clearPriceListsCache($diveCenterId);

            return response()->json($priceList, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('PriceListController::store database error: ' . $e->getMessage());
            \Log::error('SQL: ' . $e->getSql());
            \Log::error('Bindings: ' . json_encode($e->getBindings()));
            
            // Check if it's a unique constraint violation
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'message' => 'A price list with this name may already exist for your dive center.',
                    'error' => 'duplicate_entry'
                ], 409);
            }
            
            return response()->json([
                'message' => 'Database error occurred',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the price list'
            ], 500);
        } catch (\Exception $e) {
            \Log::error('PriceListController::store error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'An error occurred',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the price list'
            ], 500);
        }
    }

    /**
     * Display the specified price list.
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            $priceList = PriceList::findOrFail($id);
            
            // Verify price list belongs to user's dive center
            $this->authorizeDiveCenterAccess($priceList, 'Unauthorized access to this price list');

            $priceList->load('items');
            $diveCenter = $user->diveCenter;
            $priceList->base_currency = $diveCenter?->currency ?? 'USD';

            return response()->json($priceList);
        } catch (\Exception $e) {
            \Log::error('PriceListController::show error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified price list.
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;
            
            if (!$diveCenterId) {
                return response()->json(['message' => 'Dive center not found'], 404);
            }

            $priceList = PriceList::findOrFail($id);
            
            // Verify price list belongs to user's dive center
            $this->authorizeDiveCenterAccess($priceList, 'Unauthorized access to this price list');

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'notes' => 'nullable|string',
            ]);

            $priceList->update($validated);
            $priceList->load('items');
            $diveCenter = $user->diveCenter;
            $priceList->base_currency = $diveCenter?->currency ?? 'USD';

            // Invalidate price lists cache for this dive center
            $this->clearPriceListsCache($diveCenterId);

            return response()->json($priceList);
        } catch (\Exception $e) {
            \Log::error('PriceListController::update error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified price list.
     */
    public function destroy(Request $request, $id)
    {
        try {
            $priceList = PriceList::findOrFail($id);
            
            // Verify price list belongs to user's dive center
            $this->authorizeDiveCenterAccess($priceList, 'Unauthorized access to this price list');

            $priceList->delete();

            // Invalidate price lists cache for this dive center
            $this->clearPriceListsCache($diveCenterId);

            return response()->json(['message' => 'Price list deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error('PriceListController::destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Duplicate a price list with all its items.
     */
    public function duplicate(Request $request, $id)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;
            
            if (!$diveCenterId) {
                return response()->json(['message' => 'Dive center not found'], 404);
            }

            $sourcePriceList = PriceList::findOrFail($id);
            
            // Verify source price list belongs to user's dive center
            $this->authorizeDiveCenterAccess($sourcePriceList, 'Unauthorized access to this price list');

            $validated = $request->validate([
                'name' => 'required|string|max:255',
            ]);

            // Use database transaction to ensure data consistency
            return \DB::transaction(function () use ($sourcePriceList, $validated, $diveCenterId, $user) {
                // Create new price list
                $newPriceList = PriceList::create([
                    'dive_center_id' => $diveCenterId,
                    'name' => $validated['name'],
                    'notes' => $sourcePriceList->notes,
                ]);

                // Copy all items from source price list
                foreach ($sourcePriceList->items as $item) {
                    \App\Models\PriceListItem::create([
                        'price_list_id' => $newPriceList->id,
                        'service_type' => $item->service_type,
                        'equipment_item_id' => $item->equipment_item_id,
                        'name' => $item->name,
                        'description' => $item->description,
                        'price' => $item->price,
                        'unit' => $item->unit,
                        'tax_percentage' => $item->tax_percentage,
                        'tax_inclusive' => $item->tax_inclusive,
                        'service_charge_inclusive' => $item->service_charge_inclusive,
                        'sort_order' => $item->sort_order,
                        'is_active' => $item->is_active,
                    ]);
                }

                // Load items and add base currency
                $newPriceList->load('items');
                $diveCenter = $user->diveCenter;
                $newPriceList->base_currency = $diveCenter?->currency ?? 'USD';

                // Invalidate price lists cache for this dive center
                $this->clearPriceListsCache($diveCenterId);

                return response()->json($newPriceList, 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('PriceListController::duplicate error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Clear price lists cache for a dive center
     */
    private function clearPriceListsCache($diveCenterId)
    {
        // Clear cache for all possible pagination sizes (1-100)
        for ($perPage = 1; $perPage <= 100; $perPage++) {
            Cache::forget("price_lists_{$diveCenterId}_{$perPage}");
        }
    }
}

