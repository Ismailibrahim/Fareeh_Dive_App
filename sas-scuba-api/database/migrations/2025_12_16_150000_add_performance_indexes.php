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
        // Add indexes to bookings table
        try {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index('dive_center_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index('customer_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index('status');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index('booking_date');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index('dive_package_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index('basket_id');
            });
        } catch (\Exception $e) {}

        // Add indexes to booking_dives table
        try {
            Schema::table('booking_dives', function (Blueprint $table) {
                $table->index('booking_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_dives', function (Blueprint $table) {
                $table->index('dive_site_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_dives', function (Blueprint $table) {
                $table->index('status');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_dives', function (Blueprint $table) {
                $table->index('completed_at');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_dives', function (Blueprint $table) {
                $table->index('dive_package_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_dives', function (Blueprint $table) {
                $table->index('price_list_item_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_dives', function (Blueprint $table) {
                $table->index(['status', 'completed_at'], 'bd_status_completed_idx');
            });
        } catch (\Exception $e) {}

        // Add indexes to invoices table
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index('dive_center_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index('booking_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index('status');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index('invoice_type');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index('invoice_date');
            });
        } catch (\Exception $e) {}

        // Add indexes to invoice_items table
        try {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->index('invoice_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->index('booking_dive_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->index('booking_equipment_id');
            });
        } catch (\Exception $e) {}

        // Add indexes to payments table
        try {
            Schema::table('payments', function (Blueprint $table) {
                $table->index('invoice_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('payments', function (Blueprint $table) {
                $table->index('payment_date');
            });
        } catch (\Exception $e) {}

        // Add indexes to dive_packages table
        try {
            Schema::table('dive_packages', function (Blueprint $table) {
                $table->index('dive_center_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('dive_packages', function (Blueprint $table) {
                $table->index('customer_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('dive_packages', function (Blueprint $table) {
                $table->index('status');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('dive_packages', function (Blueprint $table) {
                $table->index('package_start_date');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('dive_packages', function (Blueprint $table) {
                $table->index('package_end_date');
            });
        } catch (\Exception $e) {}

        // Add indexes to equipment_baskets table
        try {
            Schema::table('equipment_baskets', function (Blueprint $table) {
                $table->index('dive_center_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('equipment_baskets', function (Blueprint $table) {
                $table->index('customer_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('equipment_baskets', function (Blueprint $table) {
                $table->index('status');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('equipment_baskets', function (Blueprint $table) {
                $table->index('checkout_date');
            });
        } catch (\Exception $e) {}

        // Add indexes to booking_equipment table (skip if already added in previous migration)
        try {
            Schema::table('booking_equipment', function (Blueprint $table) {
                $table->index('booking_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_equipment', function (Blueprint $table) {
                $table->index('basket_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_equipment', function (Blueprint $table) {
                $table->index('equipment_item_id');
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('booking_equipment', function (Blueprint $table) {
                $table->index('assignment_status');
            });
        } catch (\Exception $e) {}
        // Skip composite index if it already exists from previous migration
        try {
            Schema::table('booking_equipment', function (Blueprint $table) {
                $table->index(['equipment_item_id', 'checkout_date', 'return_date'], 'beq_avail_idx');
            });
        } catch (\Exception $e) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['dive_center_id']);
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['booking_date']);
            $table->dropIndex(['dive_package_id']);
            $table->dropIndex(['basket_id']);
        });

        Schema::table('booking_dives', function (Blueprint $table) {
            $table->dropIndex(['booking_id']);
            $table->dropIndex(['dive_site_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['completed_at']);
            $table->dropIndex(['dive_package_id']);
            $table->dropIndex(['price_list_item_id']);
            $table->dropIndex('bd_status_completed_idx');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['dive_center_id']);
            $table->dropIndex(['booking_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['invoice_type']);
            $table->dropIndex(['invoice_date']);
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropIndex(['invoice_id']);
            $table->dropIndex(['booking_dive_id']);
            $table->dropIndex(['booking_equipment_id']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['invoice_id']);
            $table->dropIndex(['payment_date']);
        });

        Schema::table('dive_packages', function (Blueprint $table) {
            $table->dropIndex(['dive_center_id']);
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['package_start_date']);
            $table->dropIndex(['package_end_date']);
        });

        Schema::table('equipment_baskets', function (Blueprint $table) {
            $table->dropIndex(['dive_center_id']);
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['checkout_date']);
        });

        Schema::table('booking_equipment', function (Blueprint $table) {
            $table->dropIndex(['booking_id']);
            $table->dropIndex(['basket_id']);
            $table->dropIndex(['equipment_item_id']);
            $table->dropIndex(['assignment_status']);
            try { $table->dropIndex('beq_avail_idx'); } catch (\Exception $e) {}
        });
    }
};

