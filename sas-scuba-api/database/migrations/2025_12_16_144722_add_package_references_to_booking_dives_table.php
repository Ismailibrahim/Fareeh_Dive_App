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
            $table->foreignId('dive_package_id')->nullable()->after('price')
                  ->constrained('dive_packages')->onDelete('set null');
            $table->boolean('is_package_dive')->default(false)->after('dive_package_id');
            $table->integer('package_dive_number')->nullable()->after('is_package_dive');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_dives', function (Blueprint $table) {
            $table->dropForeign(['dive_package_id']);
            $table->dropColumn(['dive_package_id', 'is_package_dive', 'package_dive_number']);
        });
    }
};

