<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentBasket extends Model
{
    protected $fillable = [
        'dive_center_id',
        'customer_id',
        'booking_id',
        'basket_no',
        'center_bucket_no',
        'checkout_date',
        'expected_return_date',
        'actual_return_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'checkout_date' => 'date',
        'expected_return_date' => 'date',
        'actual_return_date' => 'date',
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

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function bookingEquipment()
    {
        return $this->hasMany(BookingEquipment::class, 'basket_id');
    }

    // Methods
    public static function generateBasketNumber($diveCenterId): string
    {
        $year = date('Y');
        $count = self::where('dive_center_id', $diveCenterId)
                     ->whereYear('created_at', $year)
                     ->count() + 1;
        return sprintf('BASK-%s-%03d', $year, $count);
    }

    public function isActive(): bool
    {
        return $this->status === 'Active';
    }

    public function isReturned(): bool
    {
        return $this->status === 'Returned';
    }
}

