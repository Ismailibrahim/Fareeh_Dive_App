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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('contact_no')->nullable();
            $table->string('email')->nullable();
            $table->string('gst_tin')->nullable();
            $table->enum('currency', ['USD', 'MVR'])->default('MVR');
            $table->enum('status', ['Active', 'Suspended'])->default('Active');
            $table->timestamps();
            
            // Unique constraint: supplier name must be unique per dive center
            $table->unique(['dive_center_id', 'name']);
            
            // Indexes for performance
            $table->index('dive_center_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
