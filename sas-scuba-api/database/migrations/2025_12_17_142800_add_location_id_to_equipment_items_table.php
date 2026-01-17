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
        Schema::table('equipment_items', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('equipment_id')->constrained('locations')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        Schema::table('equipment_items', function (Blueprint $table) {
            if (Schema::hasColumn('equipment_items', 'location_id')) {
                try {
                    $table->dropForeign(['location_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
                
                $table->dropColumn('location_id');
            }
        });
    }
};
