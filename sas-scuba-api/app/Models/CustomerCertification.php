<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerCertification extends Model
{
    protected $fillable = [
        'customer_id',
        'certification_name',
        'certification_no',
        'certification_date',
        'last_dive_date',
        'no_of_dives',
        'agency',
        'instructor',
        'file_url',
        'license_status',
    ];

    protected $casts = [
        'certification_date' => 'date',
        'last_dive_date' => 'date',
        'license_status' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
