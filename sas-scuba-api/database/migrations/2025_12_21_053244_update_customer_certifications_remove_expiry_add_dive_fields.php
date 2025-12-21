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
        Schema::table('customer_certifications', function (Blueprint $table) {
            // Remove expiry_date column if it exists
            if (Schema::hasColumn('customer_certifications', 'expiry_date')) {
                $table->dropColumn('expiry_date');
            }
            
            // Add last_dive_date column
            if (!Schema::hasColumn('customer_certifications', 'last_dive_date')) {
                $table->date('last_dive_date')->nullable()->after('certification_date');
            }
            
            // Add no_of_dives column
            if (!Schema::hasColumn('customer_certifications', 'no_of_dives')) {
                $table->integer('no_of_dives')->nullable()->after('last_dive_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_certifications', function (Blueprint $table) {
            // Remove new columns
            if (Schema::hasColumn('customer_certifications', 'no_of_dives')) {
                $table->dropColumn('no_of_dives');
            }
            if (Schema::hasColumn('customer_certifications', 'last_dive_date')) {
                $table->dropColumn('last_dive_date');
            }
            
            // Restore expiry_date column
            if (!Schema::hasColumn('customer_certifications', 'expiry_date')) {
                $table->date('expiry_date')->nullable()->after('certification_date');
            }
        });
    }
};
