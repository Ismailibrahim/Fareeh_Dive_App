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
        Schema::table('customers', function (Blueprint $table) {
            $table->date('departure_date')->nullable()->after('nationality');
            $table->string('departure_flight')->nullable()->after('departure_date');
            $table->string('departure_to')->nullable()->after('departure_flight');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'departure_date',
                'departure_flight',
                'departure_to',
            ]);
        });
    }
};
