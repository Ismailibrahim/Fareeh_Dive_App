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
        Schema::table('customer_medical_forms', function (Blueprint $table) {
            $table->foreignId('waiver_signature_id')->nullable()->constrained('waiver_signatures')->onDelete('set null');
            $table->enum('status', ['draft', 'signed', 'expired', 'invalid'])->default('draft');
            $table->date('expires_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_medical_forms', function (Blueprint $table) {
            $table->dropForeign(['waiver_signature_id']);
            $table->dropColumn(['waiver_signature_id', 'status', 'expires_at']);
        });
    }
};
