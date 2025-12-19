<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DivePackage extends Model
{
    protected $fillable = [
        'dive_center_id',
        'customer_id',
        'package_price_list_item_id',
        'package_total_price',
        'package_per_dive_price',
        'package_total_dives',
        'package_dives_used',
        'package_start_date',
        'package_end_date',
        'package_duration_days',
        'status',
        'notes',
    ];

    protected $casts = [
        'package_total_price' => 'decimal:2',
        'package_per_dive_price' => 'decimal:2',
        'package_start_date' => 'date',
        'package_end_date' => 'date',
    ];

    // Relationships
    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function packagePriceListItem()
    {
        return $this->belongsTo(PriceListItem::class, 'package_price_list_item_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function bookingDives()
    {
        return $this->hasMany(BookingDive::class);
    }

    // Methods
    public function remainingDives(): int
    {
        return $this->package_total_dives - $this->package_dives_used;
    }

    public function isActive(): bool
    {
        if ($this->status !== 'Active') {
            return false;
        }

        if ($this->package_end_date && now()->gt($this->package_end_date)) {
            return false;
        }

        return $this->remainingDives() > 0;
    }

    public function canAddDive(): bool
    {
        return $this->isActive() && $this->remainingDives() > 0;
    }

    public function calculatePerDivePrice(): float
    {
        if ($this->package_per_dive_price) {
            return (float) $this->package_per_dive_price;
        }
        return $this->package_total_dives > 0 
            ? (float) ($this->package_total_price / $this->package_total_dives)
            : 0;
    }
}

