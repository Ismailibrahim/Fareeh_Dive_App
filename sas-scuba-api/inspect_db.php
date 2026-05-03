<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Booking;
use App\Models\BookingDive;
use App\Models\Invoice;

$booking = Booking::with('customer')->latest()->first();

if (!$booking) {
    echo "No bookings found.\n";
    exit;
}

echo "BOOKING: ID {$booking->id} | Customer: {$booking->customer->full_name}\n";

$dives = BookingDive::where('booking_id', $booking->id)
    ->with('diveSite')
    ->orderBy('id', 'asc')
    ->get();

echo "DIVES RECORDED:\n";
foreach ($dives as $dive) {
    $siteName = $dive->diveSite->name ?? 'None';
    $parentId = $dive->parent_id ?? 'Primary';
    echo "- ID: {$dive->id} | Site: {$siteName} | Price: {$dive->price} | Link: {$parentId}\n";
}

$invoice = Invoice::where('booking_id', $booking->id)
    ->with('invoiceItems')
    ->latest()
    ->first();

if ($invoice) {
    echo "\nINVOICE: No {$invoice->invoice_no} | Total: {$invoice->total}\n";
    echo "INVOICE ITEMS:\n";
    foreach ($invoice->invoiceItems as $item) {
        echo "-- Desc: {$item->description} | Price: {$item->unit_price}\n";
    }
} else {
    echo "\nNo invoice found for this booking.\n";
}
