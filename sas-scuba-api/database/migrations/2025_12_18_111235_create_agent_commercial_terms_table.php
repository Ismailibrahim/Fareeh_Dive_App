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
        Schema::create('agent_commercial_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('agents')->onDelete('cascade')->unique();
            $table->enum('commission_type', ['Percentage', 'Fixed Amount']);
            $table->decimal('commission_rate', 10, 2);
            $table->string('currency');
            $table->boolean('vat_applicable')->default(false);
            $table->string('tax_registration_no')->nullable();
            $table->enum('payment_terms', ['Prepaid', 'Weekly', 'Monthly', 'On Invoice']);
            $table->decimal('credit_limit', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_commercial_terms');
    }
};
