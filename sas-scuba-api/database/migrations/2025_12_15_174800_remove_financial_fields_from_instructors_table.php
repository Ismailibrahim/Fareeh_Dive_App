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
        Schema::table('instructors', function (Blueprint $table) {
            $table->dropColumn([
                'hourly_rate',
                'commission_percentage',
                'tax_id',
                'bank_account_details',
                'payment_method',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('instructors', function (Blueprint $table) {
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('commission_percentage', 5, 2)->nullable();
            $table->string('tax_id')->nullable();
            $table->json('bank_account_details')->nullable();
            $table->string('payment_method')->nullable();
        });
    }
};
