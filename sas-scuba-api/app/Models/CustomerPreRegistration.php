<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CustomerPreRegistration extends Model
{
    protected $fillable = [
        'dive_center_id',
        'token',
        'expires_at',
        'status',
        'customer_data',
        'emergency_contacts_data',
        'certifications_data',
        'insurance_data',
        'accommodation_data',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
        'created_customer_id',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'customer_data' => 'array',
        'emergency_contacts_data' => 'array',
        'certifications_data' => 'array',
        'insurance_data' => 'array',
        'accommodation_data' => 'array',
    ];

    /**
     * Generate a unique token for the registration link
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::uuid()->toString();
        } while (self::where('token', $token)->exists());

        return $token;
    }

    /**
     * Check if the registration link is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the registration can be submitted
     */
    public function canSubmit(): bool
    {
        return $this->status === 'pending' && !$this->isExpired() && $this->submitted_at === null;
    }

    /**
     * Get the dive center that owns this registration
     */
    public function diveCenter()
    {
        return $this->belongsTo(DiveCenter::class);
    }

    /**
     * Get the user who reviewed this registration
     */
    public function reviewedByUser()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Get the customer created from this registration (if approved)
     */
    public function createdCustomer()
    {
        return $this->belongsTo(Customer::class, 'created_customer_id');
    }
}
