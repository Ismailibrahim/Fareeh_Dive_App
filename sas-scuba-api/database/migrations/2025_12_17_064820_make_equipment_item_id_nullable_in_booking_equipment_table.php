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
            // Drop the foreign key constraint first
            $table->dropForeign(['equipment_item_id']);
            
            // Make the column nullable
            $table->foreignId('equipment_item_id')->nullable()->change();
            
            // Re-add the foreign key constraint with nullable support
            $table->foreign('equipment_item_id')
                  ->references('id')
                  ->on('equipment_items')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_equipment', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['equipment_item_id']);
            
            // Make the column NOT nullable again
            $table->foreignId('equipment_item_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('equipment_item_id')
                  ->references('id')
                  ->on('equipment_items')
                  ->onDelete('cascade');
        });
    }
};
