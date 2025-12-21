<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'dive_center_id',
        'full_name',
        'email',
        'phone',
        'address',
        'city',
        'zip_code',
        'country',
        'passport_no',
        'date_of_birth',
        'gender',
        'nationality',
        'departure_date',
        'departure_flight',
        'departure_to',
    ];

    public function emergencyContacts()
    {
        return $this->hasMany(EmergencyContact::class);
    }

    public function primaryEmergencyContact()
    {
        return $this->hasOne(EmergencyContact::class)->where('is_primary', true);
    }

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function insurance()
    {
        return $this->hasOne(CustomerInsurance::class);
    }

    public function accommodation()
    {
        return $this->hasOne(CustomerAccommodation::class);
    }
}
