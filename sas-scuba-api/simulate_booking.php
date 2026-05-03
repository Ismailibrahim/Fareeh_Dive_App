<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\V1\BookingDiveController;
use Illuminate\Http\Request;
use App\Models\User;

$user = User::first();
\Illuminate\Support\Facades\Auth::login($user);

// Create a simulated request with 2 different sites in additional_items
$request = Request::create('/api/v1/booking-dives', 'POST', [
    'customer_id' => 8,
    'booking_date' => '2026-04-27',
    'number_of_divers' => 1,
    'dive_site_id' => 8, // Main site
    'status' => 'Scheduled',
    'additional_items' => [
        [
            'price_list_item_id' => 28,
            'price' => 100,
            'dive_site_id' => 10 // Site 2
        ],
        [
            'price_list_item_id' => 28,
            'price' => 100,
            'dive_site_id' => 11 // Site 3
        ]
    ]
]);

$request->setUserResolver(function () use ($user) {
    return $user;
});

$controller = new BookingDiveController();
try {
    $response = $controller->store($request);
    echo "Response status: " . $response->getStatusCode() . "\n";

    $data = json_decode($response->getContent(), true);
    echo "Created Booking ID: " . ($data['booking_id'] ?? 'N/A') . "\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "Validation errors:\n";
    print_r($e->errors());
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
