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
        Schema::table('booking_dives', function (Blueprint $table) {
            $table->integer('dive_duration')->nullable()->after('price');
            $table->decimal('max_depth', 5, 2)->nullable()->after('dive_duration');
            $table->enum('status', ['Scheduled', 'In Progress', 'Completed', 'Cancelled'])
                  ->default('Scheduled')->after('max_depth');
            $table->timestamp('completed_at')->nullable()->after('status');
            $table->text('dive_log_notes')->nullable()->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_dives', function (Blueprint $table) {
            $table->dropColumn([
                'dive_duration',
                'max_depth',
                'status',
                'completed_at',
                'dive_log_notes'
            ]);
        });
    }
};
