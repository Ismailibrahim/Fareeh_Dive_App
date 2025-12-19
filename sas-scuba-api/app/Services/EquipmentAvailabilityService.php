<?php

namespace App\Services;

use App\Models\BookingEquipment;

class EquipmentAvailabilityService
{
    /**
     * Check if equipment item is available for date range
     */
    public function isAvailable($equipmentItemId, $checkoutDate, $returnDate): bool
    {
        $conflicts = BookingEquipment::where('equipment_item_id', $equipmentItemId)
            ->where('equipment_source', 'Center')
            ->where('assignment_status', '!=', 'Returned')
            ->whereNotNull('checkout_date')
            ->whereNotNull('return_date')
            ->where(function($query) use ($checkoutDate, $returnDate) {
                $query->whereBetween('checkout_date', [$checkoutDate, $returnDate])
                      ->orWhereBetween('return_date', [$checkoutDate, $returnDate])
                      ->orWhere(function($q) use ($checkoutDate, $returnDate) {
                          $q->where('checkout_date', '<=', $checkoutDate)
                            ->where('return_date', '>=', $returnDate);
                      });
            })
            ->exists();
            
        return !$conflicts;
    }
    
    /**
     * Get conflicting assignments for equipment item
     */
    public function getConflicts($equipmentItemId, $checkoutDate, $returnDate)
    {
        return BookingEquipment::where('equipment_item_id', $equipmentItemId)
            ->where('equipment_source', 'Center')
            ->where('assignment_status', '!=', 'Returned')
            ->whereNotNull('checkout_date')
            ->whereNotNull('return_date')
            ->where(function($query) use ($checkoutDate, $returnDate) {
                // Overlapping date ranges
                $query->whereBetween('checkout_date', [$checkoutDate, $returnDate])
                      ->orWhereBetween('return_date', [$checkoutDate, $returnDate])
                      ->orWhere(function($q) use ($checkoutDate, $returnDate) {
                          $q->where('checkout_date', '<=', $checkoutDate)
                            ->where('return_date', '>=', $returnDate);
                      });
            })
            ->with(['basket.customer', 'basket.booking'])
            ->get();
    }
}

