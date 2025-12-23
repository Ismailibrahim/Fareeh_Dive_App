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
        Schema::table('price_list_items', function (Blueprint $table) {
            $table->boolean('is_standalone')->default(true)->after('is_active')->comment('Can be sold separately');
            $table->boolean('can_be_package_component')->default(true)->after('is_standalone');
            $table->enum('package_component_type', ['TRANSFER', 'ACCOMMODATION', 'DIVE', 'EXCURSION', 'MEAL', 'EQUIPMENT', 'OTHER'])->nullable()->after('can_be_package_component');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('price_list_items', function (Blueprint $table) {
            $table->dropColumn(['is_standalone', 'can_be_package_component', 'package_component_type']);
        });
    }
};
