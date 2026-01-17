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
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('dive_group_id')->nullable()->after('agent_id')->constrained('dive_groups')->onDelete('set null');
            $table->index('dive_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'dive_group_id')) {
                try {
                    $table->dropForeign(['dive_group_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
                
                try {
                    $table->dropIndex(['dive_group_id']);
                } catch (\Exception $e) {
                    // Index might not exist, continue
                }
                
                $table->dropColumn('dive_group_id');
            }
        });
    }
};

