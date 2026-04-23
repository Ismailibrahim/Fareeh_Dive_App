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
        Schema::table('boats', function (Blueprint $table) {
            $table->string('ownership_type')->default('Owned')->after('active');
            $table->date('rent_start_date')->nullable()->after('ownership_type');
            $table->date('rent_end_date')->nullable()->after('rent_start_date');
            $table->integer('tank_capacity')->nullable()->after('capacity');
        });

        // Migrate existing is_owned data to ownership_type
        if (Schema::hasColumn('boats', 'is_owned')) {
            DB::table('boats')->where('is_owned', true)->update(['ownership_type' => 'Owned']);
            DB::table('boats')->where('is_owned', false)->update(['ownership_type' => 'Rented']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('boats', function (Blueprint $table) {
            $table->dropColumn(['ownership_type', 'rent_start_date', 'rent_end_date', 'tank_capacity']);
        });
    }
};
