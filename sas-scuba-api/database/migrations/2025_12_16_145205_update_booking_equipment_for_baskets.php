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
            if (!Schema::hasColumn('booking_equipment', 'basket_id')) {
                $table->foreignId('basket_id')->nullable()->after('booking_id')
                      ->constrained('equipment_baskets')->onDelete('set null');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'checkout_date')) {
                $table->date('checkout_date')->nullable()->after('price');
            }
            if (!Schema::hasColumn('booking_equipment', 'return_date')) {
                $table->date('return_date')->nullable()->after('checkout_date');
            }
            if (!Schema::hasColumn('booking_equipment', 'actual_return_date')) {
                $table->date('actual_return_date')->nullable()->after('return_date');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'equipment_source')) {
                $table->enum('equipment_source', ['Center', 'Customer Own'])->default('Center')
                      ->after('actual_return_date');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'customer_equipment_brand')) {
                $table->string('customer_equipment_brand')->nullable()->after('equipment_source');
            }
            if (!Schema::hasColumn('booking_equipment', 'customer_equipment_model')) {
                $table->string('customer_equipment_model')->nullable()->after('customer_equipment_brand');
            }
            if (!Schema::hasColumn('booking_equipment', 'customer_equipment_serial')) {
                $table->string('customer_equipment_serial')->nullable()->after('customer_equipment_model');
            }
            if (!Schema::hasColumn('booking_equipment', 'customer_equipment_notes')) {
                $table->text('customer_equipment_notes')->nullable()->after('customer_equipment_serial');
            }
            
            if (!Schema::hasColumn('booking_equipment', 'assignment_status')) {
                $table->enum('assignment_status', ['Pending', 'Checked Out', 'Returned', 'Lost'])
                      ->default('Pending')->after('customer_equipment_notes');
            }
        });
        
        // Add indexes separately to avoid conflicts
        try {
            Schema::table('booking_equipment', function (Blueprint $table) {
                $table->index(['equipment_item_id', 'checkout_date', 'return_date'], 'beq_avail_idx');
            });
        } catch (\Exception $e) {
            // Index already exists, skip
        }
        
        try {
            Schema::table('booking_equipment', function (Blueprint $table) {
                $table->index('basket_id');
            });
        } catch (\Exception $e) {
            // Index already exists, skip
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_equipment', function (Blueprint $table) {
            $table->dropForeign(['basket_id']);
            $table->dropIndex('beq_avail_idx');
            $table->dropIndex(['basket_id']);
            $table->dropColumn([
                'basket_id',
                'checkout_date',
                'return_date',
                'actual_return_date',
                'equipment_source',
                'customer_equipment_brand',
                'customer_equipment_model',
                'customer_equipment_serial',
                'customer_equipment_notes',
                'assignment_status',
            ]);
        });
    }
};

