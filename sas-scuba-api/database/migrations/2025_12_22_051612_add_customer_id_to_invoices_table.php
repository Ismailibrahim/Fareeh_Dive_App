<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('invoices')) {
            return;
        }

        // Check if customer_id already exists
        if (Schema::hasColumn('invoices', 'customer_id')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table) {
            // Drop the existing foreign key constraint on booking_id if it exists
            $foreignKeys = $this->getForeignKeys('invoices', 'booking_id');
            if (!empty($foreignKeys)) {
                $table->dropForeign(['booking_id']);
            }
        });

        // Modify booking_id to be nullable (database-agnostic approach)
        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE invoices MODIFY booking_id BIGINT UNSIGNED NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE invoices ALTER COLUMN booking_id DROP NOT NULL');
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN, need to recreate table
            DB::statement('PRAGMA foreign_keys=off');
            DB::statement('BEGIN TRANSACTION');

            // Drop existing indexes that would conflict after table recreation
            DB::statement('DROP INDEX IF EXISTS invoices_invoice_no_unique');

            // Rename existing table
            DB::statement('ALTER TABLE invoices RENAME TO invoices_old');

            // Recreate table with booking_id nullable (SQLite requires INTEGER PRIMARY KEY for AUTOINCREMENT)
            DB::statement("
                CREATE TABLE invoices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    dive_center_id INTEGER NOT NULL,
                    booking_id INTEGER NULL,
                    invoice_no VARCHAR(255) NULL,
                    invoice_date DATE NULL,
                    subtotal DECIMAL(10,2) NULL,
                    tax DECIMAL(10,2) NULL,
                    total DECIMAL(10,2) NULL,
                    currency VARCHAR(255) NULL,
                    status VARCHAR(255) DEFAULT 'Draft',
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL,
                    FOREIGN KEY (dive_center_id) REFERENCES dive_centers(id) ON DELETE CASCADE,
                    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
                )
            ");

            // Restore unique constraint on invoice_no with a non-reserved index name
            DB::statement("CREATE UNIQUE INDEX invoices_invoice_no_unique ON invoices (invoice_no)");

            // Copy data across
            DB::statement("
                INSERT INTO invoices (
                    id,
                    dive_center_id,
                    booking_id,
                    invoice_no,
                    invoice_date,
                    subtotal,
                    tax,
                    total,
                    currency,
                    status,
                    created_at,
                    updated_at
                )
                SELECT
                    id,
                    dive_center_id,
                    booking_id,
                    invoice_no,
                    invoice_date,
                    subtotal,
                    tax,
                    total,
                    currency,
                    status,
                    created_at,
                    updated_at
                FROM invoices_old
            ");

            DB::statement('DROP TABLE invoices_old');

            DB::statement('COMMIT');
            DB::statement('PRAGMA foreign_keys=on');
        }

        Schema::table('invoices', function (Blueprint $table) {
            // Re-add the foreign key constraint (now nullable) if not SQLite
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            }
            
            // Add customer_id
            $table->foreignId('customer_id')->nullable()->after('dive_center_id')->constrained('customers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('invoices')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table) {
            // Remove customer_id if it exists
            if (Schema::hasColumn('invoices', 'customer_id')) {
                $foreignKeys = $this->getForeignKeys('invoices', 'customer_id');
                if (!empty($foreignKeys)) {
                    $table->dropForeign(['customer_id']);
                }
                $table->dropColumn('customer_id');
            }
            
            // Drop and recreate booking_id foreign key as required
            $foreignKeys = $this->getForeignKeys('invoices', 'booking_id');
            if (!empty($foreignKeys)) {
                $table->dropForeign(['booking_id']);
            }
        });

        // Make booking_id required again (note: this might fail if there are null values)
        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE invoices MODIFY booking_id BIGINT UNSIGNED NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE invoices ALTER COLUMN booking_id SET NOT NULL');
        }
        // SQLite doesn't support this operation easily

        Schema::table('invoices', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            }
        });
    }

    /**
     * Get foreign keys for a column
     */
    private function getForeignKeys(string $table, string $column): array
    {
        try {
            $driver = DB::getDriverName();
            if ($driver === 'mysql' || $driver === 'mariadb') {
                $result = DB::select("
                    SELECT CONSTRAINT_NAME 
                    FROM information_schema.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = ? 
                    AND COLUMN_NAME = ? 
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ", [$table, $column]);
                return array_column($result, 'CONSTRAINT_NAME');
            } elseif ($driver === 'pgsql') {
                $result = DB::select("
                    SELECT conname as constraint_name
                    FROM pg_constraint
                    WHERE conrelid = ?::regclass
                    AND contype = 'f'
                ", [$table]);
                return array_column($result, 'constraint_name');
            }
        } catch (\Exception $e) {
            // If we can't check, assume it exists
            return ['assumed_foreign_key'];
        }
        return [];
    }
};
