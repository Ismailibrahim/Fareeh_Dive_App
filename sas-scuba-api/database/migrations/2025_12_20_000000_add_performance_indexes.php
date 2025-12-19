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
        // Customers table indexes
        Schema::table('customers', function (Blueprint $table) {
            $table->index('dive_center_id', 'idx_customers_dive_center_id');
            $table->index('email', 'idx_customers_email');
            $table->index('passport_no', 'idx_customers_passport_no');
            $table->index('full_name', 'idx_customers_full_name');
        });

        // Bookings table indexes
        Schema::table('bookings', function (Blueprint $table) {
            $table->index('dive_center_id', 'idx_bookings_dive_center_id');
            $table->index('customer_id', 'idx_bookings_customer_id');
            $table->index('booking_date', 'idx_bookings_booking_date');
            $table->index('status', 'idx_bookings_status');
            $table->index(['dive_center_id', 'status'], 'idx_bookings_dive_center_status');
        });

        // Booking Equipment table indexes
        Schema::table('booking_equipment', function (Blueprint $table) {
            $table->index('equipment_item_id', 'idx_booking_equipment_item_id');
            $table->index('booking_id', 'idx_booking_equipment_booking_id');
            $table->index('basket_id', 'idx_booking_equipment_basket_id');
            $table->index('assignment_status', 'idx_booking_equipment_status');
            $table->index(['checkout_date', 'return_date'], 'idx_booking_equipment_dates');
            $table->index(['equipment_item_id', 'assignment_status'], 'idx_booking_equipment_item_status');
        });

        // Booking Dives table indexes
        Schema::table('booking_dives', function (Blueprint $table) {
            $table->index('booking_id', 'idx_booking_dives_booking_id');
            $table->index('dive_site_id', 'idx_booking_dives_dive_site_id');
            $table->index('dive_date', 'idx_booking_dives_dive_date');
        });

        // Invoices table indexes
        Schema::table('invoices', function (Blueprint $table) {
            $table->index('dive_center_id', 'idx_invoices_dive_center_id');
            $table->index('booking_id', 'idx_invoices_booking_id');
            $table->index('status', 'idx_invoices_status');
            $table->index('invoice_date', 'idx_invoices_invoice_date');
        });

        // Equipment Items table indexes
        Schema::table('equipment_items', function (Blueprint $table) {
            $table->index('equipment_id', 'idx_equipment_items_equipment_id');
            $table->index('status', 'idx_equipment_items_status');
            $table->index('serial_no', 'idx_equipment_items_serial_no');
        });

        // Equipment Baskets table indexes
        if (Schema::hasTable('equipment_baskets')) {
            Schema::table('equipment_baskets', function (Blueprint $table) {
                $table->index('dive_center_id', 'idx_equipment_baskets_dive_center_id');
                $table->index('customer_id', 'idx_equipment_baskets_customer_id');
                $table->index('booking_id', 'idx_equipment_baskets_booking_id');
                $table->index('status', 'idx_equipment_baskets_status');
            });
        }

        // Payments table indexes
        Schema::table('payments', function (Blueprint $table) {
            $table->index('invoice_id', 'idx_payments_invoice_id');
            $table->index('payment_date', 'idx_payments_payment_date');
        });

        // Invoice Items table indexes
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->index('invoice_id', 'idx_invoice_items_invoice_id');
        });

        // Booking Instructors table indexes
        Schema::table('booking_instructors', function (Blueprint $table) {
            $table->index('booking_dive_id', 'idx_booking_instructors_dive_id');
            $table->index('user_id', 'idx_booking_instructors_user_id');
        });

        // Users table indexes (if not already exists)
        Schema::table('users', function (Blueprint $table) {
            if (!$this->hasIndex('users', 'idx_users_dive_center_id')) {
                $table->index('dive_center_id', 'idx_users_dive_center_id');
            }
        });

        // Boats table indexes
        Schema::table('boats', function (Blueprint $table) {
            $table->index('dive_center_id', 'idx_boats_dive_center_id');
        });

        // Dive Sites table indexes
        Schema::table('dive_sites', function (Blueprint $table) {
            $table->index('dive_center_id', 'idx_dive_sites_dive_center_id');
        });

        // Equipment table indexes
        Schema::table('equipment', function (Blueprint $table) {
            $table->index('dive_center_id', 'idx_equipment_dive_center_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes in reverse order
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropIndex('idx_equipment_dive_center_id');
        });

        Schema::table('dive_sites', function (Blueprint $table) {
            $table->dropIndex('idx_dive_sites_dive_center_id');
        });

        Schema::table('boats', function (Blueprint $table) {
            $table->dropIndex('idx_boats_dive_center_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_dive_center_id');
        });

        Schema::table('booking_instructors', function (Blueprint $table) {
            $table->dropIndex('idx_booking_instructors_user_id');
            $table->dropIndex('idx_booking_instructors_dive_id');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropIndex('idx_invoice_items_invoice_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_payment_date');
            $table->dropIndex('idx_payments_invoice_id');
        });

        if (Schema::hasTable('equipment_baskets')) {
            Schema::table('equipment_baskets', function (Blueprint $table) {
                $table->dropIndex('idx_equipment_baskets_status');
                $table->dropIndex('idx_equipment_baskets_booking_id');
                $table->dropIndex('idx_equipment_baskets_customer_id');
                $table->dropIndex('idx_equipment_baskets_dive_center_id');
            });
        }

        Schema::table('equipment_items', function (Blueprint $table) {
            $table->dropIndex('idx_equipment_items_serial_no');
            $table->dropIndex('idx_equipment_items_status');
            $table->dropIndex('idx_equipment_items_equipment_id');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_invoice_date');
            $table->dropIndex('idx_invoices_status');
            $table->dropIndex('idx_invoices_booking_id');
            $table->dropIndex('idx_invoices_dive_center_id');
        });

        Schema::table('booking_dives', function (Blueprint $table) {
            $table->dropIndex('idx_booking_dives_dive_date');
            $table->dropIndex('idx_booking_dives_dive_site_id');
            $table->dropIndex('idx_booking_dives_booking_id');
        });

        Schema::table('booking_equipment', function (Blueprint $table) {
            $table->dropIndex('idx_booking_equipment_item_status');
            $table->dropIndex('idx_booking_equipment_dates');
            $table->dropIndex('idx_booking_equipment_status');
            $table->dropIndex('idx_booking_equipment_basket_id');
            $table->dropIndex('idx_booking_equipment_booking_id');
            $table->dropIndex('idx_booking_equipment_item_id');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('idx_bookings_dive_center_status');
            $table->dropIndex('idx_bookings_status');
            $table->dropIndex('idx_bookings_booking_date');
            $table->dropIndex('idx_bookings_customer_id');
            $table->dropIndex('idx_bookings_dive_center_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('idx_customers_full_name');
            $table->dropIndex('idx_customers_passport_no');
            $table->dropIndex('idx_customers_email');
            $table->dropIndex('idx_customers_dive_center_id');
        });
    }

    /**
     * Check if index exists
     */
    private function hasIndex(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();
        
        $result = $connection->select(
            "SELECT COUNT(*) as count FROM information_schema.statistics 
             WHERE table_schema = ? AND table_name = ? AND index_name = ?",
            [$database, $table, $index]
        );
        
        return $result[0]->count > 0;
    }
};

