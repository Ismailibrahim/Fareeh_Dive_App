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
        Schema::create('dive_logs', function (Blueprint $table) {
            $table->id();
            
            // Core Information
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('dive_site_id')->constrained('dive_sites')->onDelete('cascade');
            $table->date('dive_date');
            $table->time('entry_time');
            $table->time('exit_time');
            $table->integer('total_dive_time')->nullable()->comment('Duration in minutes');
            
            // Dive Details
            $table->decimal('max_depth', 5, 2);
            $table->foreignId('boat_id')->nullable()->constrained('boats')->onDelete('set null');
            $table->enum('dive_type', ['Recreational', 'Training', 'Technical', 'Night', 'Wreck', 'Cave', 'Drift', 'Other']);
            $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Conditions
            $table->decimal('visibility', 5, 2)->nullable();
            $table->enum('visibility_unit', ['meters', 'feet'])->default('meters');
            $table->decimal('current', 5, 2)->nullable();
            $table->enum('current_unit', ['knots', 'm/s'])->default('knots');
            
            // Equipment
            $table->decimal('tank_size', 5, 2)->nullable();
            $table->enum('tank_size_unit', ['liters', 'cubic_feet'])->default('liters');
            $table->enum('gas_mix', ['Air', 'Nitrox', 'Trimix']);
            $table->decimal('starting_pressure', 5, 2)->nullable();
            $table->decimal('ending_pressure', 5, 2)->nullable();
            $table->enum('pressure_unit', ['bar', 'psi'])->default('bar');
            
            // Metadata
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['dive_center_id', 'customer_id', 'dive_date']);
            $table->index('dive_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dive_logs');
    }
};
