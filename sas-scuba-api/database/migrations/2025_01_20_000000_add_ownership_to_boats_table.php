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
        if (!Schema::hasTable('boats')) {
            return;
        }

        Schema::table('boats', function (Blueprint $table) {
            // Check if column doesn't already exist
            if (!Schema::hasColumn('boats', 'ownership')) {
                $table->boolean('ownership')->default(true)->after('active');
                // true = Owned, false = Rented
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('boats')) {
            return;
        }

        Schema::table('boats', function (Blueprint $table) {
            if (Schema::hasColumn('boats', 'ownership')) {
                $table->dropColumn('ownership');
            }
        });
    }
};

