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
        Schema::create('price_list_item_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('price_list_items')->onDelete('cascade');
            $table->string('tier_name', 100)->nullable();
            $table->integer('from_dives')->comment('Starting dive count for this tier');
            $table->integer('to_dives')->comment('Ending dive count for this tier');
            $table->decimal('price_per_dive', 10, 2)->comment('Price per dive in this tier');
            $table->decimal('total_price', 10, 2)->nullable()->comment('Optional fixed total price for package');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            // Indexes
            $table->index(['item_id', 'from_dives'], 'idx_item_tiers');
            
            // Check constraint: from_dives <= to_dives
            // Note: MySQL doesn't support check constraints in older versions, so we'll validate in the model
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_list_item_tiers');
    }
};
