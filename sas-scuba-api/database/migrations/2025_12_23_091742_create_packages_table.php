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
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('package_code', 50);
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->integer('nights')->default(0);
            $table->integer('days')->default(0);
            $table->integer('total_dives')->default(0);
            $table->decimal('base_price', 10, 2)->comment('Total package price');
            $table->decimal('price_per_person', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->softDeletes();
            $table->timestamps();
            
            // Unique constraint: package_code must be unique per dive center
            $table->unique(['dive_center_id', 'package_code'], 'idx_package_code_unique');
            $table->index(['is_active', 'sort_order'], 'idx_active_package');
            $table->index(['dive_center_id', 'is_active'], 'idx_dive_center_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
