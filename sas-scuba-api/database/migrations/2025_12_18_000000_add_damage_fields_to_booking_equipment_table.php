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
            // Check if columns exist before adding
            if (!Schema::hasColumn('booking_equipment', 'damage_reported')) {
                $table->boolean('damage_reported')->default(false)->after('assignment_status');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'damage_description')) {
                $table->text('damage_description')->nullable()->after('damage_reported');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'damage_cost')) {
                $table->decimal('damage_cost', 10, 2)->nullable()->after('damage_description');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'charge_customer')) {
                $table->boolean('charge_customer')->default(false)->after('damage_cost');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'damage_charge_amount')) {
                $table->decimal('damage_charge_amount', 10, 2)->nullable()->after('charge_customer');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_equipment', function (Blueprint $table) {
            if (Schema::hasColumn('booking_equipment', 'damage_reported')) {
                $table->dropColumn([
                    'damage_reported',
                    'damage_description',
                    'damage_cost',
                    'charge_customer',
                    'damage_charge_amount',
                ]);
            }
        });
    }
};

