<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\BookingDive;

foreach (BookingDive::all() as $d) {
    echo "ID: {$d->id} | Date: {$d->dive_date} | Parent: {$d->parent_id} | BookingDate: {$d->booking->booking_date}\n";
}
