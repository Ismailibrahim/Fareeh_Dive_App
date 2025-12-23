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
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_name', 255);
            $table->enum('rule_type', ['OVERLAP_HANDLING', 'VALIDATION', 'DISCOUNT', 'SURCHARGE']);
            $table->json('condition')->nullable()->comment('Store complex conditions as JSON');
            $table->enum('action', ['APPLY_LOWEST', 'APPLY_HIGHEST_PRIORITY', 'REJECT', 'WARN']);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Index for active rules
            $table->index(['is_active', 'sort_order'], 'idx_active_rules');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
