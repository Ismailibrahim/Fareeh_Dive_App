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
        Schema::create('dive_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_center_id')->constrained('dive_centers')->onDelete('cascade');
            $table->string('group_name');
            $table->foreignId('agent_id')->nullable()->constrained('agents')->onDelete('set null');
            $table->text('description')->nullable();
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index('dive_center_id');
            $table->index('agent_id');
            $table->index('status');
            $table->unique(['dive_center_id', 'group_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dive_groups');
    }
};

