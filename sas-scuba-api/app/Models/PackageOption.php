<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackageOption extends Model
{
    protected $fillable = [
        'package_id',
        'name',
        'description',
        'item_id',
        'price',
        'unit',
        'is_active',
        'max_quantity',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'max_quantity' => 'integer',
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

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
