<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackagePricingTier extends Model
{
    protected $fillable = [
        'package_id',
        'min_persons',
        'max_persons',
        'price_per_person',
        'discount_percentage',
        'is_active',
    ];

    protected $casts = [
        'price_per_person' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'min_persons' => 'integer',
        'max_persons' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    // Methods
    public function appliesTo(int $personCount): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($personCount < $this->min_persons) {
            return false;
        }

        if ($this->max_persons !== null && $personCount > $this->max_persons) {
            return false;
        }

        return true;
    }
}
