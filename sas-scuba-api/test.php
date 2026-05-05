<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = new \Illuminate\Http\Request([
    "booking_id" => 4,
    "invoice_type" => "Full",
    "include_dives" => true,
    "include_equipment" => true,
    "include_excursions" => true,
]);
$request->setUserResolver(function() {
    return \App\Models\User::first();
});

$controller = new \App\Http\Controllers\Api\V1\InvoiceController();
$response = $controller->generateFromBooking($request);
echo "RESPONSE: " . $response->getContent() . "\n";

