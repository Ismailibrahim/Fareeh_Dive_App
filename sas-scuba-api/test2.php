<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check the excursion for booking 4
$booking = \App\Models\Booking::with("bookingExcursions")->find(4);
echo "Booking 4 - excursions: " . count($booking->bookingExcursions) . "\n";
foreach ($booking->bookingExcursions as $exc) {
    echo "  Exc ID: " . $exc->id . ", Status: " . $exc->status . ", Price: " . $exc->price . "\n";
}

// Simulate the filter used in generateFromBooking
$excursions = $booking->bookingExcursions()->whereIn("status", ["Scheduled", "In Progress", "Completed"])->whereDoesntHave("invoiceItems")->with(["excursion", "priceListItem"])->get();
echo "Filtered excursions for invoice: " . count($excursions) . "\n";

// Try creating an invoice item manually
try {
    $exc = $excursions->first();
    if ($exc) {
        $item = \App\Models\InvoiceItem::create([
            "invoice_id" => 1,
            "booking_excursion_id" => $exc->id,
            "price_list_item_id" => $exc->price_list_item_id,
            "description" => "Test - " . ($exc->excursion->name ?? "Unknown"),
            "quantity" => $exc->number_of_participants ?? 1,
            "unit_price" => $exc->price ?? 0,
            "total" => ($exc->price ?? 0) * ($exc->number_of_participants ?? 1),
        ]);
        echo "Created invoice item ID: " . $item->id . "\n";
        $item->delete();
    } else {
        echo "No excursion to test with\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

