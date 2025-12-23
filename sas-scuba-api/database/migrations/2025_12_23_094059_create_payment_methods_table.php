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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->enum('method_type', ['Bank Transfer', 'Crypto', 'Credit Card', 'Wallet', 'Cash']);
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('dive_center_id');
            $table->index('method_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
