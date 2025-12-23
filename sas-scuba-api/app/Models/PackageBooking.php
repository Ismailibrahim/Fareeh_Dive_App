<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PackageBooking extends Model
{
    protected $fillable = [
        'booking_number',
        'package_id',
        'customer_id',
        'dive_center_id',
        'persons_count',
        'start_date',
        'end_date',
        'total_price',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'persons_count' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    // Relationships
    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    // Methods
    public function generateBookingNumber(): string
    {
        if ($this->booking_number) {
            return $this->booking_number;
        }

        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(6));
        
        return "PKG-{$date}-{$random}";
    }

    public static function createBookingNumber(): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(6));
        
        // Ensure uniqueness
        do {
            $bookingNumber = "PKG-{$date}-{$random}";
            $exists = self::where('booking_number', $bookingNumber)->exists();
            if ($exists) {
                $random = strtoupper(Str::random(6));
            }
        } while ($exists);
        
        return $bookingNumber;
    }

    public function calculateTotal(int $persons, array $optionIds = []): float
    {
        return $this->package->calculatePrice($persons, $optionIds);
    }
}
