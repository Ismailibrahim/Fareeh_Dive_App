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
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['dive_package_id']);
            $table->dropColumn(['dive_package_id', 'package_day_number']);
        });
    }
};

