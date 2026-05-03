<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice;

$invoiceId = 2;
$invoice = Invoice::with('invoiceItems.bookingDive.diveSite')->find($invoiceId);

if (!$invoice) {
    echo "Invoice {$invoiceId} not found.\n";
    // Check latest
    $latest = Invoice::latest()->first();
    if ($latest) {
        echo "Latest Invoice is ID {$latest->id} ({$latest->invoice_no})\n";
    }
    exit;
}

echo "INVOICE: {$invoice->invoice_no} | Total: {$invoice->total}\n";
echo "ITEMS:\n";
foreach ($invoice->invoiceItems as $item) {
    $siteName = $item->bookingDive->diveSite->name ?? 'None';
    echo "-- Desc: {$item->description} | Dive ID: {$item->booking_dive_id} | Site in Dive Table: {$siteName}\n";
}
