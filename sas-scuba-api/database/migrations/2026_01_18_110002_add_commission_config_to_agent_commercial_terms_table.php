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
        Schema::table('agent_commercial_terms', function (Blueprint $table) {
            $table->boolean('exclude_equipment_from_commission')->default(false)->after('credit_limit');
            $table->boolean('include_manual_items_in_commission')->default(true)->after('exclude_equipment_from_commission');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('agent_commercial_terms')) {
            return;
        }

        Schema::table('agent_commercial_terms', function (Blueprint $table) {
            if (Schema::hasColumn('agent_commercial_terms', 'include_manual_items_in_commission')) {
                $table->dropColumn('include_manual_items_in_commission');
            }
            if (Schema::hasColumn('agent_commercial_terms', 'exclude_equipment_from_commission')) {
                $table->dropColumn('exclude_equipment_from_commission');
            }
        });
    }
};
