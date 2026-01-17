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
        if (!Schema::hasTable('price_lists')) {
            return;
        }

        Schema::table('price_lists', function (Blueprint $table) {
            // Drop foreign key constraint first if it exists
            $foreignKeys = $this->getForeignKeys('price_lists', 'dive_center_id');
            if (!empty($foreignKeys)) {
                try {
                    $table->dropForeign(['dive_center_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
            }
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Remove unique constraint to allow multiple price lists per dive center
            // Check if unique constraint exists first
            $indexes = $this->getIndexes('price_lists', 'dive_center_id');
            $hasUnique = false;
            foreach ($indexes as $index) {
                if ($index->Non_unique == 0) {
                    $hasUnique = true;
                    break;
                }
            }
            
            if ($hasUnique) {
                try {
                    $table->dropUnique(['dive_center_id']);
                } catch (\Exception $e) {
                    // Unique constraint might not exist, continue
                }
            }
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Recreate foreign key constraint without unique
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('dive_center_id')->references('id')->on('dive_centers')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('price_lists')) {
            return;
        }

        Schema::table('price_lists', function (Blueprint $table) {
            // Drop foreign key constraint first if it exists
            $foreignKeys = $this->getForeignKeys('price_lists', 'dive_center_id');
            if (!empty($foreignKeys)) {
                try {
                    $table->dropForeign(['dive_center_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
            }
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Restore unique constraint (one price list per dive center)
            // Check if unique constraint already exists
            $indexes = $this->getIndexes('price_lists', 'dive_center_id');
            $hasUnique = false;
            foreach ($indexes as $index) {
                if ($index->Non_unique == 0) {
                    $hasUnique = true;
                    break;
                }
            }
            
            if (!$hasUnique) {
                try {
                    $table->unique('dive_center_id');
                } catch (\Exception $e) {
                    // Unique constraint might already exist, continue
                }
            }
        });
        
        Schema::table('price_lists', function (Blueprint $table) {
            // Recreate foreign key constraint with unique
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('dive_center_id')->references('id')->on('dive_centers')->onDelete('cascade');
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

    /**
     * Get indexes for a column
     */
    private function getIndexes(string $table, string $column): array
    {
        try {
            $driver = DB::getDriverName();
            if ($driver === 'mysql' || $driver === 'mariadb') {
                return DB::select("SHOW INDEX FROM `{$table}` WHERE Column_name = ?", [$column]);
            }
        } catch (\Exception $e) {
            // If we can't check, return empty array
            return [];
        }
        return [];
    }
};
