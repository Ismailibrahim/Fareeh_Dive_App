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
        // Check if table exists
        if (!Schema::hasTable('customer_certifications')) {
            Schema::create('customer_certifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
                $table->string('certification_name');
                $table->date('certification_date');
                $table->string('agency')->nullable();
                $table->string('instructor')->nullable();
                $table->string('file_url')->nullable();
                $table->timestamps();
            });
            return;
        }

        // If table exists, check and add missing columns
        Schema::table('customer_certifications', function (Blueprint $table) {
            // Add certification_date if it doesn't exist
            if (!Schema::hasColumn('customer_certifications', 'certification_date')) {
                $table->date('certification_date')->nullable()->after('certification_name');
            }
            
            // Add agency if it doesn't exist
            if (!Schema::hasColumn('customer_certifications', 'agency')) {
                $table->string('agency')->nullable()->after('certification_date');
            }
            
            // Add instructor if it doesn't exist
            if (!Schema::hasColumn('customer_certifications', 'instructor')) {
                $table->string('instructor')->nullable()->after('agency');
            }
            
            // Add file_url if it doesn't exist
            if (!Schema::hasColumn('customer_certifications', 'file_url')) {
                $table->string('file_url')->nullable()->after('instructor');
            }
            
            // Add license_status if it doesn't exist
            if (!Schema::hasColumn('customer_certifications', 'license_status')) {
                $table->boolean('license_status')->default(true)->after('file_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is meant to update the table structure
        // Reversing would require knowing the original state
        // For safety, we'll leave it as is
    }
};

