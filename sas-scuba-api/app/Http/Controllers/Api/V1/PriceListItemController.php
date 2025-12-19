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

        $priceList = PriceList::where('dive_center_id', $diveCenterId)->first();

        if (!$priceList) {
            // Create price list if it doesn't exist
            $priceList = PriceList::create([
                'dive_center_id' => $diveCenterId,
                'name' => 'Default Price List',
            ]);
        }

        $validated = $request->validate([
            'service_type' => 'required|string',
            'equipment_item_id' => 'nullable|exists:equipment_items,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

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
}

