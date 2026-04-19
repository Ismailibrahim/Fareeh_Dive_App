<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaiverReminder extends Model
{
    protected $fillable = [
        'waiver_signature_id',
        'customer_id',
        'reminder_type',
        'channel',
        'sent_at',
        'is_sent',
        'message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'is_sent' => 'boolean',
    ];

    /**
     * Get the waiver signature this reminder is for.
     */
    public function signature(): BelongsTo
    {
        return $this->belongsTo(WaiverSignature::class);
    }

    /**
     * Get the customer this reminder is for.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Mark reminder as sent.
     */
    public function markAsSent(): void
    {
        $this->update([
            'is_sent' => true,
            'sent_at' => now(),
        ]);
    }
}
