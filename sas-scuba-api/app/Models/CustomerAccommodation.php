<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerAccommodation extends Model
{
    protected $fillable = [
        'customer_id',
        'name',
        'address',
        'contact_no',
        'island',
        'room_no',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
