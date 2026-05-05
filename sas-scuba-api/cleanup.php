<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Delete empty Draft invoices (no items, zero total)
$empty = \App\Models\Invoice::where("status", "Draft")->where("total", 0)->whereDoesntHave("invoiceItems")->get();
echo "Found " . count($empty) . " empty draft invoices to delete\n";
foreach ($empty as $inv) {
    echo "  Deleting Invoice ID " . $inv->id . " (booking " . $inv->booking_id . ")\n";
    $inv->delete();
}
echo "Done.\n";

