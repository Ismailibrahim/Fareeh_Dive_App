<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'dive_center_id',
        'booking_id',
        'agent_id',
        'invoice_no',
        'invoice_date',
        'subtotal',
        'tax',
        'total',
        'currency',
        'status',
        'invoice_type',
        'related_invoice_id',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    // Relationships
    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function relatedInvoice()
    {
        return $this->belongsTo(Invoice::class, 'related_invoice_id');
    }

    // Methods
    public function totalPaid(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    public function remainingBalance(): float
    {
        return (float) ($this->total - $this->totalPaid());
    }

    public function isFullyPaid(): bool
    {
        return $this->remainingBalance() <= 0;
    }

    public function canAddPayment(): bool
    {
        return $this->status !== 'Refunded' && $this->remainingBalance() > 0;
    }

    public function generateInvoiceNumber(): string
    {
        $diveCenter = $this->diveCenter;
        $year = date('Y');
        $count = self::where('dive_center_id', $this->dive_center_id)
            ->whereYear('created_at', $year)
            ->count() + 1;
        
        return sprintf('INV-%s-%03d', $year, $count);
    }
}
