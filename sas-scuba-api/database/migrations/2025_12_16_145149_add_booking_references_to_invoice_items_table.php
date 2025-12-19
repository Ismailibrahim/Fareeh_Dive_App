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
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->foreignId('booking_dive_id')->nullable()->after('price_list_item_id')
                  ->constrained('booking_dives')->onDelete('set null');
            $table->foreignId('booking_equipment_id')->nullable()->after('booking_dive_id')
                  ->constrained('booking_equipment')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropForeign(['booking_dive_id']);
            $table->dropForeign(['booking_equipment_id']);
            $table->dropColumn(['booking_dive_id', 'booking_equipment_id']);
        });
    }
};

