<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'category',
        'active',
        'sizes',
        'brands',
    ];

    protected $casts = [
        'active' => 'boolean',
        'sizes' => 'array',
        'brands' => 'array',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function equipmentItems()
    {
        return $this->hasMany(EquipmentItem::class);
    }
}
