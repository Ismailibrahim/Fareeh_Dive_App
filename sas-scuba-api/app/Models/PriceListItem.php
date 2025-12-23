<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceListItem extends Model
{
    protected $fillable = [
        'price_list_id',
        'service_type',
        'equipment_item_id',
        'name',
        'description',
        'price',
        'base_price',
        'pricing_model',
        'min_dives',
        'max_dives',
        'priority',
        'valid_from',
        'valid_until',
        'applicable_to',
        'unit',
        'tax_percentage',
        'tax_inclusive',
        'service_charge_inclusive',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'base_price' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'tax_inclusive' => 'boolean',
        'service_charge_inclusive' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'min_dives' => 'integer',
        'max_dives' => 'integer',
        'priority' => 'integer',
        'valid_from' => 'date',
        'valid_until' => 'date',
    ];

    /**
     * Get the price list that owns the item.
     */
    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    /**
     * Get the equipment item associated with this price list item.
     */
    public function equipmentItem()
    {
        return $this->belongsTo(EquipmentItem::class);
    }

    /**
     * Get the price tiers for this item (for TIERED pricing model).
     */
    public function priceTiers()
    {
        return $this->hasMany(PriceListItemTier::class, 'item_id')->orderBy('from_dives');
    }

    /**
     * Get active price tiers for this item.
     */
    public function activePriceTiers()
    {
        return $this->priceTiers()->where('is_active', true);
    }

    /**
     * Scope a query to only include active items.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by service type.
     */
    public function scopeByServiceType($query, $type)
    {
        return $query->where('service_type', $type);
    }

    /**
     * Scope a query to filter by pricing model.
     */
    public function scopeByPricingModel($query, $model)
    {
        return $query->where('pricing_model', $model);
    }

    /**
     * Scope a query to filter items valid for a specific date.
     */
    public function scopeValidForDate($query, $date = null)
    {
        if ($date === null) {
            $date = now()->toDateString();
        }

        return $query->where(function ($q) use ($date) {
            $q->whereNull('valid_from')
              ->orWhere('valid_from', '<=', $date);
        })->where(function ($q) use ($date) {
            $q->whereNull('valid_until')
              ->orWhere('valid_until', '>=', $date);
        });
    }

    /**
     * Scope a query to filter by customer type applicability.
     */
    public function scopeApplicableTo($query, $customerType)
    {
        return $query->where(function ($q) use ($customerType) {
            $q->where('applicable_to', 'ALL')
              ->orWhere('applicable_to', $customerType);
        });
    }

    /**
     * Scope a query to filter items that apply to a specific dive count.
     */
    public function scopeForDiveCount($query, $diveCount)
    {
        return $query->where('min_dives', '<=', $diveCount)
                     ->where('max_dives', '>=', $diveCount);
    }

    /**
     * Get the effective price - use base_price if available, otherwise fall back to price.
     * Note: This is a helper method, not an accessor override to avoid conflicts.
     */
    public function getEffectivePrice()
    {
        if ($this->base_price !== null) {
            return $this->base_price;
        }
        return $this->price;
    }
}

