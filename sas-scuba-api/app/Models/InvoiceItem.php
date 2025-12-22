<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'price_list_item_id',
        'booking_dive_id',
        'booking_equipment_id',
        'description',
        'quantity',
        'unit_price',
        'discount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    // Relationships
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function priceListItem()
    {
        return $this->belongsTo(PriceListItem::class);
    }

    public function bookingDive()
    {
        return $this->belongsTo(BookingDive::class);
    }

    public function bookingEquipment()
    {
        return $this->belongsTo(BookingEquipment::class);
    }
}

