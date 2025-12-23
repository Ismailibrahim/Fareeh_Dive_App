<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'dive_center_id',
        'customer_id',
        'agent_id',
        'dive_group_id',
        'booking_date',
        'number_of_divers',
        'status',
        'notes',
        'dive_package_id',
        'package_day_number',
        'basket_id',
    ];

    protected $casts = [
        'booking_date' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    public function diveGroup()
    {
        return $this->belongsTo(DiveGroup::class);
    }

    public function bookingDives()
    {
        return $this->hasMany(BookingDive::class);
    }

    public function bookingEquipment()
    {
        return $this->hasMany(BookingEquipment::class);
    }

    public function divePackage()
    {
        return $this->belongsTo(DivePackage::class);
    }

    public function isPackageBooking(): bool
    {
        return $this->dive_package_id !== null;
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function hasAdvanceInvoice(): bool
    {
        return $this->invoices()->where('invoice_type', 'Advance')->exists();
    }

    public function getTotalInvoiced(): float
    {
        return (float) $this->invoices()->sum('total');
    }

    public function getTotalPaid(): float
    {
        return (float) $this->invoices()->with('payments')->get()->sum(function ($invoice) {
            return $invoice->payments->sum('amount');
        });
    }

    public function basket()
    {
        return $this->belongsTo(EquipmentBasket::class);
    }

    public function hasBasket(): bool
    {
        return $this->basket_id !== null;
    }

    public function getBasketEquipment()
    {
        return $this->basket?->bookingEquipment ?? collect();
    }
}
