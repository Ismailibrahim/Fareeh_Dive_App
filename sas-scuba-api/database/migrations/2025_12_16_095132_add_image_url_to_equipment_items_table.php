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
        // Check if table exists before trying to alter it
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        Schema::table('equipment_items', function (Blueprint $table) {
            // Check if column doesn't already exist
            if (!Schema::hasColumn('equipment_items', 'image_url')) {
                // Try to add after 'color' if it exists, otherwise just add it
                if (Schema::hasColumn('equipment_items', 'color')) {
                    $table->string('image_url')->nullable()->after('color');
                } else {
                    $table->string('image_url')->nullable();
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        Schema::table('equipment_items', function (Blueprint $table) {
            if (Schema::hasColumn('equipment_items', 'image_url')) {
                $table->dropColumn('image_url');
            }
        });
    }
};
