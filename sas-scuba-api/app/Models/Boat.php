<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Boat extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'capacity',
        'tank_capacity',
        'active',
        'is_owned',
        'ownership_type',
        'rent_start_date',
        'rent_end_date',
    ];

    protected $casts = [
        'active' => 'boolean',
        'capacity' => 'integer',
        'tank_capacity' => 'integer',
        'is_owned' => 'boolean',
        'rent_start_date' => 'date',
        'rent_end_date' => 'date',
    ];

    protected $appends = ['is_rental_expired'];

    public function getIsRentalExpiredAttribute()
    {
        if ($this->ownership_type === 'Rented' && $this->rent_end_date) {
            return $this->rent_end_date->isPast();
        }
        return false;
    }

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }
}
