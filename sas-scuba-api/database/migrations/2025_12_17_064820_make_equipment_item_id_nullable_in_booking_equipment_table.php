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
        if (!Schema::hasTable('booking_equipment')) {
            return;
        }

        if (!Schema::hasColumn('booking_equipment', 'equipment_item_id')) {
            return;
        }

        Schema::table('booking_equipment', function (Blueprint $table) {
            // Drop the foreign key constraint first if it exists
            $foreignKeys = $this->getForeignKeys('booking_equipment', 'equipment_item_id');
            if (!empty($foreignKeys)) {
                try {
                    $table->dropForeign(['equipment_item_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
            }
        });

        // Make the column nullable using database-specific approach
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE booking_equipment MODIFY equipment_item_id BIGINT UNSIGNED NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE booking_equipment ALTER COLUMN equipment_item_id DROP NOT NULL');
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN easily
            // Skip for SQLite - will work in production with MySQL
        }

        Schema::table('booking_equipment', function (Blueprint $table) {
            // Re-add the foreign key constraint with nullable support
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('equipment_item_id')
                      ->references('id')
                      ->on('equipment_items')
                      ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('booking_equipment')) {
            return;
        }

        Schema::table('booking_equipment', function (Blueprint $table) {
            // Drop the foreign key constraint if it exists
            $foreignKeys = $this->getForeignKeys('booking_equipment', 'equipment_item_id');
            if (!empty($foreignKeys)) {
                try {
                    $table->dropForeign(['equipment_item_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
            }
        });

        // Make the column NOT nullable again
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE booking_equipment MODIFY equipment_item_id BIGINT UNSIGNED NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE booking_equipment ALTER COLUMN equipment_item_id SET NOT NULL');
        }
        // SQLite: Cannot revert easily

        Schema::table('booking_equipment', function (Blueprint $table) {
            // Re-add the foreign key constraint
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('equipment_item_id')
                      ->references('id')
                      ->on('equipment_items')
                      ->onDelete('cascade');
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
            // If we can't check, return empty array
            return [];
        }
        return [];
    }
};
