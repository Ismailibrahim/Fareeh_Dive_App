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
        Schema::create('instructors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            
            // Core Certification Fields
            $table->string('instructor_number')->nullable();
            $table->string('certification_agency')->nullable(); // PADI, SSI, NAUI, CMAS, etc.
            $table->string('certification_level')->nullable(); // Open Water Instructor, Advanced, Master, Course Director
            $table->date('certification_date')->nullable();
            $table->date('certification_expiry')->nullable();
            $table->enum('instructor_status', ['Active', 'Suspended', 'Expired'])->default('Active');
            
            // Qualifications
            $table->json('specializations')->nullable(); // Array: ["Night Diver", "Wreck Diver", "Deep Diver"]
            $table->json('languages_spoken')->nullable(); // Array: ["English", "Spanish", "French"]
            $table->integer('max_depth_authorized')->nullable(); // Maximum depth in meters
            $table->integer('max_students_per_class')->nullable(); // Max student-to-instructor ratio
            
            // Financial
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('commission_percentage', 5, 2)->nullable(); // Default commission rate
            $table->string('tax_id')->nullable();
            $table->json('bank_account_details')->nullable(); // Sensitive payment info
            $table->string('payment_method')->nullable(); // Preferred payment method
            
            // Contact & Emergency
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();
            $table->text('address')->nullable();
            $table->string('nationality')->nullable();
            $table->string('passport_number')->nullable();
            
            // Availability & Schedule
            $table->enum('availability_status', ['Available', 'Unavailable', 'On Leave'])->default('Available');
            $table->json('preferred_dive_times')->nullable(); // Array of preferred times
            $table->integer('max_dives_per_day')->nullable();
            
            // Medical & Insurance
            $table->date('medical_certificate_expiry')->nullable();
            $table->string('insurance_provider')->nullable();
            $table->string('insurance_policy_number')->nullable();
            $table->date('insurance_expiry')->nullable();
            
            // Professional History
            $table->integer('years_of_experience')->nullable();
            $table->integer('total_dives_logged')->nullable();
            $table->integer('total_students_certified')->nullable();
            $table->text('bio')->nullable();
            $table->string('profile_photo_url')->nullable();
            
            // Documents
            $table->string('certificate_file_url')->nullable();
            $table->string('insurance_file_url')->nullable();
            $table->string('contract_file_url')->nullable();
            
            // Metadata
            $table->text('notes')->nullable();
            $table->date('hired_date')->nullable();
            $table->date('last_evaluation_date')->nullable();
            $table->decimal('performance_rating', 3, 2)->nullable(); // e.g., 4.5/5.0
            
            $table->timestamps();
            
            // Indexes
            $table->index('instructor_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instructors');
    }
};
