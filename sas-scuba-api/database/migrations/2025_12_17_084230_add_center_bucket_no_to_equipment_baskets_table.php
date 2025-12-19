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
        Schema::table('equipment_baskets', function (Blueprint $table) {
            $table->string('center_bucket_no')->nullable()->after('basket_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('equipment_baskets', function (Blueprint $table) {
            $table->dropColumn('center_bucket_no');
        });
    }
};
