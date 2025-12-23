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
        // This migration may run before the base schema migration
        if (Schema::hasTable('equipment_items')) {
            Schema::table('equipment_items', function (Blueprint $table) {
                // Check if columns don't already exist
                if (!Schema::hasColumn('equipment_items', 'inventory_code')) {
                    $table->string('inventory_code')->nullable();
                }
                if (!Schema::hasColumn('equipment_items', 'brand')) {
                    $table->string('brand')->nullable();
                }
                if (!Schema::hasColumn('equipment_items', 'color')) {
                    $table->string('color')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipment_items', function (Blueprint $table) {
            $table->dropColumn(['inventory_code', 'brand', 'color']);
        });
    }
};

