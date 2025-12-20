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
        // Main file registry table
        if (!Schema::hasTable('tenant_files')) {
            Schema::create('tenant_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('entity_type'); // customer, equipment, dive_site, invoice, etc.
            $table->string('entity_id'); // ID of the related entity (can be UUID or regular ID)
            $table->enum('file_category', [
                'customer-photo',
                'dive-certificate',
                'insurance-card',
                'equipment-photo',
                'dive-site-map',
                'service-receipt',
                'invoice'
            ]);
            $table->string('original_name', 255);
            $table->string('storage_path', 500);
            $table->unsignedBigInteger('file_size');
            $table->string('mime_type', 100);
            $table->string('storage_driver', 20)->default('local');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Indexes for performance
            $table->index('tenant_id');
            $table->index(['entity_type', 'entity_id']);
            $table->index('file_category');
            $table->index('uploaded_by');
            });
        }

        // Storage usage tracking table
        if (!Schema::hasTable('tenant_storage_usage')) {
            Schema::create('tenant_storage_usage', function (Blueprint $table) {
            $table->foreignId('tenant_id')->primary()->constrained('dive_centers')->onDelete('cascade');
            $table->unsignedBigInteger('storage_bytes')->default(0);
            $table->unsignedInteger('file_count')->default(0);
            $table->timestamp('last_updated')->useCurrent()->useCurrentOnUpdate();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_storage_usage');
        Schema::dropIfExists('tenant_files');
    }
};
