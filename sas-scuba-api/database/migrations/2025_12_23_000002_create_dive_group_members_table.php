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
        Schema::create('dive_group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dive_group_id')->constrained('dive_groups')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
            
            $table->unique(['dive_group_id', 'customer_id']);
            $table->index('dive_group_id');
            $table->index('customer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dive_group_members');
    }
};

