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
    ];

    protected $casts = [
        'active' => 'boolean',
        'capacity' => 'integer',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }
}
