<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentType extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }
}
