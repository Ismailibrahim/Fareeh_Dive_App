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
        if (!Schema::hasTable('price_list_items')) {
            return;
        }

        // Check if column already changed
        if (!Schema::hasColumn('price_list_items', 'service_type')) {
            return;
        }

        // Change service_type from enum to string
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE price_list_items MODIFY COLUMN service_type VARCHAR(255) NOT NULL");
        } elseif ($driver === 'pgsql') {
            // PostgreSQL: Change enum to varchar
            DB::statement("ALTER TABLE price_list_items ALTER COLUMN service_type TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE price_list_items ALTER COLUMN service_type SET NOT NULL");
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN for type changes
            // This would require recreating the table, which is complex
            // For now, we'll skip this migration on SQLite
            // In production with MySQL, this will work fine
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('price_list_items')) {
            return;
        }

        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE price_list_items MODIFY COLUMN service_type ENUM('Dive Course', 'Dive Trip', 'Dive Package', 'Equipment Rental', 'Excursion Trip') NOT NULL");
        } elseif ($driver === 'pgsql') {
            // PostgreSQL: Create enum type first if it doesn't exist
            DB::statement("DO $$ BEGIN
                CREATE TYPE service_type_enum AS ENUM('Dive Course', 'Dive Trip', 'Dive Package', 'Equipment Rental', 'Excursion Trip');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;");
            DB::statement("ALTER TABLE price_list_items ALTER COLUMN service_type TYPE service_type_enum USING service_type::service_type_enum");
            DB::statement("ALTER TABLE price_list_items ALTER COLUMN service_type SET NOT NULL");
        }
        // SQLite: Cannot revert easily
    }
};

