<?php
/**
 * Quick script to check if departure_flight_time migration has been run
 * Run this from the sas-scuba-api directory: php ../check-migration.php
 */

require __DIR__ . '/sas-scuba-api/vendor/autoload.php';

$app = require_once __DIR__ . '/sas-scuba-api/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

try {
    if (!Schema::hasTable('customers')) {
        echo "❌ ERROR: customers table does not exist!\n";
        exit(1);
    }
    
    if (Schema::hasColumn('customers', 'departure_flight_time')) {
        echo "✅ SUCCESS: departure_flight_time column exists in customers table\n";
        
        // Check column type
        $columns = DB::select("PRAGMA table_info(customers)");
        foreach ($columns as $column) {
            if ($column->name === 'departure_flight_time') {
                echo "   Column type: " . $column->type . "\n";
                echo "   Nullable: " . ($column->notnull ? 'NO' : 'YES') . "\n";
                break;
            }
        }
    } else {
        echo "❌ ERROR: departure_flight_time column does NOT exist in customers table\n";
        echo "\n";
        echo "SOLUTION: Run the migration:\n";
        echo "  cd sas-scuba-api\n";
        echo "  php artisan migrate\n";
        echo "\n";
        exit(1);
    }
} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "\n";
    echo "Stack trace:\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

