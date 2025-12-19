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
        if (Schema::hasTable('locations')) {
            Schema::table('locations', function (Blueprint $table) {
                $columnsToDrop = [];
                if (Schema::hasColumn('locations', 'address')) {
                    $columnsToDrop[] = 'address';
                }
                if (Schema::hasColumn('locations', 'city')) {
                    $columnsToDrop[] = 'city';
                }
                if (Schema::hasColumn('locations', 'state')) {
                    $columnsToDrop[] = 'state';
                }
                if (Schema::hasColumn('locations', 'zip')) {
                    $columnsToDrop[] = 'zip';
                }
                if (Schema::hasColumn('locations', 'country')) {
                    $columnsToDrop[] = 'country';
                }
                
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->string('address')->nullable()->after('description');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('zip')->nullable()->after('state');
            $table->string('country')->nullable()->after('zip');
        });
    }
};

