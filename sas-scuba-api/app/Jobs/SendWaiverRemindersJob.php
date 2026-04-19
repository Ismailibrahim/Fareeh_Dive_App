<?php

namespace App\Jobs;

use App\Services\WaiverReminderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWaiverRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(WaiverReminderService $reminderService): void
    {
        // Check for expiring waivers (30 days before expiry)
        $reminderService->checkAndSendExpiringReminders(30);
        
        // Check for expired waivers
        $reminderService->checkAndSendExpiredReminders();
    }
}
