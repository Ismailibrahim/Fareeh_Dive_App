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
        'unit',
        'tax_percentage',
        'tax_inclusive',
        'service_charge_inclusive',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'tax_inclusive' => 'boolean',
        'service_charge_inclusive' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
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
}

