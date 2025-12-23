<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceListItemTier extends Model
{
    protected $table = 'price_list_item_tiers';

    protected $fillable = [
        'item_id',
        'tier_name',
        'from_dives',
        'to_dives',
        'price_per_dive',
        'total_price',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'from_dives' => 'integer',
        'to_dives' => 'integer',
        'price_per_dive' => 'decimal:2',
        'total_price' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the price list item that owns this tier.
     */
    public function priceListItem(): BelongsTo
    {
        return $this->belongsTo(PriceListItem::class, 'item_id');
    }

    /**
     * Scope a query to only include active tiers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Validate that from_dives <= to_dives
     */
    public static function boot()
    {
        parent::boot();

        static::saving(function ($tier) {
            if ($tier->from_dives > $tier->to_dives) {
                throw new \InvalidArgumentException('from_dives must be less than or equal to to_dives');
            }
        });
    }
}
