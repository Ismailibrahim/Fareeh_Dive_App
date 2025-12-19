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
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('agent_name');
            $table->enum('agent_type', ['Travel Agent', 'Resort / Guest House', 'Tour Operator', 'Freelancer']);
            $table->string('country');
            $table->string('city');
            $table->enum('status', ['Active', 'Suspended'])->default('Active');
            $table->string('brand_name')->nullable();
            $table->string('website')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('dive_center_id');
            $table->index('status');
            $table->index('agent_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};
