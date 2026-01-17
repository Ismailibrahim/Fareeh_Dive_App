<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('dive_package_id')->nullable()->after('customer_id')
                  ->constrained('dive_packages')->onDelete('set null');
            $table->integer('package_day_number')->nullable()->after('dive_package_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            $columnsToDrop = [];
            
            if (Schema::hasColumn('bookings', 'dive_package_id')) {
                try {
                    $table->dropForeign(['dive_package_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
                $columnsToDrop[] = 'dive_package_id';
            }
            
            if (Schema::hasColumn('bookings', 'package_day_number')) {
                $columnsToDrop[] = 'package_day_number';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};

