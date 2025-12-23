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
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['dive_group_id']);
            $table->dropIndex(['dive_group_id']);
            $table->dropColumn('dive_group_id');
        });
    }
};

