<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Boat extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'capacity',
        'active',
        'is_owned',
    ];

    protected $casts = [
        'active' => 'boolean',
        'capacity' => 'integer',
        'is_owned' => 'boolean',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }
}
