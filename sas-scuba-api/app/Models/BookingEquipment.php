<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingEquipment extends Model
{
    protected $fillable = [
        'booking_id',
        'basket_id',
        'equipment_item_id',
        'price',
        'checkout_date',
        'return_date',
        'actual_return_date',
        'equipment_source',
        'customer_equipment_type',
        'customer_equipment_brand',
        'customer_equipment_model',
        'customer_equipment_serial',
        'customer_equipment_notes',
        'assignment_status',
        'damage_reported',
        'damage_description',
        'damage_cost',
        'charge_customer',
        'damage_charge_amount',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'checkout_date' => 'date',
        'return_date' => 'date',
        'actual_return_date' => 'date',
        'damage_reported' => 'boolean',
        'damage_cost' => 'decimal:2',
        'charge_customer' => 'boolean',
        'damage_charge_amount' => 'decimal:2',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function equipmentItem()
    {
        return $this->belongsTo(EquipmentItem::class);
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function basket()
    {
        return $this->belongsTo(EquipmentBasket::class);
    }

    public function isCenterEquipment(): bool
    {
        return $this->equipment_source === 'Center';
    }

    public function isCustomerEquipment(): bool
    {
        return $this->equipment_source === 'Customer Own';
    }

    public function isCheckedOut(): bool
    {
        return $this->assignment_status === 'Checked Out';
    }

    public function isReturned(): bool
    {
        return $this->assignment_status === 'Returned';
    }
}

