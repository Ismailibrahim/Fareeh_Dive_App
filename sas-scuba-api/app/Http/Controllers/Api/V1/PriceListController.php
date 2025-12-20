<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AuthorizesDiveCenterAccess;
use App\Models\PriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

            $diveCenter = $user->diveCenter;
            $query = PriceList::where('dive_center_id', $diveCenterId)
                ->with('items')
                ->orderBy('created_at', 'desc');

            // Get pagination parameters
            $perPage = $request->get('per_page', 20);
            $perPage = min(max($perPage, 1), 100);

            $priceLists = $query->paginate($perPage);

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

            return response()->json(['message' => 'Price list deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error('PriceListController::destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }
}

