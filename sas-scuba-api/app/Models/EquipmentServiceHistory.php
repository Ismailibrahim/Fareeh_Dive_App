<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentServiceHistory extends Model
{
    protected $table = 'equipment_service_history';

    protected $fillable = [
        'equipment_item_id',
        'service_date',
        'service_type',
        'technician',
        'service_provider',
        'cost',
        'notes',
        'parts_replaced',
        'warranty_info',
        'next_service_due_date',
    ];

    protected $casts = [
        'service_date' => 'date',
        'cost' => 'decimal:2',
        'next_service_due_date' => 'date',
    ];

    public function equipmentItem()
    {
        return $this->belongsTo(EquipmentItem::class);
    }
}

