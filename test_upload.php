<?php
require __DIR__.'/sas-scuba-api/vendor/autoload.php';
$app = require_once __DIR__.'/sas-scuba-api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::first();
$token = $user->createToken('test')->plainTextToken;

$ch = curl_init('http://localhost:8000/api/v1/files/upload');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'file' => new CURLFile('d:\Sandbox\Fareeh_DiveApplicaiton\sas-scuba-web\public\test.jpg'),
    'entityType' => 'equipment_item',
    'entityId' => 'temp',
    'category' => 'equipment-photo'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$headers = [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
echo "Response:\n";
echo $response;
