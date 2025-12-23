<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'invoice_id',
        'payment_method_id',
        'payment_date',
        'amount',
        'payment_type',
        'method',
        'reference',
        'method_type',
        'method_subtype',
        'tt_reference',
        'account_no',
        'bank_name',
        'crypto_type',
        'transaction_link',
        'card_type',
        'reference_number',
        'wallet_type',
        'currency',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    // Relationships
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }
}
