<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'dive_center_id',
        'name',
        'address',
        'contact_no',
        'email',
        'gst_tin',
        'currency',
        'status',
    ];

    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }
}
