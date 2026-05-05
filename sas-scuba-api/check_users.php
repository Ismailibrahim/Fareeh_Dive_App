<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$users = \App\Models\User::select("id", "email", "created_at")->get();
foreach ($users as $u) {
    echo "ID: {$u->id} | Email: {$u->email}\n";
}

