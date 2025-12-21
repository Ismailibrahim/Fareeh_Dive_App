<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Models\PriceListItem;
use Illuminate\Http\Request;

class PriceListItemController extends Controller
{
    /**
     * Display a listing of price list items.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        if (!$diveCenterId) {
            return response()->json(['message' => 'Dive center not found'], 404);
        }

        $priceList = PriceList::where('dive_center_id', $diveCenterId)->first();

        if (!$priceList) {
            return response()->json(['data' => []]);
        }

        $query = PriceListItem::where('price_list_id', $priceList->id);

        // Filter by service type if provided
        if ($request->has('service_type')) {
            $query->where('service_type', $request->input('service_type'));
        }

        // Filter by active status if provided
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return response()->json($query->orderBy('sort_order')->orderBy('name')->get());
    }

    /**
     * Store a newly created price list item.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        if (!$diveCenterId) {
            return response()->json(['message' => 'Dive center not found'], 404);
        }

        $validated = $request->validate([
            'price_list_id' => 'nullable|exists:price_lists,id',
            'service_type' => 'required|string',
            'equipment_item_id' => 'nullable|exists:equipment_items,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'tax_inclusive' => 'nullable|boolean',
            'service_charge_inclusive' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        // If price_list_id is provided, validate it belongs to user's dive center
        if (isset($validated['price_list_id'])) {
            $priceList = PriceList::where('id', $validated['price_list_id'])
                ->where('dive_center_id', $diveCenterId)
                ->first();
            
            if (!$priceList) {
                return response()->json(['message' => 'Price list not found or unauthorized'], 404);
            }
        } else {
            // Fallback: use first price list for backward compatibility
            $priceList = PriceList::where('dive_center_id', $diveCenterId)->first();

            if (!$priceList) {
                // Create price list if it doesn't exist
                $priceList = PriceList::create([
                    'dive_center_id' => $diveCenterId,
                    'name' => 'Default Price List',
                ]);
            }
        }

        $validated['price_list_id'] = $priceList->id;
        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $item = PriceListItem::create($validated);

        return response()->json($item, 201);
    }

    /**
     * Display the specified price list item.
     */
    public function show(PriceListItem $priceListItem)
    {
        // Ensure the item belongs to the user's dive center
        $user = request()->user();
        $diveCenter = $user->diveCenter;
        
        if ($priceListItem->priceList->dive_center_id !== $diveCenter->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($priceListItem);
    }

    /**
     * Update the specified price list item.
     */
    public function update(Request $request, PriceListItem $priceListItem)
    {
        // Ensure the item belongs to the user's dive center
        $user = $request->user();
        $diveCenter = $user->diveCenter;
        
        if ($priceListItem->priceList->dive_center_id !== $diveCenter->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'service_type' => 'sometimes|string',
            'equipment_item_id' => 'nullable|exists:equipment_items,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'tax_inclusive' => 'nullable|boolean',
            'service_charge_inclusive' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $priceListItem->update($validated);

        return response()->json($priceListItem);
    }

    /**
     * Remove the specified price list item.
     */
    public function destroy(PriceListItem $priceListItem)
    {
        // Ensure the item belongs to the user's dive center
        $user = request()->user();
        $diveCenter = $user->diveCenter;
        
        if ($priceListItem->priceList->dive_center_id !== $diveCenter->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $priceListItem->delete();

        return response()->noContent();
    }

    /**
     * Bulk update price list items.
     */
    public function bulkUpdate(Request $request)
    {
        $user = $request->user();
        $diveCenterId = $user->dive_center_id;
        
        if (!$diveCenterId) {
            return response()->json(['message' => 'Dive center not found'], 404);
        }

        $priceList = PriceList::where('dive_center_id', $diveCenterId)->first();

        if (!$priceList) {
            return response()->json(['message' => 'Price list not found'], 404);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:price_list_items,id',
            'items.*.service_type' => 'sometimes|string',
            'items.*.equipment_item_id' => 'nullable|exists:equipment_items,id',
            'items.*.name' => 'sometimes|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.price' => 'sometimes|numeric|min:0',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.tax_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_inclusive' => 'nullable|boolean',
            'items.*.service_charge_inclusive' => 'nullable|boolean',
            'items.*.sort_order' => 'nullable|integer',
            'items.*.is_active' => 'nullable|boolean',
        ]);

        $updatedItems = [];
        foreach ($validated['items'] as $itemData) {
            $item = PriceListItem::find($itemData['id']);
            
            // Ensure item belongs to the price list
            if ($item && $item->price_list_id === $priceList->id) {
                $updateData = collect($itemData)->except('id')->toArray();
                $item->update($updateData);
                $updatedItems[] = $item;
            }
        }

        return response()->json(['data' => $updatedItems]);
    }

    /**
     * Bulk adjust prices for all items in a price list.
     */
    public function bulkAdjustPrices(Request $request, $priceListId)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;
            
            if (!$diveCenterId) {
                return response()->json(['message' => 'Dive center not found'], 404);
            }

            // Verify price list belongs to user's dive center
            $priceList = PriceList::where('id', $priceListId)
                ->where('dive_center_id', $diveCenterId)
                ->first();

            if (!$priceList) {
                return response()->json(['message' => 'Price list not found or unauthorized'], 404);
            }

            $validated = $request->validate([
                'adjustment_type' => 'required|in:percentage,multiplier',
                'adjustment_value' => 'required|numeric',
                'rounding_type' => 'nullable|in:nearest_10,whole_number',
                'item_ids' => 'nullable|array',
                'item_ids.*' => 'integer|exists:price_list_items,id',
            ]);

            $adjustmentType = $validated['adjustment_type'];
            $adjustmentValue = $validated['adjustment_value'];
            $roundingType = $validated['rounding_type'] ?? null;

            // Validate adjustment value based on type
            if ($adjustmentType === 'percentage') {
                if ($adjustmentValue < -100) {
                    return response()->json(['message' => 'Percentage cannot be less than -100'], 422);
                }
            } else { // multiplier
                if ($adjustmentValue <= 0) {
                    return response()->json(['message' => 'Multiplier must be greater than 0'], 422);
                }
            }

            // Get items to adjust - either selected items or all items
            $query = PriceListItem::where('price_list_id', $priceListId);
            
            // If specific item IDs are provided, filter by them and verify they belong to this price list
            if (!empty($validated['item_ids'])) {
                // Verify all item IDs belong to this price list
                $validItemIds = PriceListItem::where('price_list_id', $priceListId)
                    ->whereIn('id', $validated['item_ids'])
                    ->pluck('id')
                    ->toArray();
                
                if (count($validItemIds) !== count($validated['item_ids'])) {
                    return response()->json([
                        'message' => 'Some selected items do not belong to this price list',
                    ], 422);
                }
                
                $query->whereIn('id', $validItemIds);
            }
            
            $items = $query->get();

            if ($items->isEmpty()) {
                return response()->json([
                    'message' => 'No items found to adjust',
                    'updated_count' => 0,
                ]);
            }

            $updatedCount = 0;
            $sampleItems = [];

            // Use database transaction for consistency
            \DB::transaction(function () use ($items, $adjustmentType, $adjustmentValue, $roundingType, &$updatedCount, &$sampleItems) {
                foreach ($items as $item) {
                    $oldPrice = $item->price;
                    
                    // Calculate new price based on adjustment type
                    if ($adjustmentType === 'percentage') {
                        $newPrice = $oldPrice * (1 + $adjustmentValue / 100);
                    } else { // multiplier
                        $newPrice = $oldPrice * $adjustmentValue;
                    }

                    // Apply rounding if specified
                    if ($roundingType === 'nearest_10') {
                        $newPrice = round($newPrice / 10) * 10;
                    } elseif ($roundingType === 'whole_number') {
                        $newPrice = round($newPrice);
                    } else {
                        // Round to 2 decimal places if no rounding type specified
                        $newPrice = round($newPrice, 2);
                    }

                    // Ensure price doesn't go below 0
                    $newPrice = max(0, $newPrice);

                    // Update item
                    $item->price = $newPrice;
                    $item->save();

                    $updatedCount++;

                    // Store first 3 items as samples for preview
                    if (count($sampleItems) < 3) {
                        $sampleItems[] = [
                            'id' => $item->id,
                            'name' => $item->name,
                            'old_price' => $oldPrice,
                            'new_price' => $newPrice,
                        ];
                    }
                }
            });

            return response()->json([
                'message' => 'Prices adjusted successfully',
                'updated_count' => $updatedCount,
                'sample_items' => $sampleItems,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('PriceListItemController::bulkAdjustPrices error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk update tax and service charge settings for selected items.
     */
    public function bulkUpdateTaxService(Request $request, $priceListId)
    {
        try {
            $user = $request->user();
            $diveCenterId = $user->dive_center_id;
            
            if (!$diveCenterId) {
                return response()->json(['message' => 'Dive center not found'], 404);
            }

            // Verify price list belongs to user's dive center
            $priceList = PriceList::where('id', $priceListId)
                ->where('dive_center_id', $diveCenterId)
                ->first();

            if (!$priceList) {
                return response()->json(['message' => 'Price list not found or unauthorized'], 404);
            }

            $validated = $request->validate([
                'item_ids' => 'required|array',
                'item_ids.*' => 'integer|exists:price_list_items,id',
                'tax_inclusive' => 'nullable|boolean',
                'service_charge_inclusive' => 'nullable|boolean',
            ]);

            // Verify all item IDs belong to this price list
            $validItemIds = PriceListItem::where('price_list_id', $priceListId)
                ->whereIn('id', $validated['item_ids'])
                ->pluck('id')
                ->toArray();
            
            if (count($validItemIds) !== count($validated['item_ids'])) {
                return response()->json([
                    'message' => 'Some selected items do not belong to this price list',
                ], 422);
            }

            // Check if at least one field is being updated
            if (!isset($validated['tax_inclusive']) && !isset($validated['service_charge_inclusive'])) {
                return response()->json([
                    'message' => 'At least one setting (tax_inclusive or service_charge_inclusive) must be provided',
                ], 422);
            }

            $updateData = [];
            if (isset($validated['tax_inclusive'])) {
                $updateData['tax_inclusive'] = $validated['tax_inclusive'];
            }
            if (isset($validated['service_charge_inclusive'])) {
                $updateData['service_charge_inclusive'] = $validated['service_charge_inclusive'];
            }

            // Update all selected items
            $updatedCount = PriceListItem::whereIn('id', $validItemIds)
                ->update($updateData);

            return response()->json([
                'message' => 'Settings updated successfully',
                'updated_count' => $updatedCount,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('PriceListItemController::bulkUpdateTaxService error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }
}

