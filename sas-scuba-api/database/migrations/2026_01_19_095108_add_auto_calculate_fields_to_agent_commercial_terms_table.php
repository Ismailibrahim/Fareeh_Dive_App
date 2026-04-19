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
        Schema::table('agent_commercial_terms', function (Blueprint $table) {
            $table->boolean('auto_calculate_on_invoice')->default(false)->after('include_manual_items_in_commission');
            $table->boolean('auto_calculate_on_payment')->default(false)->after('auto_calculate_on_invoice');
            $table->enum('calculation_trigger', ['invoice_created', 'invoice_paid', 'manual'])->default('manual')->after('auto_calculate_on_payment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agent_commercial_terms', function (Blueprint $table) {
            $table->dropColumn(['auto_calculate_on_invoice', 'auto_calculate_on_payment', 'calculation_trigger']);
        });
    }
};
