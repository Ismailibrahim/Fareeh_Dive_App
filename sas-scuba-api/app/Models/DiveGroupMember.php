<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiveGroupMember extends Pivot
{
    protected $table = 'dive_group_members';

    protected $fillable = [
        'dive_group_id',
        'customer_id',
        'joined_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public $timestamps = true;

    // Relationships
    public function diveGroup(): BelongsTo
    {
        return $this->belongsTo(DiveGroup::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}

