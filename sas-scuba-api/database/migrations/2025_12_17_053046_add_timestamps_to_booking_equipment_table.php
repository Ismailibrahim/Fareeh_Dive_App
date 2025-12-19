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
        Schema::table('booking_equipment', function (Blueprint $table) {
            // Check if timestamps columns don't exist before adding
            if (!Schema::hasColumn('booking_equipment', 'created_at')) {
                $table->timestamp('created_at')->nullable()->after('assignment_status');
            }
            if (!Schema::hasColumn('booking_equipment', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_equipment', function (Blueprint $table) {
            if (Schema::hasColumn('booking_equipment', 'created_at')) {
                $table->dropColumn('created_at');
            }
            if (Schema::hasColumn('booking_equipment', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
        });
    }
};
