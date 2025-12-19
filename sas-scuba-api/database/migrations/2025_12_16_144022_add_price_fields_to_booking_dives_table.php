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
            $table->foreignId('price_list_item_id')->nullable()->after('dive_time')
                  ->constrained('price_list_items')->onDelete('set null');
            $table->decimal('price', 10, 2)->nullable()->after('price_list_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_dives', function (Blueprint $table) {
            $table->dropForeign(['price_list_item_id']);
            $table->dropColumn(['price_list_item_id', 'price']);
        });
    }
};
