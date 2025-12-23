<?php

namespace App\Services;

use App\Models\PriceListItem;
use App\Models\PriceListItemTier;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class DivePricingService
{
    /**
     * Get the best matching price for a dive count.
     *
     * @param int $diveCount Number of dives
     * @param string $serviceType Service type (e.g., 'Dive Trip')
     * @param string|null $customerType Customer type (ALL, MEMBER, NON_MEMBER, GROUP, CORPORATE)
     * @param string|null $date Date to check validity (defaults to today)
     * @return PriceListItem|null
     */
    public function getBestPrice(
        int $diveCount,
        string $serviceType,
        ?string $customerType = null,
        ?string $date = null
    ): ?PriceListItem {
        if ($date === null) {
            $date = now()->toDateString();
        }

        // First, try to find RANGE or SINGLE pricing
        $query = PriceListItem::where('service_type', $serviceType)
            ->active()
            ->validForDate($date)
            ->forDiveCount($diveCount);

        if ($customerType) {
            $query->applicableTo($customerType);
        }

        $bestItem = $query->orderBy('priority', 'desc')
            ->orderBy('base_price', 'asc')
            ->orderByRaw('(max_dives - min_dives) ASC') // Most specific range first
            ->orderBy('created_at', 'desc')
            ->first();

        // If no range match found, check TIERED pricing
        if (!$bestItem) {
            $tieredItems = PriceListItem::where('service_type', $serviceType)
                ->active()
                ->validForDate($date)
                ->byPricingModel('TIERED');

            if ($customerType) {
                $tieredItems->applicableTo($customerType);
            }

            $tieredItems = $tieredItems->get();

            $bestTieredItem = null;
            $bestTieredPrice = null;

            foreach ($tieredItems as $item) {
                $calculatedPrice = $this->calculateTieredPrice($diveCount, $item);
                if ($calculatedPrice !== null) {
                    if ($bestTieredPrice === null || $calculatedPrice < $bestTieredPrice) {
                        $bestTieredPrice = $calculatedPrice;
                        $bestTieredItem = $item;
                    }
                }
            }

            if ($bestTieredItem) {
                // Set a temporary price attribute for the calculated price
                $bestTieredItem->setAttribute('calculated_price', $bestTieredPrice);
                return $bestTieredItem;
            }
        }

        return $bestItem;
    }

    /**
     * Calculate price for tiered pricing model.
     *
     * @param int $diveCount Number of dives
     * @param PriceListItem $item Price list item with TIERED pricing model
     * @return float|null Calculated price or null if no matching tiers
     */
    public function calculateTieredPrice(int $diveCount, PriceListItem $item): ?float
    {
        if ($item->pricing_model !== 'TIERED') {
            return null;
        }

        // Get all active tiers ordered by from_dives
        $tiers = $item->activePriceTiers()
            ->where('from_dives', '<=', $diveCount)
            ->orderBy('from_dives')
            ->get();

        if ($tiers->isEmpty()) {
            return null;
        }

        $totalPrice = 0;
        $remainingDives = $diveCount;
        $currentDiveNumber = 1;

        foreach ($tiers as $tier) {
            // Skip tiers that start after our dive count
            if ($tier->from_dives > $diveCount) {
                continue;
            }

            // Calculate how many dives fall into this tier
            $tierStart = max($currentDiveNumber, $tier->from_dives);
            $tierEnd = min($diveCount, $tier->to_dives);
            
            if ($tierStart > $tierEnd) {
                continue; // This tier doesn't apply
            }

            $tierDives = $tierEnd - $tierStart + 1;
            
            if ($tier->total_price !== null && $tierDives === ($tier->to_dives - $tier->from_dives + 1)) {
                // Fixed price for the entire tier (only if we're using the full tier)
                $totalPrice += $tier->total_price;
            } else {
                // Per-dive pricing
                $totalPrice += $tier->price_per_dive * $tierDives;
            }
            
            $currentDiveNumber = $tierEnd + 1;
            
            if ($currentDiveNumber > $diveCount) {
                break;
            }
        }

        return $totalPrice > 0 ? round($totalPrice, 2) : null;
    }

    /**
     * Get price suggestions for a dive count.
     *
     * @param int $diveCount Number of dives
     * @param string $serviceType Service type
     * @param string|null $customerType Customer type
     * @return array Array of price suggestions with details
     */
    public function getPriceSuggestions(
        int $diveCount,
        string $serviceType,
        ?string $customerType = null
    ): array {
        $date = now()->toDateString();

        // Get all matching items
        $query = PriceListItem::where('service_type', $serviceType)
            ->active()
            ->validForDate($date)
            ->forDiveCount($diveCount);

        if ($customerType) {
            $query->applicableTo($customerType);
        }

        $items = $query->orderBy('priority', 'desc')
            ->orderBy('base_price', 'asc')
            ->get();

        $suggestions = [];

        foreach ($items as $item) {
            $price = $item->base_price ?? $item->price;
            
            if ($item->pricing_model === 'TIERED') {
                $calculatedPrice = $this->calculateTieredPrice($diveCount, $item);
                if ($calculatedPrice !== null) {
                    $price = $calculatedPrice;
                } else {
                    continue; // Skip if no matching tiers
                }
            }

            $suggestions[] = [
                'id' => $item->id,
                'name' => $item->name,
                'description' => $item->description,
                'pricing_model' => $item->pricing_model,
                'min_dives' => $item->min_dives,
                'max_dives' => $item->max_dives,
                'priority' => $item->priority,
                'price' => $price,
                'base_price' => $item->base_price ?? $item->price,
                'applicable_to' => $item->applicable_to,
            ];
        }

        return $suggestions;
    }

    /**
     * Get customer type from customer model.
     * Derives type from dive groups - if in any dive group, type is 'GROUP', otherwise 'NON_MEMBER'.
     *
     * @param Customer $customer
     * @return string
     */
    public function getCustomerType(Customer $customer): string
    {
        // Check if customer is in any dive group
        if ($customer->diveGroups()->exists()) {
            return 'GROUP';
        }

        // TODO: Add logic to check for membership or corporate status
        // For now, default to NON_MEMBER
        return 'NON_MEMBER';
    }

    /**
     * Check for pricing overlaps.
     *
     * @param int $diveCount Dive count to check
     * @param string $serviceType Service type
     * @return array Array of overlap information
     */
    public function checkOverlaps(int $diveCount, string $serviceType): array
    {
        $items = PriceListItem::where('service_type', $serviceType)
            ->active()
            ->forDiveCount($diveCount)
            ->get();

        $overlaps = [];

        foreach ($items as $i => $item1) {
            foreach ($items->slice($i + 1) as $item2) {
                $overlapStart = max($item1->min_dives, $item2->min_dives);
                $overlapEnd = min($item1->max_dives, $item2->max_dives);

                if ($overlapStart <= $overlapEnd) {
                    $overlaps[] = [
                        'item1' => [
                            'id' => $item1->id,
                            'name' => $item1->name,
                            'priority' => $item1->priority,
                        ],
                        'item2' => [
                            'id' => $item2->id,
                            'name' => $item2->name,
                            'priority' => $item2->priority,
                        ],
                        'overlap_start' => $overlapStart,
                        'overlap_end' => $overlapEnd,
                        'winner' => $item1->priority > $item2->priority ? $item1->name : $item2->name,
                    ];
                }
            }
        }

        return $overlaps;
    }
}

