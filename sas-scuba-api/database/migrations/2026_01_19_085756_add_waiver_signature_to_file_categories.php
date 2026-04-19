<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include waiver-signature
        // Note: MySQL doesn't support ALTER ENUM directly, so we need to modify the column
        DB::statement("ALTER TABLE tenant_files MODIFY COLUMN file_category ENUM(
            'customer-photo',
            'dive-certificate',
            'insurance-card',
            'equipment-photo',
            'dive-site-map',
            'service-receipt',
            'invoice',
            'waiver-signature'
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove waiver-signature from enum
        DB::statement("ALTER TABLE tenant_files MODIFY COLUMN file_category ENUM(
            'customer-photo',
            'dive-certificate',
            'insurance-card',
            'equipment-photo',
            'dive-site-map',
            'service-receipt',
            'invoice'
        )");
    }
};
