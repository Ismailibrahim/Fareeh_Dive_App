<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\EquipmentServiceHistory;

class EquipmentItem extends Model
{
    protected $fillable = [
        'equipment_id',
        'location_id',
        'size',
        'serial_no',
        'inventory_code',
        'brand',
        'color',
        'image_url',
        'status',
        'purchase_date',
        'requires_service',
        'service_interval_days',
        'last_service_date',
        'next_service_date',
    ];

    protected $casts = [
        'requires_service' => 'boolean',
        'purchase_date' => 'date',
        'last_service_date' => 'date',
        'next_service_date' => 'date',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function bookingEquipment()
    {
        return $this->hasMany(BookingEquipment::class);
    }

    public function serviceHistory()
    {
        return $this->hasMany(EquipmentServiceHistory::class);
    }

    /**
     * Calculate next service date based on last service date and interval
     */
    public function calculateNextServiceDate(): ?\Carbon\Carbon
    {
        if (!$this->requires_service || !$this->service_interval_days) {
            return null;
        }

        $baseDate = $this->last_service_date ?? $this->purchase_date;
        
        if (!$baseDate) {
            return null;
        }

        return \Carbon\Carbon::parse($baseDate)->addDays($this->service_interval_days);
    }
}
