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
        Schema::table('dive_sites', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('description');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->string('location')->nullable()->after('longitude');
            $table->integer('pax_capacity')->nullable()->after('location');
            $table->string('attachment')->nullable()->after('pax_capacity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dive_sites', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'location', 'pax_capacity', 'attachment']);
        });
    }
};
