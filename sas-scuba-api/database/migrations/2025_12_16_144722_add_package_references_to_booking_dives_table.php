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
        Schema::table('booking_dives', function (Blueprint $table) {
            $table->foreignId('dive_package_id')->nullable()->after('price')
                  ->constrained('dive_packages')->onDelete('set null');
            $table->boolean('is_package_dive')->default(false)->after('dive_package_id');
            $table->integer('package_dive_number')->nullable()->after('is_package_dive');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('booking_dives')) {
            return;
        }

        Schema::table('booking_dives', function (Blueprint $table) {
            $columnsToDrop = [];
            
            if (Schema::hasColumn('booking_dives', 'dive_package_id')) {
                try {
                    $table->dropForeign(['dive_package_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
                $columnsToDrop[] = 'dive_package_id';
            }
            
            if (Schema::hasColumn('booking_dives', 'is_package_dive')) {
                $columnsToDrop[] = 'is_package_dive';
            }
            
            if (Schema::hasColumn('booking_dives', 'package_dive_number')) {
                $columnsToDrop[] = 'package_dive_number';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};

