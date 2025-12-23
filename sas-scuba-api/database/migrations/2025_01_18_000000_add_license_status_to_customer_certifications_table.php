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
        if (!Schema::hasTable('customer_certifications')) {
            return;
        }

        Schema::table('customer_certifications', function (Blueprint $table) {
            // Add license_status if it doesn't exist
            if (!Schema::hasColumn('customer_certifications', 'license_status')) {
                $table->boolean('license_status')->default(true)->after('file_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('customer_certifications')) {
            return;
        }

        Schema::table('customer_certifications', function (Blueprint $table) {
            if (Schema::hasColumn('customer_certifications', 'license_status')) {
                $table->dropColumn('license_status');
            }
        });
    }
};

