<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WaiverSignature extends Model
{
    protected $fillable = [
        'waiver_id',
        'customer_id',
        'booking_id',
        'signature_data',
        'signature_format',
        'form_data',
        'signed_by_user_id',
        'witness_user_id',
        'ip_address',
        'user_agent',
        'signed_at',
        'expires_at',
        'is_valid',
        'invalidated_at',
        'invalidation_reason',
        'verification_status',
        'verified_by',
        'verified_at',
        'verification_notes',
    ];

    protected $casts = [
        'form_data' => 'array',
        'signed_at' => 'datetime',
        'expires_at' => 'date',
        'is_valid' => 'boolean',
        'invalidated_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    /**
     * Get the waiver this signature belongs to.
     */
    public function waiver(): BelongsTo
    {
        return $this->belongsTo(Waiver::class);
    }

    /**
     * Get the customer who signed.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the booking this signature is associated with.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Get the user who recorded the signature.
     */
    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by_user_id');
    }

    /**
     * Get the witness user.
     */
    public function witness(): BelongsTo
    {
        return $this->belongsTo(User::class, 'witness_user_id');
    }

    /**
     * Get the user who verified the signature.
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Get all reminders for this signature.
     */
    public function reminders(): HasMany
    {
        return $this->hasMany(WaiverReminder::class);
    }

    /**
     * Check if signature is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if signature is valid (not expired and not invalidated).
     */
    public function isValid(): bool
    {
        return $this->is_valid && !$this->isExpired();
    }

    /**
     * Get days until expiry.
     */
    public function daysUntilExpiry(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }
        return max(0, now()->diffInDays($this->expires_at, false));
    }

    /**
     * Invalidate the signature.
     */
    public function invalidate(string $reason): void
    {
        $this->update([
            'is_valid' => false,
            'invalidated_at' => now(),
            'invalidation_reason' => $reason,
        ]);
    }

    /**
     * Verify the signature.
     */
    public function verify(int $userId, ?string $notes = null): void
    {
        $this->update([
            'verification_status' => 'verified',
            'verified_by' => $userId,
            'verified_at' => now(),
            'verification_notes' => $notes,
        ]);
    }
}
