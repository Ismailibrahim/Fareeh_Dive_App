<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\InvoiceItem;

$items = InvoiceItem::with(['bookingDive.booking', 'bookingDive.diveSite', 'bookingDive.priceListItem'])->get();

foreach ($items as $item) {
    if (!$item->bookingDive) continue;
    
    $dive = $item->bookingDive;
    $booking = $dive->booking;
    
    if (!$booking) continue;

    $siteName = $dive->diveSite->name ?? 'Unknown';
    $actualDate = $dive->dive_date ?: $booking->booking_date;
    $dateStr = $actualDate ? date('M d, Y', strtotime($actualDate)) : '';
    $itemName = $dive->priceListItem->name ?? 'Dive';
    
    $description = $dateStr ? "{$itemName} - {$siteName} ({$dateStr})" : "{$itemName} - {$siteName}";
    
    if ($item->description !== $description) {
        echo "Updating Item ID {$item->id}: {$item->description} -> {$description}\n";
        $item->description = $description;
        $item->save();
    }
}
echo "Done updating invoices.\n";
