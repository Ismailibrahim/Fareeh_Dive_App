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
        // Change service_type from enum to string
        Schema::table('price_list_items', function (Blueprint $table) {
            // For MySQL, we need to drop the enum and recreate as string
            DB::statement("ALTER TABLE price_list_items MODIFY COLUMN service_type VARCHAR(255) NOT NULL");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('price_list_items', function (Blueprint $table) {
            // Revert back to enum (you may need to adjust the values based on your needs)
            DB::statement("ALTER TABLE price_list_items MODIFY COLUMN service_type ENUM('Dive Course', 'Dive Trip', 'Dive Package', 'Equipment Rental', 'Excursion Trip') NOT NULL");
        });
    }
};

