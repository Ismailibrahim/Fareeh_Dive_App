<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DiveSite;

foreach (DiveSite::all() as $site) {
    echo "ID: {$site->id} | Name: {$site->name}\n";
}
