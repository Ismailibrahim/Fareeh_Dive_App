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
        Schema::table('invoices', function (Blueprint $table) {
            // Drop the existing foreign key constraint on booking_id
            $table->dropForeign(['booking_id']);
        });

        // Modify booking_id to be nullable (need to use DB facade for column modification)
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE invoices MODIFY booking_id BIGINT UNSIGNED NULL');

        Schema::table('invoices', function (Blueprint $table) {
            // Re-add the foreign key constraint (now nullable)
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            
            // Add customer_id
            $table->foreignId('customer_id')->nullable()->after('dive_center_id')->constrained('customers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Remove customer_id
            $table->dropForeign(['customer_id']);
            $table->dropColumn('customer_id');
            
            // Drop and recreate booking_id foreign key as required
            $table->dropForeign(['booking_id']);
        });

        // Make booking_id required again (note: this might fail if there are null values)
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE invoices MODIFY booking_id BIGINT UNSIGNED NOT NULL');

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
        });
    }
};
