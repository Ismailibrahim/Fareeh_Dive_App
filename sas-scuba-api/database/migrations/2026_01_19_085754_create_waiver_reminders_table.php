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
        Schema::create('waiver_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waiver_signature_id')->constrained('waiver_signatures')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->enum('reminder_type', ['expiring_soon', 'expired', 'missing'])->default('expiring_soon');
            $table->enum('channel', ['email', 'sms', 'push'])->default('email');
            $table->timestamp('sent_at')->nullable();
            $table->boolean('is_sent')->default(false);
            $table->text('message')->nullable();
            $table->timestamps();
            
            $table->index(['customer_id', 'is_sent']);
            $table->index(['waiver_signature_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waiver_reminders');
    }
};
