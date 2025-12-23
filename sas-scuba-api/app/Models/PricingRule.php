<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingRule extends Model
{
    protected $fillable = [
        'rule_name',
        'rule_type',
        'condition',
        'action',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'condition' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Scope a query to only include active rules.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by rule type.
     */
    public function scopeByType($query, $type)
    {
        return $query->where('rule_type', $type);
    }

    /**
     * Get rules ordered by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }
}
