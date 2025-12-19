<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerInsurance extends Model
{
    protected $fillable = [
        'customer_id',
        'insurance_provider',
        'insurance_no',
        'insurance_hotline_no',
        'file_url',
        'expiry_date',
        'status',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'status' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
