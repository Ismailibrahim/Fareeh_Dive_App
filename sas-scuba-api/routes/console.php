<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule waiver reminder job to run daily at 9 AM
Schedule::job(new \App\Jobs\SendWaiverRemindersJob)->dailyAt('09:00');
