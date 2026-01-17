<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Excursion extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'description',
        'duration',
        'location',
        'capacity',
        'meeting_point',
        'departure_time',
        'is_active',
    ];

    protected $casts = [
        'duration' => 'integer',
        'capacity' => 'integer',
        'is_active' => 'boolean',
        'departure_time' => 'string',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function bookingExcursions()
    {
        return $this->hasMany(BookingExcursion::class);
    }

    /**
     * Scope a query to only include active excursions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by dive center.
     */
    public function scopeByDiveCenter($query, $diveCenterId)
    {
        return $query->where('dive_center_id', $diveCenterId);
    }
}
