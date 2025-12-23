<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiveGroup extends Model
{
    protected $fillable = [
        'dive_center_id',
        'group_name',
        'agent_id',
        'description',
        'status',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function diveCenter(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'dive_group_members')
            ->withPivot('joined_at')
            ->withTimestamps()
            ->using(DiveGroupMember::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'dive_group_id');
    }

    // Accessors
    public function getMemberCountAttribute(): int
    {
        return $this->members()->count();
    }

    // Methods
    public function isActive(): bool
    {
        return $this->status === 'Active';
    }

    /**
     * Check if a customer can be added to this group
     * A customer can only be in one active group at a time
     */
    public function canAddMember(int $customerId): bool
    {
        // Check if customer is already in this group
        if ($this->members()->where('customers.id', $customerId)->exists()) {
            return false;
        }

        // Check if customer is in another active group
        $otherGroup = DiveGroup::where('status', 'Active')
            ->where('id', '!=', $this->id)
            ->whereHas('members', function ($query) use ($customerId) {
                $query->where('customers.id', $customerId);
            })
            ->exists();

        return !$otherGroup;
    }

    /**
     * Get all bookings for group members
     */
    public function getMemberBookings()
    {
        $customerIds = $this->members()->pluck('customers.id');
        return Booking::whereIn('customer_id', $customerIds)
            ->where('dive_center_id', $this->dive_center_id)
            ->get();
    }
}

