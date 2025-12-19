<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiveSite extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'max_depth',
        'description',
        'latitude',
        'longitude',
        'location',
        'pax_capacity',
        'attachment',
    ];

    protected $casts = [
        'max_depth' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
        'pax_capacity' => 'integer',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }
}
