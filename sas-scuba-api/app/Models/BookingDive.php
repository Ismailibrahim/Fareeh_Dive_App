<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingDive extends Model
{
    protected $fillable = [
        'booking_id',
        'dive_site_id',
        'boat_id',
        'dive_date',
        'dive_time',
        'price_list_item_id',
        'price',
        'dive_duration',
        'max_depth',
        'status',
        'completed_at',
        'dive_log_notes',
        'dive_package_id',
        'is_package_dive',
        'package_dive_number',
    ];

    protected $casts = [
        'dive_date' => 'date',
        'dive_time' => 'string',
        'price' => 'decimal:2',
        'max_depth' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function diveSite()
    {
        return $this->belongsTo(DiveSite::class);
    }

    public function boat()
    {
        return $this->belongsTo(Boat::class);
    }

    public function bookingInstructors()
    {
        return $this->hasMany(BookingInstructor::class);
    }

    public function priceListItem()
    {
        return $this->belongsTo(PriceListItem::class);
    }

    /**
     * Check if dive is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'Completed';
    }

    /**
     * Check if dive log can be edited
     */
    public function canEditLog(): bool
    {
        return in_array($this->status, ['In Progress', 'Completed']);
    }

    public function divePackage()
    {
        return $this->belongsTo(DivePackage::class);
    }

    public function isPartOfPackage(): bool
    {
        return $this->is_package_dive && $this->dive_package_id !== null;
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function isInvoiced(): bool
    {
        return $this->invoiceItems()->exists();
    }

    public function getInvoiceItem()
    {
        return $this->invoiceItems()->first();
    }
}

