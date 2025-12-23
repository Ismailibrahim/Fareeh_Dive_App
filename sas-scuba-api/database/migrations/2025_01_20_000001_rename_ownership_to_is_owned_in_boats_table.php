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
        // Check if table exists before trying to alter it
        if (!Schema::hasTable('boats')) {
            return;
        }

        // Check if ownership column exists (from previous migration)
        if (!Schema::hasColumn('boats', 'ownership')) {
            return;
        }

        // Use raw SQL for better compatibility across database systems
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE boats CHANGE ownership is_owned BOOLEAN DEFAULT TRUE');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE boats RENAME COLUMN ownership TO is_owned');
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support column renaming directly, need to recreate table
            // This is a simplified approach - in production, you'd want to preserve data
            DB::statement('ALTER TABLE boats RENAME TO boats_old');
            DB::statement('CREATE TABLE boats (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                dive_center_id BIGINT UNSIGNED NOT NULL,
                name VARCHAR(255) NOT NULL,
                capacity INTEGER NULL,
                active BOOLEAN DEFAULT TRUE,
                is_owned BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                FOREIGN KEY (dive_center_id) REFERENCES dive_centers(id) ON DELETE CASCADE
            )');
            DB::statement('INSERT INTO boats SELECT id, dive_center_id, name, capacity, active, ownership as is_owned, created_at, updated_at FROM boats_old');
            DB::statement('DROP TABLE boats_old');
        } else {
            // Fallback: try renameColumn if doctrine/dbal is installed
            Schema::table('boats', function (Blueprint $table) {
                $table->renameColumn('ownership', 'is_owned');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('boats')) {
            return;
        }

        // Check if is_owned column exists
        if (!Schema::hasColumn('boats', 'is_owned')) {
            return;
        }

        $driver = DB::getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE boats CHANGE is_owned ownership BOOLEAN DEFAULT TRUE');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE boats RENAME COLUMN is_owned TO ownership');
        } elseif ($driver === 'sqlite') {
            // Similar approach for SQLite rollback
            DB::statement('ALTER TABLE boats RENAME TO boats_old');
            DB::statement('CREATE TABLE boats (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                dive_center_id BIGINT UNSIGNED NOT NULL,
                name VARCHAR(255) NOT NULL,
                capacity INTEGER NULL,
                active BOOLEAN DEFAULT TRUE,
                ownership BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                FOREIGN KEY (dive_center_id) REFERENCES dive_centers(id) ON DELETE CASCADE
            )');
            DB::statement('INSERT INTO boats SELECT id, dive_center_id, name, capacity, active, is_owned as ownership, created_at, updated_at FROM boats_old');
            DB::statement('DROP TABLE boats_old');
        } else {
            Schema::table('boats', function (Blueprint $table) {
                $table->renameColumn('is_owned', 'ownership');
            });
        }
    }
};

