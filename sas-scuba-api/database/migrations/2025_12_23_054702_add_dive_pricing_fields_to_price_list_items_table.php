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
        Schema::table('price_list_items', function (Blueprint $table) {
            // Add base_price column (alias for price, for clarity)
            $table->decimal('base_price', 10, 2)->nullable()->after('price');
            
            // Pricing model: SINGLE (default), RANGE, or TIERED
            $table->enum('pricing_model', ['SINGLE', 'RANGE', 'TIERED'])->default('SINGLE')->after('base_price');
            
            // Dive count range for RANGE and TIERED pricing
            $table->integer('min_dives')->default(1)->after('pricing_model');
            $table->integer('max_dives')->default(1)->after('min_dives');
            
            // Priority for conflict resolution (higher number = higher priority)
            $table->integer('priority')->default(0)->after('max_dives');
            
            // Validity period
            $table->date('valid_from')->nullable()->after('priority');
            $table->date('valid_until')->nullable()->after('valid_from');
            
            // Customer type restrictions
            $table->enum('applicable_to', ['ALL', 'MEMBER', 'NON_MEMBER', 'GROUP', 'CORPORATE'])->default('ALL')->after('valid_until');
            
            // Indexes for performance
            $table->index(['is_active', 'min_dives', 'max_dives'], 'idx_active_dives');
            $table->index(['priority'], 'idx_priority');
            $table->index(['valid_from', 'valid_until'], 'idx_validity');
        });
        
        // Copy existing price values to base_price for backward compatibility
        DB::statement('UPDATE price_list_items SET base_price = price WHERE base_price IS NULL');
        
        // Set default values for existing records
        DB::statement("UPDATE price_list_items SET pricing_model = 'SINGLE' WHERE pricing_model IS NULL");
        DB::statement('UPDATE price_list_items SET min_dives = 1 WHERE min_dives IS NULL');
        DB::statement('UPDATE price_list_items SET max_dives = 1 WHERE max_dives IS NULL');
        DB::statement('UPDATE price_list_items SET priority = 0 WHERE priority IS NULL');
        DB::statement("UPDATE price_list_items SET applicable_to = 'ALL' WHERE applicable_to IS NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('price_list_items', function (Blueprint $table) {
            $table->dropIndex('idx_active_dives');
            $table->dropIndex('idx_priority');
            $table->dropIndex('idx_validity');
            
            $table->dropColumn([
                'base_price',
                'pricing_model',
                'min_dives',
                'max_dives',
                'priority',
                'valid_from',
                'valid_until',
                'applicable_to',
            ]);
        });
    }
};
