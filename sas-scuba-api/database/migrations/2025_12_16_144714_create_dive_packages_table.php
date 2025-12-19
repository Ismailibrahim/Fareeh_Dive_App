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
        Schema::create('dive_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('package_price_list_item_id')->nullable()->constrained('price_list_items')->onDelete('set null');
            $table->decimal('package_total_price', 10, 2);
            $table->decimal('package_per_dive_price', 10, 2)->nullable();
            $table->integer('package_total_dives');
            $table->integer('package_dives_used')->default(0);
            $table->date('package_start_date');
            $table->date('package_end_date')->nullable();
            $table->integer('package_duration_days');
            $table->enum('status', ['Active', 'Completed', 'Expired', 'Cancelled'])->default('Active');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['dive_center_id', 'customer_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dive_packages');
    }
};

