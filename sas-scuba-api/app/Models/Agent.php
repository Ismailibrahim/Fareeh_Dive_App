<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Agent extends Model
{
    protected $fillable = [
        'dive_center_id',
        'agent_name',
        'agent_type',
        'country',
        'city',
        'status',
        'brand_name',
        'website',
        'notes',
    ];

    // Relationships
    public function diveCenter(): BelongsTo
    {
        return $this->belongsTo(DiveCenter::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(AgentContact::class);
    }

    public function commercialTerms(): HasOne
    {
        return $this->hasOne(AgentCommercialTerm::class);
    }

    public function billingInfo(): HasOne
    {
        return $this->hasOne(AgentBillingInfo::class);
    }

    public function contract(): HasOne
    {
        return $this->hasOne(AgentContract::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AgentCommission::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'agent_tags');
    }

    // Performance Metrics Accessors
    public function getTotalClientsReferredAttribute(): int
    {
        try {
            return $this->bookings()->distinct('customer_id')->count('customer_id');
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function getTotalDivesBookedAttribute(): int
    {
        try {
            return $this->bookings()->withCount('bookingDives')->get()->sum('booking_dives_count');
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function getTotalRevenueGeneratedAttribute(): float
    {
        try {
            return (float) $this->invoices()->sum('total');
        } catch (\Exception $e) {
            return 0.0;
        }
    }

    public function getTotalCommissionEarnedAttribute(): float
    {
        try {
            return (float) $this->commissions()->where('status', '!=', 'Cancelled')->sum('commission_amount');
        } catch (\Exception $e) {
            return 0.0;
        }
    }

    public function getAverageRevenuePerClientAttribute(): float
    {
        try {
            $clientsCount = $this->total_clients_referred;
            if ($clientsCount === 0) {
                return 0;
            }
            return round($this->total_revenue_generated / $clientsCount, 2);
        } catch (\Exception $e) {
            return 0.0;
        }
    }

    public function getLastBookingDateAttribute(): ?string
    {
        try {
            $lastBooking = $this->bookings()->orderBy('booking_date', 'desc')->first();
            if (!$lastBooking || !$lastBooking->booking_date) {
                return null;
            }
            $date = $lastBooking->booking_date;
            if ($date instanceof \Carbon\Carbon || $date instanceof \DateTime) {
                return $date->format('Y-m-d');
            }
            return is_string($date) ? $date : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getActiveClientsLast30DaysAttribute(): int
    {
        try {
            $date = now()->subDays(30)->format('Y-m-d');
            return $this->bookings()
                ->where('booking_date', '>=', $date)
                ->distinct('customer_id')
                ->count('customer_id');
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function getActiveClientsLast90DaysAttribute(): int
    {
        try {
            $date = now()->subDays(90)->format('Y-m-d');
            return $this->bookings()
                ->where('booking_date', '>=', $date)
                ->distinct('customer_id')
                ->count('customer_id');
        } catch (\Exception $e) {
            return 0;
        }
    }
}
