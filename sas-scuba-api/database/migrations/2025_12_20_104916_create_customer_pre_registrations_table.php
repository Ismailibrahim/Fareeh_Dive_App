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
        if (!Schema::hasTable('customer_pre_registrations')) {
            Schema::create('customer_pre_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('token')->unique();
            $table->datetime('expires_at');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // Customer data (basic info)
            $table->json('customer_data');
            
            // Related data
            $table->json('emergency_contacts_data')->nullable();
            $table->json('certifications_data')->nullable();
            $table->json('insurance_data')->nullable();
            $table->json('accommodation_data')->nullable();
            
            // Submission tracking
            $table->datetime('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->datetime('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            
            // Link to created customer (if approved)
            $table->foreignId('created_customer_id')->nullable()->constrained('customers')->onDelete('set null');
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('token');
            $table->index('status');
            $table->index('dive_center_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_pre_registrations');
    }
};
