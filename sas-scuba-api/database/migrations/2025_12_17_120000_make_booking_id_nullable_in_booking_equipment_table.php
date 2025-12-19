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
        Schema::table('booking_equipment', function (Blueprint $table) {
            // Make booking_id nullable to support baskets without bookings
            $table->foreignId('booking_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_equipment', function (Blueprint $table) {
            // Note: This might fail if there are NULL values in the database
            // You may need to clean up NULL values before running this migration
            $table->foreignId('booking_id')->nullable(false)->change();
        });
    }
};

