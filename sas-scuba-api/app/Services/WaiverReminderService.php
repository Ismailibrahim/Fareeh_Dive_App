<?php

namespace App\Services;

use App\Models\WaiverSignature;
use App\Models\WaiverReminder;
use Illuminate\Support\Facades\Log;

class WaiverReminderService
{
    /**
     * Check and send reminders for expiring waivers.
     */
    public function checkAndSendExpiringReminders(int $daysBeforeExpiry = 30): void
    {
        $expiryDate = now()->addDays($daysBeforeExpiry);
        
        $signatures = WaiverSignature::where('is_valid', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $expiryDate)
            ->where('expires_at', '>', now())
            ->with(['customer', 'waiver'])
            ->get();

        foreach ($signatures as $signature) {
            $this->sendExpiringReminder($signature);
        }
    }

    /**
     * Check and send reminders for expired waivers.
     */
    public function checkAndSendExpiredReminders(): void
    {
        $signatures = WaiverSignature::where('is_valid', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->with(['customer', 'waiver'])
            ->get();

        foreach ($signatures as $signature) {
            $this->sendExpiredReminder($signature);
            // Optionally invalidate expired signatures
            $signature->invalidate('Automatically expired');
        }
    }

    /**
     * Send expiring reminder for a signature.
     */
    private function sendExpiringReminder(WaiverSignature $signature): void
    {
        // Check if reminder already sent
        $existingReminder = WaiverReminder::where('waiver_signature_id', $signature->id)
            ->where('reminder_type', 'expiring_soon')
            ->where('is_sent', true)
            ->exists();

        if ($existingReminder) {
            return;
        }

        $reminder = WaiverReminder::create([
            'waiver_signature_id' => $signature->id,
            'customer_id' => $signature->customer_id,
            'reminder_type' => 'expiring_soon',
            'channel' => 'email',
        ]);

        // TODO: Send notification when NotificationService is implemented
        // For now, just log it
        Log::info('Waiver expiring reminder', [
            'customer_id' => $signature->customer_id,
            'waiver_id' => $signature->waiver_id,
            'expires_at' => $signature->expires_at,
        ]);

        $reminder->markAsSent();
    }

    /**
     * Send expired reminder for a signature.
     */
    private function sendExpiredReminder(WaiverSignature $signature): void
    {
        $reminder = WaiverReminder::create([
            'waiver_signature_id' => $signature->id,
            'customer_id' => $signature->customer_id,
            'reminder_type' => 'expired',
            'channel' => 'email',
        ]);

        // TODO: Send notification when NotificationService is implemented
        // For now, just log it
        Log::info('Waiver expired reminder', [
            'customer_id' => $signature->customer_id,
            'waiver_id' => $signature->waiver_id,
            'expires_at' => $signature->expires_at,
        ]);

        $reminder->markAsSent();
    }
}
