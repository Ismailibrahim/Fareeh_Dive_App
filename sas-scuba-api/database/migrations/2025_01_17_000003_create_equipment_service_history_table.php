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
        // Check if equipment_items table exists before creating this table
        // This migration may run before the base schema migration
        if (!Schema::hasTable('equipment_items')) {
            return;
        }

        // Check if table doesn't already exist
        if (!Schema::hasTable('equipment_service_history')) {
            Schema::create('equipment_service_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('equipment_item_id')->constrained('equipment_items')->onDelete('cascade');
                $table->date('service_date');
                $table->string('service_type')->nullable();
                $table->string('technician')->nullable();
                $table->string('service_provider')->nullable();
                $table->decimal('cost', 10, 2)->nullable();
                $table->text('notes')->nullable();
                $table->text('parts_replaced')->nullable();
                $table->text('warranty_info')->nullable();
                $table->date('next_service_due_date')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_service_history');
    }
};

