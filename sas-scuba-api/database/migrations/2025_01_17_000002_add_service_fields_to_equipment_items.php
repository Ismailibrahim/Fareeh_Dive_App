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
            // Check if columns don't already exist
            if (!Schema::hasColumn('equipment_items', 'purchase_date')) {
                $table->date('purchase_date')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'requires_service')) {
                $table->boolean('requires_service')->default(false);
            }
            if (!Schema::hasColumn('equipment_items', 'service_interval_days')) {
                $table->integer('service_interval_days')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'last_service_date')) {
                $table->date('last_service_date')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'next_service_date')) {
                $table->date('next_service_date')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipment_items', function (Blueprint $table) {
            $table->dropColumn([
                'purchase_date',
                'requires_service',
                'service_interval_days',
                'last_service_date',
                'next_service_date',
            ]);
        });
    }
};

