<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Booking;
use App\Models\Invoice;

$bookings = Booking::latest()->take(3)->get();
echo "RECENT BOOKINGS:\n";
foreach ($bookings as $b) {
    echo "ID: {$b->id} | Date: {$b->booking_date} | Customer: {$b->customer->full_name}\n";
}

$invoices = Invoice::latest()->take(3)->get();
echo "\nRECENT INVOICES:\n";
foreach ($invoices as $i) {
    echo "ID: {$i->id} | No: {$i->invoice_no} | Booking ID: {$i->booking_id}\n";
}
