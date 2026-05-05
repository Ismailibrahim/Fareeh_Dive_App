<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check all invoice items linked to excursion 3
$items = \App\Models\InvoiceItem::where("booking_excursion_id", 3)->get();
echo "Invoice items for excursion 3: " . count($items) . "\n";
foreach ($items as $item) {
    echo "  Item ID: " . $item->id . ", Invoice ID: " . $item->invoice_id . ", Desc: " . $item->description . "\n";
}

// Check all invoices
$invs = \App\Models\Invoice::all(["id", "booking_id", "status", "total"]);
foreach ($invs as $inv) {
    echo "Invoice " . $inv->id . ": booking=" . $inv->booking_id . ", status=" . $inv->status . ", total=" . $inv->total . "\n";
}

