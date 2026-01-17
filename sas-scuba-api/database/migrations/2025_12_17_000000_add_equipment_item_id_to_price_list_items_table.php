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
        Schema::table('price_list_items', function (Blueprint $table) {
            $table->foreignId('equipment_item_id')->nullable()->after('service_type')->constrained('equipment_items')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('price_list_items')) {
            return;
        }

        Schema::table('price_list_items', function (Blueprint $table) {
            if (Schema::hasColumn('price_list_items', 'equipment_item_id')) {
                try {
                    $table->dropForeign(['equipment_item_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
                $table->dropColumn('equipment_item_id');
            }
        });
    }
};

