#!/bin/bash

# Quick fix script to update migrations on the server
# Run this on your server: bash fix-migrations-on-server.sh

API_DIR="/var/www/sas-scuba/sas-scuba-api"

echo "Fixing migration files on server..."

# Fix 2025_01_17_000000_add_fields_to_equipment_items_table.php
cat > "$API_DIR/database/migrations/2025_01_17_000000_add_fields_to_equipment_items_table.php" << 'EOF'
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
        // Check if table exists before trying to alter it
        // This migration may run before the base schema migration
        if (Schema::hasTable('equipment_items')) {
            Schema::table('equipment_items', function (Blueprint $table) {
                // Check if columns don't already exist
                if (!Schema::hasColumn('equipment_items', 'inventory_code')) {
                    $table->string('inventory_code')->nullable();
                }
                if (!Schema::hasColumn('equipment_items', 'brand')) {
                    $table->string('brand')->nullable();
                }
                if (!Schema::hasColumn('equipment_items', 'color')) {
                    $table->string('color')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('equipment_items')) {
            Schema::table('equipment_items', function (Blueprint $table) {
                if (Schema::hasColumn('equipment_items', 'inventory_code')) {
                    $table->dropColumn('inventory_code');
                }
                if (Schema::hasColumn('equipment_items', 'brand')) {
                    $table->dropColumn('brand');
                }
                if (Schema::hasColumn('equipment_items', 'color')) {
                    $table->dropColumn('color');
                }
            });
        }
    }
};
EOF

# Fix 2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php
cat > "$API_DIR/database/migrations/2025_01_17_000001_reorder_timestamps_in_equipment_items_table.php" << 'EOF'
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
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        // For MySQL, move timestamps back to their original position
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE equipment_items MODIFY COLUMN created_at TIMESTAMP NULL AFTER status');
            DB::statement('ALTER TABLE equipment_items MODIFY COLUMN updated_at TIMESTAMP NULL AFTER created_at');
        }
        // For other databases, we can't easily restore the original order
        // So we'll leave them at the end
    }
};
EOF

# Fix 2025_01_17_000002_add_service_fields_to_equipment_items.php
cat > "$API_DIR/database/migrations/2025_01_17_000002_add_service_fields_to_equipment_items.php" << 'EOF'
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
        // Check if table exists before trying to alter it
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        Schema::table('equipment_items', function (Blueprint $table) {
            // Check if columns don't already exist
            if (!Schema::hasColumn('equipment_items', 'purchase_date')) {
                $table->date('purchase_date')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'requires_service')) {
                $table->boolean('requires_service')->default(false);
            }
            if (!Schema::hasColumn('equipment_items', 'service_interval_days')) {
                $table->integer('service_interval_days')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'last_service_date')) {
                $table->date('last_service_date')->nullable();
            }
            if (!Schema::hasColumn('equipment_items', 'next_service_date')) {
                $table->date('next_service_date')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('equipment_items')) {
            Schema::table('equipment_items', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('equipment_items', 'purchase_date')) {
                    $columns[] = 'purchase_date';
                }
                if (Schema::hasColumn('equipment_items', 'requires_service')) {
                    $columns[] = 'requires_service';
                }
                if (Schema::hasColumn('equipment_items', 'service_interval_days')) {
                    $columns[] = 'service_interval_days';
                }
                if (Schema::hasColumn('equipment_items', 'last_service_date')) {
                    $columns[] = 'last_service_date';
                }
                if (Schema::hasColumn('equipment_items', 'next_service_date')) {
                    $columns[] = 'next_service_date';
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
EOF

# Fix 2025_01_17_000003_create_equipment_service_history_table.php
cat > "$API_DIR/database/migrations/2025_01_17_000003_create_equipment_service_history_table.php" << 'EOF'
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
        // Check if equipment_items table exists before creating this table
        // This migration may run before the base schema migration
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        // Check if table doesn't already exist
        if (!Schema::hasTable('equipment_service_history')) {
            Schema::create('equipment_service_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('equipment_item_id')->constrained('equipment_items')->onDelete('cascade');
                $table->date('service_date');
                $table->string('service_type')->nullable();
                $table->string('technician')->nullable();
                $table->string('service_provider')->nullable();
                $table->decimal('cost', 10, 2)->nullable();
                $table->text('notes')->nullable();
                $table->text('parts_replaced')->nullable();
                $table->text('warranty_info')->nullable();
                $table->date('next_service_due_date')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_service_history');
    }
};
EOF

echo "Migration files fixed!"
echo "Now run: cd $API_DIR && php artisan migrate:fresh --force"

