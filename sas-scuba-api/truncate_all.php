<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

DB::statement('SET FOREIGN_KEY_CHECKS=0;');

DB::table('payments')->truncate();
DB::table('invoice_items')->truncate();
DB::table('invoices')->truncate();
DB::table('booking_dives')->truncate();
DB::table('bookings')->truncate();

DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "All bookings, booking_dives, invoices, invoice_items, and payments have been truncated.\n";
