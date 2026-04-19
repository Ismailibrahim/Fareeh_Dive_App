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
        Schema::create('waiver_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waiver_id')->constrained('waivers')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->onDelete('set null');
            
            // Signature data
            $table->text('signature_data'); // Base64 encoded signature image
            $table->string('signature_format')->default('png'); // png, svg, etc.
            $table->json('form_data')->nullable(); // Store form field responses
            
            // Signing context
            $table->foreignId('signed_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('witness_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('signed_at');
            
            // Expiration
            $table->date('expires_at')->nullable();
            $table->boolean('is_valid')->default(true);
            $table->timestamp('invalidated_at')->nullable();
            $table->text('invalidation_reason')->nullable();
            
            // Verification
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_notes')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['customer_id', 'waiver_id', 'is_valid']);
            $table->index(['customer_id', 'is_valid', 'expires_at']);
            $table->index(['booking_id']);
            $table->index(['waiver_id', 'is_valid']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waiver_signatures');
    }
};
