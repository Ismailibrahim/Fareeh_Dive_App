<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceList extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'notes',
    ];

    /**
     * Get the dive center that owns the price list.
     */
    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    /**
     * Get the price list items.
     */
    public function items()
    {
        return $this->hasMany(PriceListItem::class)->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Get active price list items.
     */
    public function activeItems()
    {
        return $this->items()->where('is_active', true);
    }
}

