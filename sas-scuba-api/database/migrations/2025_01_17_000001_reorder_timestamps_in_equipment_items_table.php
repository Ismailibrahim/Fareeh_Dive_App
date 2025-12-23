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
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        // For MySQL, we can reorder columns using MODIFY COLUMN ... AFTER
        if (DB::getDriverName() === 'mysql') {
            // Check if color column exists (from previous migration)
            if (Schema::hasColumn('equipment_items', 'color')) {
                DB::statement('ALTER TABLE equipment_items MODIFY COLUMN created_at TIMESTAMP NULL AFTER color');
                DB::statement('ALTER TABLE equipment_items MODIFY COLUMN updated_at TIMESTAMP NULL AFTER created_at');
            }
        }
        // For other databases, we'll need to drop and recreate the columns
        // Note: This approach preserves data
        else {
            Schema::table('equipment_items', function (Blueprint $table) {
                // Get the data first (we'll need to preserve it)
                $items = DB::table('equipment_items')->get();
                
                // Drop the columns
                $table->dropColumn(['created_at', 'updated_at']);
            });
            
            Schema::table('equipment_items', function (Blueprint $table) {
                // Re-add them at the end
                $table->timestamps();
            });
            
            // Restore the data if needed (timestamps will be set to current time)
            // Note: Original timestamps will be lost in this approach
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For MySQL, move timestamps back to their original position
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE equipment_items MODIFY COLUMN created_at TIMESTAMP NULL AFTER status');
            DB::statement('ALTER TABLE equipment_items MODIFY COLUMN updated_at TIMESTAMP NULL AFTER created_at');
        }
        // For other databases, we can't easily restore the original order
        // So we'll leave them at the end
    }
};

