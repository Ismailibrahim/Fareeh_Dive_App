<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'dive_center_id',
        'agent_id',
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
        'departure_flight_time',
        'departure_to',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'departure_date' => 'date',
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

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function insurance()
    {
        return $this->hasOne(CustomerInsurance::class);
    }

    public function accommodation()
    {
        return $this->hasOne(CustomerAccommodation::class);
    }

    public function certification()
    {
        return $this->hasOne(CustomerCertification::class);
    }

    public function diveGroups()
    {
        return $this->belongsToMany(DiveGroup::class, 'dive_group_members')
            ->withPivot('joined_at')
            ->withTimestamps()
            ->using(DiveGroupMember::class);
    }
}
