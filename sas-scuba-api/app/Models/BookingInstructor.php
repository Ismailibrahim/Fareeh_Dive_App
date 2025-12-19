<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingInstructor extends Model
{
    protected $fillable = [
        'booking_dive_id',
        'user_id',
        'role',
    ];

    public function bookingDive()
    {
        return $this->belongsTo(BookingDive::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

