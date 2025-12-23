<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackageComponent extends Model
{
    protected $fillable = [
        'package_id',
        'component_type',
        'name',
        'description',
        'item_id',
        'unit_price',
        'quantity',
        'unit',
        'total_price',
        'is_inclusive',
        'sort_order',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'quantity' => 'integer',
        'is_inclusive' => 'boolean',
        'sort_order' => 'integer',
    ];

    // Relationships
    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function priceListItem()
    {
        return $this->belongsTo(PriceListItem::class, 'item_id');
    }

    // Boot method to auto-calculate total_price
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($component) {
            $component->total_price = $component->unit_price * $component->quantity;
        });
    }
}
