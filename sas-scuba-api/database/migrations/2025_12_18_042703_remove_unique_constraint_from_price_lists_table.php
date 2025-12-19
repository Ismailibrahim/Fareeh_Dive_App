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
        Schema::table('price_lists', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['dive_center_id']);
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Remove unique constraint to allow multiple price lists per dive center
            $table->dropUnique(['dive_center_id']);
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Recreate foreign key constraint without unique
            $table->foreign('dive_center_id')->references('id')->on('dive_centers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('price_lists', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['dive_center_id']);
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Restore unique constraint (one price list per dive center)
            $table->unique('dive_center_id');
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Recreate foreign key constraint with unique
            $table->foreign('dive_center_id')->references('id')->on('dive_centers')->onDelete('cascade');
        });
    }
};
