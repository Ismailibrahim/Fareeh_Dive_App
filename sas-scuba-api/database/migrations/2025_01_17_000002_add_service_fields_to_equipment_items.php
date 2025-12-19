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
        Schema::table('equipment_items', function (Blueprint $table) {
            $table->date('purchase_date')->nullable();
            $table->boolean('requires_service')->default(false);
            $table->integer('service_interval_days')->nullable();
            $table->date('last_service_date')->nullable();
            $table->date('next_service_date')->nullable();
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

