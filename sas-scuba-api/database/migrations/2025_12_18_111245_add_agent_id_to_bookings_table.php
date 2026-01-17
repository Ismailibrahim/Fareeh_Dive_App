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
            $table->foreignId('agent_id')->nullable()->after('customer_id')->constrained('agents')->onDelete('set null');
            $table->index('agent_id');
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
            if (Schema::hasColumn('bookings', 'agent_id')) {
                try {
                    $table->dropForeign(['agent_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
                
                try {
                    $table->dropIndex(['agent_id']);
                } catch (\Exception $e) {
                    // Index might not exist, continue
                }
                
                $table->dropColumn('agent_id');
            }
        });
    }
};
