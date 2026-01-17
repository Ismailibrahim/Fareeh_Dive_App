<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingExcursion extends Model
{
    protected $fillable = [
        'booking_id',
        'excursion_id',
        'excursion_date',
        'excursion_time',
        'price_list_item_id',
        'price',
        'status',
        'completed_at',
        'notes',
        'number_of_participants',
    ];

    protected $casts = [
        'excursion_date' => 'date',
        'excursion_time' => 'string',
        'price' => 'decimal:2',
        'completed_at' => 'datetime',
        'number_of_participants' => 'integer',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function excursion()
    {
        return $this->belongsTo(Excursion::class);
    }

    public function priceListItem()
    {
        return $this->belongsTo(PriceListItem::class);
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * Check if excursion is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'Completed';
    }

    /**
     * Check if excursion is invoiced
     */
    public function isInvoiced(): bool
    {
        return $this->invoiceItems()->exists();
    }

    /**
     * Check if excursion can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['Scheduled', 'In Progress']);
    }

    /**
     * Get the invoice item for this excursion
     */
    public function getInvoiceItem()
    {
        return $this->invoiceItems()->first();
    }
}
