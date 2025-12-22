<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiveLog extends Model
{
    protected $fillable = [
        'dive_center_id',
        'customer_id',
        'dive_site_id',
        'dive_date',
        'entry_time',
        'exit_time',
        'total_dive_time',
        'max_depth',
        'boat_id',
        'dive_type',
        'instructor_id',
        'visibility',
        'visibility_unit',
        'current',
        'current_unit',
        'tank_size',
        'tank_size_unit',
        'gas_mix',
        'starting_pressure',
        'ending_pressure',
        'pressure_unit',
        'notes',
    ];

    protected $casts = [
        'dive_date' => 'date',
        'entry_time' => 'string',
        'exit_time' => 'string',
        'max_depth' => 'decimal:2',
        'visibility' => 'decimal:2',
        'current' => 'decimal:2',
        'tank_size' => 'decimal:2',
        'starting_pressure' => 'decimal:2',
        'ending_pressure' => 'decimal:2',
    ];

    /**
     * Get the dive center that owns the dive log.
     */
    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    /**
     * Get the customer that owns the dive log.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the dive site for this dive log.
     */
    public function diveSite()
    {
        return $this->belongsTo(DiveSite::class);
    }

    /**
     * Get the boat used for this dive.
     */
    public function boat()
    {
        return $this->belongsTo(Boat::class);
    }

    /**
     * Get the instructor for this dive.
     */
    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Scope a query to only include dive logs for a specific dive center.
     */
    public function scopeForDiveCenter($query, $diveCenterId)
    {
        return $query->where('dive_center_id', $diveCenterId);
    }

    /**
     * Scope a query to only include dive logs for a specific customer.
     */
    public function scopeForCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Calculate total dive time from entry and exit times.
     */
    public function calculateTotalDiveTime(): ?int
    {
        if (!$this->entry_time || !$this->exit_time) {
            return null;
        }

        $entry = \Carbon\Carbon::parse($this->entry_time);
        $exit = \Carbon\Carbon::parse($this->exit_time);
        
        // Handle case where exit time is next day (e.g., entry 23:00, exit 01:00)
        if ($exit->lessThan($entry)) {
            $exit->addDay();
        }

        return $entry->diffInMinutes($exit);
    }
}



