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
        Schema::create('waivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('name'); // e.g., "Liability Release", "PADI Medical Questionnaire"
            $table->string('slug')->unique(); // URL-friendly identifier
            $table->enum('type', ['liability', 'medical', 'checklist', 'custom'])->default('custom');
            $table->text('description')->nullable();
            
            // Form content - supports HTML/rich text
            $table->longText('content'); // Main form content/template
            $table->json('fields')->nullable(); // Dynamic form fields configuration
            $table->json('translations')->nullable(); // Multi-language content
            
            // Configuration
            $table->boolean('requires_signature')->default(true);
            $table->integer('expiry_days')->nullable(); // Days until signature expires
            $table->boolean('require_witness')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            
            // QR Code settings
            $table->boolean('generate_qr_code')->default(false);
            $table->string('qr_code_url')->nullable();
            
            // Metadata
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['dive_center_id', 'is_active']);
            $table->index(['dive_center_id', 'type']);
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waivers');
    }
};
