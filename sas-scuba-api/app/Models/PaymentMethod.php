<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class PaymentMethod extends Model
{
    protected $fillable = [
        'dive_center_id',
        'method_type',
        'name',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * Get the dive center that owns this payment method.
     */
    public function diveCenter(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class);
    }

    /**
     * Get all payments using this payment method.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Scope a query to only include active payment methods.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by dive center.
     */
    public function scopeForDiveCenter(Builder $query, int $diveCenterId): Builder
    {
        return $query->where('dive_center_id', $diveCenterId);
    }

    /**
     * Scope a query to filter by method type.
     */
    public function scopeByMethodType(Builder $query, string $methodType): Builder
    {
        return $query->where('method_type', $methodType);
    }
}
